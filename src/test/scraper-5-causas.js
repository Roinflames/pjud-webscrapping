/**
 * SCRAPER PARA 5 CAUSAS DE PRUEBA
 * 
 * Este script procesa las 5 causas de prueba definidas en causas_test.json
 * con soporte completo para:
 * - Extracción de movimientos por etapa del juicio
 * - Descarga de todos los PDFs (azul y rojo)
 * - Descarga de eBook
 * - Registro de errores para evitar loops infinitos
 * - Almacenamiento en MySQL/MariaDB
 * 
 * Uso: node src/test/scraper-5-causas.js [--dry-run] [--causa=RIT]
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Módulos del proyecto
const { startBrowser } = require('../browser');
const { fillForm, openDetalle } = require('../form');
const { closeModalIfExists, goToConsultaCausas } = require('../navigation');
const { extractTable, extractTableAsArray } = require('../table');
const { downloadEbook } = require('../ebook');
const { hayCuaderno, extraerCuadernosYMovimientos, seleccionarCuaderno, obtenerOpcionesCuaderno } = require('../cuadernos');
const { saveErrorEvidence } = require('../utils');
const { processTableData, exportStructuredJSON } = require('../dataProcessor');
const { upsertCausa, upsertMovimiento, registrarPdf, registrarEbook, getCausaByRit, query } = require('../database/db-mariadb');

// Configuración
const CONFIG_PATH = path.resolve(__dirname, '../config/causas_test.json');
const OUTPUT_DIR = path.resolve(__dirname, '../outputs');
const PDF_DIR = path.resolve(__dirname, '../outputs/pdfs');
const EBOOK_DIR = path.resolve(__dirname, '../outputs/ebooks');
const LOG_DIR = path.resolve(__dirname, '../logs');
const ERRORS_FILE = path.resolve(__dirname, '../logs/errores_scraping.json');

// Crear directorios necesarios
[OUTPUT_DIR, PDF_DIR, EBOOK_DIR, LOG_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/**
 * Sistema de registro de errores para evitar loops infinitos
 */
class ErrorRegistry {
  constructor(filePath) {
    this.filePath = filePath;
    this.errors = this.load();
  }

  load() {
    if (fs.existsSync(this.filePath)) {
      try {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.errors, null, 2), 'utf-8');
  }

  registrar(rit, tipoError, mensaje, stackTrace = null) {
    const key = `${rit}:${tipoError}`;
    if (!this.errors[key]) {
      this.errors[key] = {
        rit,
        tipo_error: tipoError,
        mensaje,
        stack_trace: stackTrace,
        intentos: 0,
        primer_intento: new Date().toISOString(),
        ultimo_intento: null,
        resuelto: false
      };
    }
    this.errors[key].intentos++;
    this.errors[key].ultimo_intento = new Date().toISOString();
    this.errors[key].mensaje = mensaje;
    this.save();
    return this.errors[key];
  }

  debeReintentar(rit, tipoError, maxIntentos = 3) {
    const key = `${rit}:${tipoError}`;
    if (!this.errors[key]) return true;
    if (this.errors[key].resuelto) return true;
    return this.errors[key].intentos < maxIntentos;
  }

  marcarResuelto(rit, tipoError = null) {
    if (tipoError) {
      const key = `${rit}:${tipoError}`;
      if (this.errors[key]) {
        this.errors[key].resuelto = true;
        this.errors[key].fecha_resolucion = new Date().toISOString();
      }
    } else {
      // Marcar todos los errores de este RIT como resueltos
      Object.keys(this.errors).forEach(key => {
        if (key.startsWith(`${rit}:`)) {
          this.errors[key].resuelto = true;
          this.errors[key].fecha_resolucion = new Date().toISOString();
        }
      });
    }
    this.save();
  }

  getErroresPendientes() {
    return Object.values(this.errors).filter(e => !e.resuelto);
  }

  getResumen() {
    const errores = Object.values(this.errors);
    return {
      total: errores.length,
      pendientes: errores.filter(e => !e.resuelto).length,
      resueltos: errores.filter(e => e.resuelto).length,
      por_tipo: errores.reduce((acc, e) => {
        acc[e.tipo_error] = (acc[e.tipo_error] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

/**
 * Mapeo de tipos de movimiento a etapas del juicio
 */
const ETAPAS_MAPPING = {
  'Ingreso': 'INGRESO',
  'Inicio de la Tramitación': 'INICIO_TRAMITACION',
  'Notificación demanda y su proveído': 'NOTIFICACION',
  'Notificación': 'NOTIFICACION',
  'Excepciones': 'EXCEPCIONES',
  'Contestación Excepciones': 'CONTESTACION_EXCEPCIONES',
  'Contestación': 'CONTESTACION',
  'Réplica': 'REPLICA',
  'Dúplica': 'DUPLICA',
  'Conciliación': 'CONCILIACION',
  'Probatorio': 'PROBATORIO',
  'Prueba': 'PROBATORIO',
  'Audiencia': 'AUDIENCIA',
  'Discusión': 'DISCUSION',
  'Citación para Oír Sentencia': 'CITACION_SENTENCIA',
  'Sentencia': 'SENTENCIA',
  'Recursos': 'RECURSOS',
  'Apelación': 'RECURSOS',
  'Cumplimiento': 'CUMPLIMIENTO',
  'Terminada': 'TERMINADA',
  'Archivada': 'ARCHIVADA'
};

function clasificarEtapa(tipoMovimiento) {
  if (!tipoMovimiento) return 'SIN_ETAPA';
  
  // Buscar coincidencia exacta primero
  if (ETAPAS_MAPPING[tipoMovimiento]) {
    return ETAPAS_MAPPING[tipoMovimiento];
  }
  
  // Buscar coincidencia parcial
  const tipoLower = tipoMovimiento.toLowerCase();
  for (const [key, value] of Object.entries(ETAPAS_MAPPING)) {
    if (tipoLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return 'TRAMITACION';
}

/**
 * Convierte un archivo a base64
 * @param {string} filePath - Ruta del archivo
 * @returns {string|null} - String base64 o null si hay error
 */
function fileToBase64(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    console.warn(`⚠️ Error convirtiendo a base64: ${error.message}`);
    return null;
  }
}

/**
 * Descarga todos los PDFs de una causa y los convierte a base64
 * @param {Object} opts - { useRowIndex: true } para cuadernos (clave por índice de fila 1-based)
 */
async function descargarTodosPDFs(page, rows, rit, outputDir, opts = {}) {
  const useRowIndex = !!opts.useRowIndex;
  console.log(`\n📥 Descargando PDFs para ${rit}...`);

  const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
  const pdfMapping = {};
  let descargados = 0;
  let errores = 0;

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const pdfs = row.pdfs || [];
    if (pdfs.length === 0) continue;

    const indice = useRowIndex ? rowIdx + 1 : (parseInt(row.texto?.[0], 10) || row.datos_limpios?.indice);
    if (!indice) continue;

    pdfMapping[indice] = { 
      azul: null, 
      rojo: null,
      azul_base64: null,
      rojo_base64: null,
      azul_nombre: null,
      rojo_nombre: null
    };

    for (const pdf of pdfs) {
      try {
        const tipoDesc = pdf.tipo === 'P' ? 'azul' : 'rojo';
        console.log(`   ⬇️ Movimiento ${indice} - PDF ${tipoDesc}...`);

        const downloadPromise = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);
        
        // Click en el enlace del PDF
        const folio = row.datos_limpios?.folio || row.texto[0];
        await page.evaluate(({ folioValue, linkIndex }) => {
          const trs = document.querySelectorAll('table.table.table-bordered.table-striped.table-hover tbody tr');
          const row = Array.from(trs).find(tr => {
            const firstCell = tr.querySelector('td');
            return firstCell && firstCell.innerText.trim() === folioValue;
          });
          if (row) {
            const links = row.querySelectorAll('td:nth-child(2) a');
            if (links[linkIndex]) links[linkIndex].click();
          }
        }, { folioValue: String(folio), linkIndex: pdf.linkIndex || 0 });

        const download = await downloadPromise;
        if (download) {
          const filename = `${ritClean}_mov_${indice}_${tipoDesc}.pdf`;
          const savePath = path.join(outputDir, filename);
          await download.saveAs(savePath);
          
          if (fs.existsSync(savePath) && fs.statSync(savePath).size > 0) {
            // Convertir a base64
            const base64Content = fileToBase64(savePath);
            
            if (base64Content) {
              pdfMapping[indice][tipoDesc] = savePath;
              pdfMapping[indice][`${tipoDesc}_base64`] = base64Content;
              pdfMapping[indice][`${tipoDesc}_nombre`] = filename;
              
              const sizeKB = Math.round(base64Content.length / 1024);
              console.log(`      ✅ ${filename} (${sizeKB}KB en base64)`);
              descargados++;
            }
          }
        }
        
        await page.waitForTimeout(1500);
      } catch (error) {
        console.warn(`      ⚠️ Error: ${error.message}`);
        errores++;
      }
    }
  }

  console.log(`   📊 Resultado: ${descargados} descargados y convertidos a base64, ${errores} errores`);
  return { pdfMapping, descargados, errores };
}

/**
 * Asocia los PDFs base64 a los movimientos
 * @param {Array} movimientos - Array de movimientos
 * @param {Object} pdfMapping - Mapeo de PDFs con base64
 * @returns {Array} - Movimientos con PDFs base64 incluidos
 */
function asociarPDFsAMovimientos(movimientos, pdfMapping) {
  return movimientos.map(mov => {
    const indice = mov.indice || mov.folio;
    const pdfData = pdfMapping[indice];
    
    if (pdfData) {
      return {
        ...mov,
        pdf_azul: pdfData.azul_base64 ? {
          nombre: pdfData.azul_nombre,
          base64: pdfData.azul_base64,
          tipo: 'application/pdf'
        } : null,
        pdf_rojo: pdfData.rojo_base64 ? {
          nombre: pdfData.rojo_nombre,
          base64: pdfData.rojo_base64,
          tipo: 'application/pdf'
        } : null,
        tiene_pdf_azul: !!pdfData.azul_base64,
        tiene_pdf_rojo: !!pdfData.rojo_base64
      };
    }
    
    return {
      ...mov,
      pdf_azul: null,
      pdf_rojo: null,
      tiene_pdf_azul: false,
      tiene_pdf_rojo: false
    };
  });
}

/**
 * Descarga el eBook de una causa
 */
async function descargarEbook(page, context, rit, outputDir) {
  console.log(`\n📘 Descargando eBook para ${rit}...`);
  
  try {
    // Buscar enlace de eBook
    const ebookLink = await page.$('form[action*="newebookcivil.php"] a[title*="Ebook"], a[href*="ebook"], button[onclick*="ebook"]');
    
    if (!ebookLink) {
      console.log('   ℹ️ No se encontró enlace de eBook');
      return null;
    }

    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 30000 }),
      ebookLink.click().catch(() => {}),
    ]);

    await newPage.waitForLoadState('networkidle');
    await newPage.waitForTimeout(2000);

    const pdfUrl = newPage.url();
    console.log(`   📄 URL: ${pdfUrl}`);

    if (!pdfUrl || !pdfUrl.startsWith('http')) {
      await newPage.close();
      return null;
    }

    const response = await newPage.request.get(pdfUrl);
    const buffer = await response.body();

    if (buffer && buffer.slice(0, 4).toString() === '%PDF') {
      const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${ritClean}_ebook.pdf`;
      const savePath = path.join(outputDir, fileName);

      fs.writeFileSync(savePath, buffer);
      
      // Convertir a base64
      const base64Content = buffer.toString('base64');
      const sizeKB = Math.round(base64Content.length / 1024);
      
      console.log(`   ✅ Guardado: ${fileName} (${sizeKB}KB en base64)`);
      await newPage.close();
      
      return {
        nombre: fileName,
        ruta: savePath,
        base64: base64Content,
        tipo: 'application/pdf',
        tamaño_kb: sizeKB
      };
    }

    await newPage.close();
    return null;
  } catch (error) {
    console.warn(`   ⚠️ Error descargando eBook: ${error.message}`);
    return null;
  }
}

/**
 * Guarda los datos en la base de datos MariaDB
 */
async function guardarEnBaseDatos(rit, causa, resultado, datosProcesados) {
  try {
    const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
    
    // 1. Guardar/actualizar causa
    const causaData = {
      rit: rit,
      tipo_causa: causa.tipoCausa || 'C',
      rol: rit.split('-')[0]?.replace(/[^0-9]/g, '') || '',
      anio: parseInt(rit.split('-')[1]) || new Date().getFullYear(),
      competencia_id: causa.competencia || null,
      competencia_nombre: null,
      corte_id: causa.corte || null,
      corte_nombre: causa.corte_nombre || null,
      tribunal_id: causa.tribunal || null,
      tribunal_nombre: causa.tribunal_nombre || null,
      caratulado: datosProcesados.cabecera?.caratulado || causa.caratulado || null,
      fecha_ingreso: datosProcesados.cabecera?.fecha_ingreso || null,
      estado: datosProcesados.estado_actual?.estado || 'EN_TRAMITE',
      etapa: datosProcesados.estado_actual?.etapa || null,
      estado_descripcion: datosProcesados.estado_actual?.descripcion || null,
      total_movimientos: resultado.movimientos.length,
      total_pdfs: resultado.pdfs?.descargados || 0,
      fecha_ultimo_scraping: new Date(),
      scraping_exitoso: resultado.success ? 1 : 0,
      error_scraping: resultado.errores.length > 0 ? JSON.stringify(resultado.errores) : null
    };

    await upsertCausa(causaData);
    const causaDb = await getCausaByRit(rit);
    const causaId = causaDb.id;

    // 2. Guardar movimientos y crear mapeo indice -> movimiento_id
    const movimientoIds = {}; // Mapeo: indice -> movimiento_id
    for (const mov of resultado.movimientos) {
      // Preparar movimiento con rit
      const movConRit = { ...mov, rit: rit };
      const result = await upsertMovimiento(movConRit, causaId);
      
      // Obtener el ID del movimiento (insertId si es nuevo, o buscar por causa_id + indice)
      let movimientoId = result.insertId;
      if (!movimientoId) {
        // Si no hay insertId, es un UPDATE, buscar el ID existente
        const movDb = await query(
          'SELECT id FROM movimientos WHERE causa_id = ? AND indice = ?',
          [causaId, mov.indice || mov.folio]
        );
        movimientoId = movDb[0]?.id || null;
      }
      
      if (movimientoId) {
        const key = mov.indice || mov.folio || String(movimientoId);
        movimientoIds[key] = movimientoId;
      }
    }

    // 3. Guardar PDFs con base64
    const pdfMapping = resultado.pdfs?.pdfMapping || {};
    for (const [indice, pdfData] of Object.entries(pdfMapping)) {
      const movimientoId = movimientoIds[indice] || null;
      
      // PDF Azul (Principal)
      if (pdfData.azul_base64) {
        await registrarPdf(causaId, movimientoId, rit, {
          tipo: 'PRINCIPAL',
          nombre_archivo: pdfData.azul_nombre || `${ritClean}_mov_${indice}_azul.pdf`,
          ruta_relativa: pdfData.azul || null,
          tamano_bytes: null,
          base64: pdfData.azul_base64,
          descargado: true,
          fecha_descarga: new Date()
        });
      }

      // PDF Rojo (Anexo)
      if (pdfData.rojo_base64) {
        await registrarPdf(causaId, movimientoId, rit, {
          tipo: 'ANEXO',
          nombre_archivo: pdfData.rojo_nombre || `${ritClean}_mov_${indice}_rojo.pdf`,
          ruta_relativa: pdfData.rojo || null,
          tamano_bytes: null,
          base64: pdfData.rojo_base64,
          descargado: true,
          fecha_descarga: new Date()
        });
      }
    }

    // 4. Guardar eBook con base64 (pdf_ebook)
    if (resultado.ebook && resultado.ebook.base64) {
      await registrarEbook(causaId, rit, {
        nombre_archivo: resultado.ebook.nombre || `${ritClean}_ebook.pdf`,
        ruta_relativa: resultado.ebook.ruta || null,
        tamano_bytes: resultado.ebook.tamaño_kb ? resultado.ebook.tamaño_kb * 1024 : null,
        base64: resultado.ebook.base64,
        descargado: true,
        fecha_descarga: new Date()
      });
    }

    return { causaId, movimientosGuardados: resultado.movimientos.length };
  } catch (error) {
    console.error(`Error guardando en BD para ${rit}:`, error);
    throw error;
  }
}

/**
 * Procesa una causa individual
 */
async function procesarCausa(causa, session, errorRegistry, options = {}) {
  const { page, context } = session;
  const rit = `${causa.tipoCausa}-${causa.rit}`;
  const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
  const startTime = Date.now();
  
  console.log('\n' + '='.repeat(60));
  console.log(`🔍 PROCESANDO: ${rit}`);
  console.log(`   Tribunal: ${causa.tribunal_nombre}`);
  console.log(`   Corte: ${causa.corte_nombre}`);
  console.log('='.repeat(60));

  // Verificar si debemos reintentar
  if (!errorRegistry.debeReintentar(rit, 'SCRAPING_GENERAL', 3)) {
    console.log('   ⏭️ Saltando - demasiados errores previos');
    return { success: false, rit, skipped: true, reason: 'max_retries' };
  }

  const resultado = {
    rit,
    causa,
    success: false,
    movimientos: [],
    pdfs: { descargados: 0, errores: 0 },
    ebook: null,
    etapas: {},
    errores: [],
    duracion_ms: 0
  };

  try {
    // 1. Navegar a consulta de causas
    console.log('\n📍 Paso 1: Navegando a consulta de causas...');
    await closeModalIfExists(page);
    await goToConsultaCausas(page);

    // 2. Llenar formulario
    console.log('📍 Paso 2: Llenando formulario...');
    const config = {
      rit: causa.rit,
      tipoCausa: causa.tipoCausa,
      competencia: causa.competencia,
      corte: causa.corte,
      tribunal: causa.tribunal
    };
    await fillForm(page, config);

    // 3. Abrir detalle
    console.log('📍 Paso 3: Abriendo detalle de causa...');
    await openDetalle(page);

    let rows;
    let datosProcesados;
    const useCuadernos = await hayCuaderno(page);

    if (useCuadernos) {
      // 4a. Extraer cuadernos y movimientos (dropdown)
      console.log('📍 Paso 4: Cuadernos detectados. Extrayendo por cuaderno...');
      console.log('   🔍 DEBUG: Verificando estado del modal...');
      const modalState = await page.evaluate(() => {
        const modals = ['#modalDetalleCivil', '#modalDetalleLaboral', '.modal.show'];
        for (const sel of modals) {
          const m = document.querySelector(sel);
          if (m) {
            const tables = m.querySelectorAll('table');
            return {
              selector: sel,
              visible: m.style.display !== 'none',
              tables: tables.length,
              firstTableRows: tables[0] ? tables[0].querySelectorAll('tbody tr').length : 0,
              firstTableCols: tables[0]?.querySelector('tbody tr')?.querySelectorAll('td').length || 0
            };
          }
        }
        return { selector: 'none', visible: false, tables: 0, firstTableRows: 0, firstTableCols: 0 };
      });
      console.log('   🔍 DEBUG: Modal state:', JSON.stringify(modalState));
      
      const { cuadernos, todosLosMovimientos } = await extraerCuadernosYMovimientos(page, rit);
      console.log(`   ✅ ${cuadernos.length} cuaderno(s), ${todosLosMovimientos.length} movimientos totales`);

      const movsNorm = todosLosMovimientos.map(m => ({
        indice: m.indice,
        folio: m.folio,
        etapa: m.etapa,
        tramite: m.tramite,
        desc_tramite: m.desc_tramite,
        fecha: m.fecha,
        foja: m.foja,
        georref: m.georref,
        tipo_movimiento: m.tramite || m.etapa,
        descripcion: m.desc_tramite,
        tiene_pdf: m.tiene_doc || m.tiene_anexo,
        pdfs: m.raw?.pdfs || [],
        id_pagina: m.id_pagina,
        id_cuaderno: m.id_cuaderno,
        cuaderno_nombre: m.cuaderno_nombre,
        raw: m.raw
      }));
      resultado.movimientos = movsNorm;
      resultado.cuadernos = cuadernos;

      // 5a. Descargar PDFs por cuaderno y asociar base64
      if (!options.skipPdfs) {
        console.log('📍 Paso 5: Descargando PDFs por cuaderno...');
        let totalDesc = 0;
        const opciones = await obtenerOpcionesCuaderno(page);
        for (let c = 0; c < opciones.length; c++) {
          await seleccionarCuaderno(page, opciones[c]);
          const tabRows = await extractTableAsArray(page).catch(() => []);
          const pdfRes = await descargarTodosPDFs(page, tabRows, rit, PDF_DIR, { useRowIndex: true });
          totalDesc += pdfRes.descargados || 0;
          const cua = cuadernos[c];
          if (cua && cua.movimientos && pdfRes.pdfMapping) {
            for (let i = 0; i < cua.movimientos.length; i++) {
              const map = pdfRes.pdfMapping[i + 1];
              const mov = movsNorm.find(m => m.id_pagina === cua.movimientos[i].id_pagina);
              if (mov && map) {
                mov.pdf_azul = map.azul_base64 ? { nombre: map.azul_nombre, base64: map.azul_base64, tipo: 'application/pdf' } : null;
                mov.pdf_rojo = map.rojo_base64 ? { nombre: map.rojo_nombre, base64: map.rojo_base64, tipo: 'application/pdf' } : null;
                mov.tiene_pdf_azul = !!map.azul_base64;
                mov.tiene_pdf_rojo = !!map.rojo_base64;
              }
            }
          }
        }
        resultado.pdfs = { pdfMapping: {}, descargados: totalDesc, errores: 0 };
        console.log(`   ✅ ${totalDesc} PDFs descargados y asociados a movimientos`);
      }

      datosProcesados = {
        rit,
        metadata: { fecha_procesamiento: new Date().toISOString(), total_movimientos: movsNorm.length, total_partes: 0, tiene_documentos_pdf: movsNorm.some(m => m.tiene_pdf), pdfs_asociados: 0 },
        cabecera: { rit, fecha_ingreso: causa.fecha_ingreso || null, caratulado: causa.caratulado || null, juzgado: causa.tribunal_nombre },
        estado_actual: (() => {
          const ult = movsNorm[movsNorm.length - 1];
          return { estado: 'EN_TRAMITE', etapa: ult?.etapa, descripcion: ult?.descripcion || ult?.desc_tramite, ultimo_movimiento: ult, fecha_ultimo_movimiento: ult?.fecha };
        })(),
        movimientos: resultado.movimientos,
        partes: []
      };
    } else {
      // 4b. Sin cuadernos: tabla única
      console.log('📍 Paso 4: Extrayendo tabla de movimientos...');
      
      // DEBUG: Verificar estado del modal antes de extraer
      console.log('   🔍 DEBUG: Verificando estado del modal...');
      const modalState = await page.evaluate(() => {
        const modals = ['#modalDetalleCivil', '#modalDetalleLaboral', '.modal.show', '.modal[style*="display: block"]'];
        for (const sel of modals) {
          const m = document.querySelector(sel);
          if (m) {
            const tables = m.querySelectorAll('table');
            const firstTable = tables[0];
            const firstRow = firstTable?.querySelector('tbody tr');
            const cols = firstRow ? [...firstRow.querySelectorAll('td')].map(td => td.innerText.trim().substring(0, 20)) : [];
            return {
              selector: sel,
              visible: m.style.display !== 'none' && m.classList.contains('show'),
              tables: tables.length,
              firstTableRows: firstTable ? firstTable.querySelectorAll('tbody tr').length : 0,
              firstTableCols: cols.length,
              sampleCols: cols.slice(0, 5)
            };
          }
        }
        // Si no hay modal, mostrar todas las tablas en la página
        const allTables = document.querySelectorAll('table.table tbody tr');
        return { 
          selector: 'no-modal', 
          visible: false, 
          allTableRows: allTables.length,
          firstRowCols: allTables[0] ? allTables[0].querySelectorAll('td').length : 0
        };
      });
      console.log('   🔍 DEBUG: Modal state:', JSON.stringify(modalState));
      
      try {
        rows = await extractTableAsArray(page);
      } catch (e) {
        rows = await extractTable(page);
      }
      console.log(`   ✅ Extraídas ${rows.length} filas`);
      
      // DEBUG: Mostrar estructura de la primera fila si existe
      if (rows.length > 0) {
        const firstRow = rows[0];
        console.log('   🔍 DEBUG: Primera fila extraída:', {
          textoLength: firstRow.texto?.length || 0,
          texto: firstRow.texto?.slice(0, 5) || [],
          datosLimpios: firstRow.datos_limpios ? {
            folio: firstRow.datos_limpios.folio,
            etapa: firstRow.datos_limpios.etapa,
            tramite: firstRow.datos_limpios.tramite
          } : 'N/A'
        });
      }

      console.log('📍 Paso 5: Procesando datos...');
      console.log(`   📊 Filas extraídas: ${rows.length}`);
      const pdfMapping = {};
      datosProcesados = processTableData(rows, rit, pdfMapping);
      resultado.movimientos = datosProcesados.movimientos;
      console.log(`   📊 Movimientos procesados: ${resultado.movimientos.length}`);
      
      if (resultado.movimientos.length === 0 && rows.length > 0) {
        console.warn(`   ⚠️ ADVERTENCIA: Se extrajeron ${rows.length} filas pero 0 movimientos procesados`);
        console.warn(`   💡 Revisando estructura de datos...`);
        if (rows.length > 0) {
          console.warn(`   📋 Primera fila:`, {
            tipo: Array.isArray(rows[0]) ? 'array' : typeof rows[0],
            tieneTexto: !Array.isArray(rows[0]) && rows[0].texto ? rows[0].texto.length : 'N/A',
            texto0: !Array.isArray(rows[0]) && rows[0].texto ? rows[0].texto[0] : (Array.isArray(rows[0]) ? rows[0][0] : 'N/A')
          });
        }
      }

      if (!options.skipPdfs) {
        console.log('📍 Paso 5b: Descargando PDFs y convirtiendo a base64...');
        const pdfResult = await descargarTodosPDFs(page, rows, rit, PDF_DIR);
        resultado.pdfs = pdfResult;
        resultado.movimientos = asociarPDFsAMovimientos(resultado.movimientos, pdfResult.pdfMapping);
        console.log('   ✅ PDFs asociados a movimientos con base64');
      }
    }

    // 6. Clasificar por etapas
    console.log('📍 Paso 6: Clasificando por etapas del juicio...');
    resultado.etapas = {};
    for (const mov of resultado.movimientos) {
      const etapaCodigo = clasificarEtapa(mov.tipo_movimiento || mov.etapa);
      mov.etapa_codigo = etapaCodigo;
      if (!resultado.etapas[etapaCodigo]) resultado.etapas[etapaCodigo] = [];
      resultado.etapas[etapaCodigo].push(mov);
    }
    for (const [etapa, movs] of Object.entries(resultado.etapas)) {
      console.log(`      - ${etapa}: ${movs.length} movimientos`);
    }

    // 8. Descargar eBook
    if (!options.skipEbook) {
      console.log('📍 Paso 8: Descargando eBook...');
      resultado.ebook = await descargarEbook(page, context, rit, EBOOK_DIR);
    }

    // 9. Exportar resultados
    console.log('📍 Paso 9: Exportando resultados...');
    const exportData = {
      ...datosProcesados,
      movimientos: resultado.movimientos,
      etapas_clasificadas: resultado.etapas,
      pdfs_info: resultado.pdfs || { pdfMapping: {}, descargados: 0, errores: 0 },
      ebook: resultado.ebook,
      pdf_ebook: resultado.ebook ? {
        rit: rit,
        nombre: resultado.ebook.nombre,
        base64: resultado.ebook.base64,
        tipo: resultado.ebook.tipo || 'application/pdf',
        tamaño_kb: resultado.ebook.tamaño_kb
      } : null,
      cuadernos: resultado.cuadernos || null,
      procesado_en: new Date().toISOString()
    };

    const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
    const jsonPath = path.join(OUTPUT_DIR, `movimientos_${ritClean}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(exportData, null, 2), 'utf-8');
    console.log(`   ✅ Exportado: movimientos_${ritClean}.json`);

    // 10. Guardar en base de datos MariaDB
    if (process.env.DB_HOST && !options.skipDatabase) {
      console.log('📍 Paso 10: Guardando en base de datos MariaDB...');
      try {
        await guardarEnBaseDatos(rit, causa, resultado, datosProcesados);
        console.log('   ✅ Datos guardados en base de datos');
      } catch (dbError) {
        console.warn(`   ⚠️ Error guardando en BD: ${dbError.message}`);
        resultado.errores.push({
          tipo: 'DATABASE_ERROR',
          mensaje: dbError.message
        });
      }
    } else {
      console.log('   ⏭️ Saltando guardado en BD (DB_HOST no configurado o --skip-database)');
    }

    // Marcar como exitoso
    resultado.success = true;
    resultado.duracion_ms = Date.now() - startTime;
    errorRegistry.marcarResuelto(rit);
    
    console.log(`\n✅ ${rit} procesado exitosamente en ${resultado.duracion_ms}ms`);
    console.log(`   📊 ${resultado.movimientos.length} movimientos, ${resultado.pdfs.descargados} PDFs`);

  } catch (error) {
    resultado.success = false;
    resultado.duracion_ms = Date.now() - startTime;
    resultado.errores.push({
      tipo: 'SCRAPING_GENERAL',
      mensaje: error.message,
      stack: error.stack
    });
    
    // Registrar error
    errorRegistry.registrar(rit, 'SCRAPING_GENERAL', error.message, error.stack);
    
    // Guardar evidencia
    const timestamp = Date.now();
    await saveErrorEvidence(
      page, 
      path.join(LOG_DIR, `error_${ritClean}_${timestamp}.png`),
      path.join(LOG_DIR, `error_${ritClean}_${timestamp}.html`)
    );
    
    console.error(`\n❌ Error procesando ${rit}: ${error.message}`);
  }

  return resultado;
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const causaEspecifica = args.find(a => a.startsWith('--causa='))?.split('=')[1];
  const skipPdfs = args.includes('--skip-pdfs');
  const skipEbook = args.includes('--skip-ebook');
  const skipDatabase = args.includes('--skip-database');

  console.log('\n' + '='.repeat(60));
  console.log('🚀 SCRAPER DE 5 CAUSAS DE PRUEBA');
  console.log('='.repeat(60));
  
  if (isDryRun) console.log('⚠️ Modo DRY-RUN: No se realizarán cambios');
  if (skipPdfs) console.log('⚠️ Skip PDFs activado');
  if (skipEbook) console.log('⚠️ Skip eBook activado');
  if (skipDatabase) console.log('⚠️ Skip Base de Datos activado');

  // Cargar causas de prueba
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`❌ No se encontró: ${CONFIG_PATH}`);
    process.exit(1);
  }

  const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  let causas = configData.causas;

  if (causaEspecifica) {
    causas = causas.filter(c => `${c.tipoCausa}-${c.rit}` === causaEspecifica || c.rit === causaEspecifica);
    if (causas.length === 0) {
      console.error(`❌ No se encontró la causa: ${causaEspecifica}`);
      process.exit(1);
    }
  }

  console.log(`\n📋 Causas a procesar: ${causas.length}`);
  causas.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.tipoCausa}-${c.rit} - ${c.tribunal_nombre}`);
  });

  // Inicializar registro de errores
  const errorRegistry = new ErrorRegistry(ERRORS_FILE);
  console.log('\n📊 Estado de errores:');
  const resumen = errorRegistry.getResumen();
  console.log(`   Total: ${resumen.total}, Pendientes: ${resumen.pendientes}, Resueltos: ${resumen.resueltos}`);

  if (isDryRun) {
    console.log('\n🏁 Dry-run completado. No se ejecutó el scraping.');
    return;
  }

  // Iniciar navegador
  console.log('\n🌐 Iniciando navegador...');
  const headless = process.env.SCRAPER_HEADLESS !== 'false';
  const session = await startBrowser(process.env.OJV_URL, { headless, slowMo: 100 });
  session.page.setDefaultTimeout(30000);
  session.page.setDefaultNavigationTimeout(60000);

  const resultados = [];

  try {
    for (let i = 0; i < causas.length; i++) {
      const causa = causas[i];
      console.log(`\n[${i + 1}/${causas.length}]`);
      
      const resultado = await procesarCausa(causa, session, errorRegistry, { skipPdfs, skipEbook, skipDatabase });
      resultados.push(resultado);

      // Esperar entre causas
      if (i < causas.length - 1) {
        const wait = 3000 + Math.random() * 2000;
        console.log(`\n⏳ Esperando ${Math.round(wait / 1000)}s antes de la siguiente causa...`);
        await new Promise(r => setTimeout(r, wait));
      }
    }
  } finally {
    await session.browser.close();
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(60));
  
  const exitosos = resultados.filter(r => r.success);
  const fallidos = resultados.filter(r => !r.success && !r.skipped);
  const saltados = resultados.filter(r => r.skipped);

  console.log(`✅ Exitosos: ${exitosos.length}`);
  console.log(`❌ Fallidos: ${fallidos.length}`);
  console.log(`⏭️ Saltados: ${saltados.length}`);

  const totalMovimientos = exitosos.reduce((sum, r) => sum + r.movimientos.length, 0);
  const totalPDFs = exitosos.reduce((sum, r) => sum + r.pdfs.descargados, 0);
  const totalEbooks = exitosos.filter(r => r.ebook).length;

  console.log(`\n📈 Datos extraídos:`);
  console.log(`   - Movimientos: ${totalMovimientos}`);
  console.log(`   - PDFs: ${totalPDFs}`);
  console.log(`   - eBooks: ${totalEbooks}`);

  // Guardar resumen
  const resumenPath = path.join(OUTPUT_DIR, `resumen_${Date.now()}.json`);
  fs.writeFileSync(resumenPath, JSON.stringify({
    fecha: new Date().toISOString(),
    causas_procesadas: causas.length,
    exitosos: exitosos.length,
    fallidos: fallidos.length,
    saltados: saltados.length,
    total_movimientos: totalMovimientos,
    total_pdfs: totalPDFs,
    total_ebooks: totalEbooks,
    resultados: resultados.map(r => ({
      rit: r.rit,
      success: r.success,
      skipped: r.skipped,
      movimientos: r.movimientos?.length || 0,
      pdfs: r.pdfs?.descargados || 0,
      ebook: !!r.ebook,
      errores: r.errores,
      duracion_ms: r.duracion_ms
    }))
  }, null, 2), 'utf-8');
  
  console.log(`\n📄 Resumen guardado: ${resumenPath}`);
  console.log('\n🏁 Proceso completado.');
}

// Ejecutar
main().catch(console.error);

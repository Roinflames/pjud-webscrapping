// Script para procesar múltiples causas desde el CSV
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { readCausaCSV, mapCsvToDB } = require('./read-csv');
const { getAllCausas } = require('./database/db-mariadb');
const { startBrowser } = require('./browser');
const { closeModalIfExists, goToConsultaCausas } = require('./navigation');
const { fillForm, openDetalle, openDetalleEspecifico } = require('./form');
const { extractTable, extractTableAsArray } = require('./table');
const { exportToJSON, exportToCSV, processTableData } = require('./exporter');
const { downloadPDFsFromTable } = require('./pdfDownloader');
const { downloadEbook } = require('./ebook');
const { saveErrorEvidence } = require('./utils');
const { saveCausaJSON, appendCausaNDJSON, upsertIndex } = require('./jsonStore');

// Mapeo de tribunal_id a corte_id usando el scraping de tribunales
let tribunalToCorteMap = null;

/**
 * Cargar mapeo de tribunales a cortes desde el archivo JSON extraído
 * Busca en TODAS las competencias, pero prioriza Civil (id=3)
 */
function loadTribunalToCorteMap() {
  if (tribunalToCorteMap) return tribunalToCorteMap;
  
  tribunalToCorteMap = new Map();
  
  try {
    const tribunalesPath = path.resolve(__dirname, 'outputs/tribunales_pjud_completo.json');
    if (!fs.existsSync(tribunalesPath)) {
      console.warn('⚠️ Archivo de tribunales no encontrado, usando corte por defecto');
      return tribunalToCorteMap;
    }
    
    const data = JSON.parse(fs.readFileSync(tribunalesPath, 'utf-8'));
    
    // Primero buscar en competencia Civil (id=3) - prioridad alta
    const compCivil = data.cortes?.find(c => c.competencia?.id === '3');
    if (compCivil && compCivil.cortes) {
      for (const corteData of compCivil.cortes) {
        const corteId = corteData.corte?.id;
        if (corteId && corteData.tribunales) {
          for (const tribunal of corteData.tribunales) {
            const tribunalId = tribunal.value;
            if (tribunalId) {
              tribunalToCorteMap.set(String(tribunalId), String(corteId));
            }
          }
        }
      }
    }
    
    // Luego buscar en TODAS las demás competencias (para tribunales que no están en Civil)
    if (data.cortes) {
      for (const compData of data.cortes) {
        // Ya procesamos Civil, saltar
        if (compData.competencia?.id === '3') continue;
        
        if (compData.cortes) {
          for (const corteData of compData.cortes) {
            const corteId = corteData.corte?.id;
            if (corteId && corteData.tribunales) {
              for (const tribunal of corteData.tribunales) {
                const tribunalId = tribunal.value;
                // Solo agregar si no está ya en el mapa (prioridad a Civil)
                if (tribunalId && !tribunalToCorteMap.has(String(tribunalId))) {
                  tribunalToCorteMap.set(String(tribunalId), String(corteId));
                }
              }
            }
          }
        }
      }
    }
    
    console.log(`✅ Mapeo de tribunales cargado: ${tribunalToCorteMap.size} tribunales mapeados`);
  } catch (error) {
    console.warn(`⚠️ Error cargando mapeo de tribunales: ${error.message}`);
  }
  
  return tribunalToCorteMap;
}

/**
 * Obtener corte_id a partir de tribunal_id
 */
function getCorteFromTribunal(tribunalId) {
  if (!tribunalId) return null;
  
  const map = loadTribunalToCorteMap();
  const corteId = map.get(String(tribunalId));
  
  return corteId || null;
}

// Función para extraer tipoCausa del RIT
function extractTipoCausa(rit) {
  if (!rit || rit === 'NULL') return null;
  // Formato: "C-13786-2018" -> "C"
  const match = rit.match(/^([A-Za-z0-9]+)-/);
  return match ? match[1] : null;
}

// Función para extraer rol y año del RIT
function extractRolAnio(rit) {
  if (!rit || rit === 'NULL') return { rol: null, año: null };
  // Formato: "C-13786-2018" -> rol: "13786", año: "2018"
  const parts = rit.split('-');
  if (parts.length >= 3) {
    return { rol: parts[1], año: parts[2] };
  }
  return { rol: null, año: null };
}

// Mapear datos del CSV a formato para scraping
// IMPORTANTE: Todas las causas con RIT son civiles (competencia = 3)
function csvToScrapingConfig(csvCausa) {
  const { rol, año } = extractRolAnio(csvCausa.rit);
  const tipoCausa = extractTipoCausa(csvCausa.rit);
  
  // Extraer tribunal (requerido - debe estar en CSV)
  const tribunal = csvCausa.tribunal || csvCausa.tribunal_id || csvCausa.juzgado || csvCausa.juzgado_id || null;
  
  // Obtener corte: primero del CSV, luego del mapeo de tribunales, finalmente default
  let corte = csvCausa.corte || csvCausa.corte_id;
  let corteSource = 'CSV';
  
  if (!corte || corte === 'NULL' || String(corte).trim() === '') {
    // Si no hay corte en CSV, buscarlo en el mapeo usando el tribunal
    if (tribunal) {
      corte = getCorteFromTribunal(tribunal);
      if (corte) {
        corteSource = 'mapeo';
        // No mostrar log aquí para no saturar la consola
      } else {
        // Tribunal no encontrado en el mapeo
        console.warn(`   ⚠️ Tribunal ${tribunal} no encontrado en el mapeo de tribunales`);
      }
    }
    
    // Si aún no hay corte, usar default '90' (C.A. de Santiago)
    if (!corte) {
      corte = '90';
      corteSource = 'default';
      if (tribunal) {
        console.warn(`   ⚠️ Usando corte por defecto '90' para tribunal ${tribunal} (no encontrado en mapeo)`);
      }
    }
  }
  
  return {
    rit: csvCausa.rit,
    competencia: '3', // SIEMPRE Civil (todas las causas con RIT son civiles)
    corte: String(corte), // Obtenido del CSV, mapeo o default
    tribunal: tribunal ? String(tribunal) : null, // REQUERIDO - debe estar en CSV
    tipoCausa: tipoCausa || 'C', // Extraído del RIT
    rol: rol, // Rol extraído del RIT (ej: "13786" de "C-13786-2018")
    año: año, // Año extraído del RIT (ej: "2018" de "C-13786-2018")
    caratulado: csvCausa.caratulado,
    cliente: csvCausa.cliente,
    rut: csvCausa.rut,
    abogado_id: csvCausa.abogado_id,
    cuenta_id: csvCausa.cuenta_id,
    // Datos originales
    causa_id: csvCausa.causa_id,
    agenda_id: csvCausa.agenda_id
  };
}

/**
 * Convierte una causa de la base de datos a configuración para scraping
 */
function dbCausaToScrapingConfig(dbCausa) {
  const { rol, año } = extractRolAnio(dbCausa.rit);
  const tipoCausa = extractTipoCausa(dbCausa.rit);
  
  // Extraer tribunal de la BD
  const tribunal = dbCausa.tribunal_id || null;
  
  // Obtener corte: primero de la BD, luego del mapeo de tribunales, finalmente default
  let corte = dbCausa.corte_id || null;
  let corteSource = 'BD';
  
  if (!corte || corte === 'NULL' || String(corte).trim() === '') {
    // Si no hay corte en BD, buscarlo en el mapeo usando el tribunal
    if (tribunal) {
      corte = getCorteFromTribunal(tribunal);
      if (corte) {
        corteSource = 'mapeo';
      } else {
        console.warn(`   ⚠️ Tribunal ${tribunal} no encontrado en el mapeo de tribunales`);
      }
    }
    
    // Si aún no hay corte, usar default '90' (C.A. de Santiago)
    if (!corte) {
      corte = '90';
      corteSource = 'default';
      if (tribunal) {
        console.warn(`   ⚠️ Usando corte por defecto '90' para tribunal ${tribunal} (no encontrado en mapeo)`);
      }
    }
  }
  
  return {
    rit: dbCausa.rit,
    competencia: String(dbCausa.competencia_id || '3'), // Usar de BD o default Civil
    corte: String(corte), // Obtenido de BD, mapeo o default
    tribunal: tribunal ? String(tribunal) : null, // De la BD
    tipoCausa: tipoCausa || dbCausa.tipo_causa || 'C', // Extraído del RIT o de BD
    rol: rol, // Rol extraído del RIT
    año: año, // Año extraído del RIT
    caratulado: dbCausa.caratulado || '',
    // Datos originales de BD
    causa_id: dbCausa.id,
    agenda_id: dbCausa.agenda_id || null
  };
}

// Extraer datos básicos de la tabla de resultados (Rol, Fecha, Caratulado)
async function extractResultadosBasicos(page, config) {
  try {
    // Esperar a que aparezca la tabla de resultados (solo que esté en el DOM, no necesariamente visible)
    await page.waitForTimeout(1500); // Dar tiempo a que cargue
    try {
      await page.waitForSelector('table tbody tr, #tablaConsultas tbody tr, table tr', { 
        timeout: 10000,
        state: 'attached' // Solo verificar que existe en el DOM, no que sea visible
      });
    } catch (error) {
      // Si no encontramos con waitForSelector, intentar directamente
      console.warn('   ⚠️ Tabla no encontrada con waitForSelector, intentando extraer directamente...');
    }
    
    // Extraer datos de la fila que corresponde al RIT buscado
    const datos = await page.evaluate(({ ritBuscado, rolBuscado }) => {
      // Buscar en todas las tablas posibles
      const tables = document.querySelectorAll('table, #tablaConsultas');
      
      for (const table of tables) {
        const rows = Array.from(table.querySelectorAll('tbody tr, tr'));
        
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length < 3) continue; // Necesitamos al menos 3 columnas
          
          const rowText = row.innerText || '';
          
          // Buscar la fila que contiene el RIT o el rol
          const contieneRIT = rowText.includes(ritBuscado);
          const contieneRol = rolBuscado && rowText.includes(rolBuscado);
          
          if (contieneRIT || contieneRol) {
            let rol = '';
            let fecha = '';
            let caratulado = '';
            
            // Extraer del RIT si está presente
            const ritMatch = rowText.match(/([A-Z])-(\d+)-(\d{4})/);
            if (ritMatch) {
              rol = ritMatch[2]; // El rol es la segunda parte
            } else if (rolBuscado) {
              rol = rolBuscado;
            }
            
            // Buscar en cada celda
            for (let i = 0; i < cells.length; i++) {
              const text = cells[i].innerText.trim();
              if (!text) continue;
              
              // Buscar fecha (formatos: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
              if (!fecha) {
                const fechaMatch = text.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})|(\d{4}[\/\-]\d{2}[\/\-]\d{2})/);
                if (fechaMatch) {
                  fecha = fechaMatch[0];
                }
              }
              
              // Buscar caratulado (texto largo, no numérico, no fecha, no RIT)
              if (!caratulado && text.length > 10 && 
                  !text.match(/^\d+$/) && 
                  !text.match(/\d{2}[\/\-]\d{2}[\/\-]\d{4}/) &&
                  !text.match(/\d{4}[\/\-]\d{2}[\/\-]\d{2}/) &&
                  !text.match(/^[A-Z]-\d+-\d{4}$/) &&
                  !text.match(/^[A-Z]$/)) {
                caratulado = text;
              }
            }
            
            // Si no encontramos rol, intentar extraer de la primera columna numérica
            if (!rol) {
              for (let i = 0; i < cells.length; i++) {
                const text = cells[i].innerText.trim();
                if (text && /^\d{4,}$/.test(text) && text !== ritBuscado.split('-')[2]) {
                  rol = text;
                  break;
                }
              }
            }
            
            return { rol, fecha, caratulado, encontrado: true };
          }
        }
      }
      
      return { rol: null, fecha: null, caratulado: null, encontrado: false };
    }, { ritBuscado: config.rit, rolBuscado: config.rol });
    
    // Si no encontramos en la tabla, usar los datos del config
    if (!datos.encontrado || !datos.rol) {
      datos.rol = config.rol || datos.rol || '';
      datos.caratulado = config.caratulado || datos.caratulado || '';
    }
    
    return datos;
  } catch (error) {
    console.warn(`   ⚠️ Error extrayendo datos básicos: ${error.message}`);
    // Retornar datos del config como fallback
    return {
      rol: config.rol || '',
      fecha: null,
      caratulado: config.caratulado || '',
      encontrado: false
    };
  }
}

// Procesar una causa individual
async function processCausa(page, context, config, outputDir) {
  try {
    console.log(`\n📋 Procesando causa: ${config.rit}`);
    console.log(`   Caratulado: ${config.caratulado || 'N/A'}`);
    
    await fillForm(page, config);
    
    // PASO 1: Extraer Rol, Fecha y Caratulado de la tabla de resultados
    const datosBasicos = await extractResultadosBasicos(page, config);
    console.log(`   ✅ Datos básicos extraídos:`);
    console.log(`      Rol: ${datosBasicos.rol || 'N/A'}`);
    console.log(`      Fecha: ${datosBasicos.fecha || 'N/A'}`);
    console.log(`      Caratulado: ${datosBasicos.caratulado || 'N/A'}`);

    // Guardar datos básicos en CSV
    const ritClean = config.rit.replace(/[^a-zA-Z0-9]/g, '_');
    const datosAGuardar = {
      rol: datosBasicos.rol || config.rol || '',
      fecha: datosBasicos.fecha || '',
      caratulado: datosBasicos.caratulado || config.caratulado || ''
    };
    
    // Guardar datos básicos en CSV consolidado
    const csvPath = path.join(outputDir, 'causas_extraidas.csv');
    const limpiarParaCSV = (valor) => {
      if (!valor) return '';
      return String(valor)
        .replace(/;/g, ',')
        .replace(/\n/g, ' ')
        .replace(/\r/g, '')
        .trim();
    };
    
    const rolLimpio = limpiarParaCSV(datosAGuardar.rol);
    const fechaLimpia = limpiarParaCSV(datosAGuardar.fecha);
    const caratuladoLimpio = limpiarParaCSV(datosAGuardar.caratulado);
    const csvLine = `${rolLimpio};${fechaLimpia};${caratuladoLimpio}\n`;
    
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, 'Rol;Fecha;Caratulado\n', 'utf8');
    }
    fs.appendFileSync(csvPath, csvLine, 'utf8');
    console.log(`   💾 Datos básicos guardados en CSV`);
    
    // PASO 2: Abrir el detalle usando la función estándar openDetalle
    // (ya se comprobó que abre correctamente el modal y la tabla de movimientos)
    console.log(`   🔍 Abriendo detalle de la causa...`);
    await openDetalle(page);
    console.log(`   ✅ Detalle abierto y verificado`);
    
    // PASO 4: Extraer tabla de movimientos (con forms para PDFs)
    console.log(`   📊 Extrayendo tabla de movimientos...`);
    const rows = await extractTableAsArray(page);
    console.log(`   ✅ Extraídas ${rows.length} filas de movimientos`);

    // PASO 5: Crear subcarpeta para PDFs
    const pdfDir = path.join(outputDir, 'pdf');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    // PASO 6: Descargar PDFs (pasar las filas ya extraídas para evitar duplicar trabajo)
    console.log(`   📄 Descargando PDFs...`);
    const pdfMapping = await downloadPDFsFromTable(page, context, pdfDir, ritClean, rows) || {};
    console.log(`   ✅ PDFs descargados`);

    // PASO 6a: Procesar datos estructurados (necesario antes de guardar en BD)
    const datosProcesados = processTableData(rows, config.rit, pdfMapping);

    // PASO 6b: Guardar datos en base de datos
    try {
      const { upsertCausa, getCausaByRit, insertMovimientosBatch, registrarPdf, registrarEbook, query } = require('./database/db-mariadb');
      
      // Obtener o crear causa en BD
      const causaData = {
        rit: config.rit,
        tipo_causa: config.tipoCausa || 'C',
        rol: datosAGuardar.rol || config.rol || '',
        anio: config.año || '',
        competencia_id: parseInt(config.competencia) || 3,
        competencia_nombre: 'Civil',
        corte_id: parseInt(config.corte) || 90,
        corte_nombre: '',
        tribunal_id: config.tribunal ? parseInt(config.tribunal) : null,
        tribunal_nombre: datosAGuardar.caratulado ? datosAGuardar.caratulado.split('/')[1]?.trim() : '',
        caratulado: datosAGuardar.caratulado || config.caratulado || '',
        fecha_ingreso: datosAGuardar.fecha || null,
        estado: 'ACTIVA',
        etapa: '',
        total_movimientos: rows.length,
        total_pdfs: Object.keys(pdfMapping).reduce((acc, k) => {
          const pdfs = pdfMapping[k];
          return acc + (pdfs.azul_base64 ? 1 : 0) + (pdfs.rojo_base64 ? 1 : 0);
        }, 0),
        scraping_exitoso: true
      };
      
      await upsertCausa(causaData);
      const causa = await getCausaByRit(config.rit);
      const causaId = causa?.id;
      
      if (causaId) {
        console.log(`   💾 Guardando movimientos y PDFs en base de datos...`);
        
        // Preparar movimientos para guardar
        const movimientosParaBD = datosProcesados.movimientos.map(mov => {
          const indice = mov.indice || mov.folio;
          const pdfs = pdfMapping[indice] || {};
          
          return {
            rit: config.rit,
            indice: parseInt(indice) || null,
            folio: mov.folio || indice || null,
            etapa: mov.etapa || null,
            tramite: mov.tramite || null,
            descripcion: mov.descripcion || mov.desc_tramite || null,
            fecha: mov.fecha || mov.fec_tramite || null,
            foja: mov.foja || null,
            tiene_pdf: !!(pdfs.azul_base64 || pdfs.rojo_base64),
            pdf_principal: pdfs.azul_nombre || null,
            pdf_anexo: pdfs.rojo_nombre || null,
            pdf_descargado: !!(pdfs.azul_base64 || pdfs.rojo_base64)
          };
        });
        
        // Guardar movimientos
        await insertMovimientosBatch(movimientosParaBD, causaId, config.rit);
        console.log(`   ✅ ${movimientosParaBD.length} movimientos guardados`);
        
        // Guardar PDFs asociados a cada movimiento
        for (const [indiceStr, pdfData] of Object.entries(pdfMapping)) {
          const indice = parseInt(indiceStr);
          if (!indice) continue;
          
          // Buscar movimiento_id por indice y rit
          const [movRows] = await query(
            'SELECT id FROM movimientos WHERE rit = ? AND indice = ? LIMIT 1',
            [config.rit, indice]
          );
          
          const movimientoId = movRows.length > 0 ? movRows[0].id : null;
          
          // Guardar PDF principal (azul) si existe
          if (pdfData.azul_base64 && pdfData.azul_nombre) {
            const tamanoBytes = Buffer.from(pdfData.azul_base64, 'base64').length;
            await registrarPdf(causaId, movimientoId, config.rit, {
              tipo: 'PRINCIPAL',
              nombre_archivo: pdfData.azul_nombre,
              contenido_base64: pdfData.azul_base64,
              tamano_bytes: tamanoBytes,
              descargado: true,
              fecha_descarga: new Date()
            });
          }
          
          // Guardar PDF anexo (rojo) si existe
          if (pdfData.rojo_base64 && pdfData.rojo_nombre) {
            const tamanoBytes = Buffer.from(pdfData.rojo_base64, 'base64').length;
            await registrarPdf(causaId, movimientoId, config.rit, {
              tipo: 'ANEXO',
              nombre_archivo: pdfData.rojo_nombre,
              contenido_base64: pdfData.rojo_base64,
              tamano_bytes: tamanoBytes,
              descargado: true,
              fecha_descarga: new Date()
            });
          }
        }
        
        console.log(`   ✅ PDFs guardados en base de datos`);
        
        // Guardar eBook si existe
        if (ebookNombre) {
          const ebookPath = path.join(pdfDir, ebookNombre);
          if (fs.existsSync(ebookPath)) {
            const ebookBase64 = require('./pdfDownloader').fileToBase64(ebookPath);
            if (ebookBase64) {
              const tamanoBytes = Buffer.from(ebookBase64, 'base64').length;
              await registrarEbook(causaId, config.rit, {
                nombre_archivo: ebookNombre,
                contenido_base64: ebookBase64,
                tamano_bytes: tamanoBytes,
                descargado: true,
                fecha_descarga: new Date()
              });
              console.log(`   ✅ eBook guardado en base de datos`);
            }
          }
        }
      } else {
        console.warn(`   ⚠️ No se pudo obtener causa_id, datos no guardados en BD`);
      }
    } catch (dbError) {
      console.warn(`   ⚠️ Error guardando en BD: ${dbError.message}`);
      console.error(dbError);
      // Continuar aunque falle el guardado en BD
    }

    // PASO 7: Descargar eBook
    console.log(`   📚 Descargando eBook...`);
    await downloadEbook(page, context, config, pdfDir);
    console.log(`   ✅ eBook descargado`);

    // PASO 8: Identificar PDF de demanda y obtener nombres
    let demandaNombre = null;
    let ebookNombre = null;
    
    // Identificar PDF de demanda (buscar movimiento con "demanda" en descripción)
    // extractTable retorna objetos con 'raw' (array de celdas) o 'folio' (primera celda)
    const movDemanda = rows.find(r => {
      // Buscar en raw (array de celdas) si existe, o en las propiedades del objeto
      if (r.raw && Array.isArray(r.raw) && r.raw.length > 5) {
        return r.raw[5] && r.raw[5].toLowerCase().includes('demanda');
      }
      // Fallback: buscar en descripción si existe
      if (r.descripcion) {
        return r.descripcion.toLowerCase().includes('demanda');
      }
      return false;
    });
    
    if (movDemanda) {
      // Usar folio del movimiento (primera celda) para buscar en pdfMapping
      const folioDemanda = movDemanda.folio || (movDemanda.raw && movDemanda.raw[0]);
      if (folioDemanda && pdfMapping[folioDemanda] && pdfMapping[folioDemanda].azul) {
        demandaNombre = pdfMapping[folioDemanda].azul;
      }
    }
    
    // Verificar si existe eBook descargado
    const ebookPath = path.join(pdfDir, `${ritClean}_ebook.pdf`);
    if (fs.existsSync(ebookPath)) {
      ebookNombre = `${ritClean}_ebook.pdf`;
    }

    // PASO 9: Crear payload completo para JSON (datosProcesados ya está definido en PASO 6a)
    const payload = {
      rit: config.rit,
      metadata: {
        processed_at: new Date().toISOString(),
        total_movimientos: Array.isArray(datosProcesados.movimientos) ? datosProcesados.movimientos.length : 0,
        tiene_documentos_pdf: !!pdfMapping && Object.keys(pdfMapping).length > 0,
        tiene_demanda: !!demandaNombre,
        tiene_ebook: !!ebookNombre,
      },
      config_entrada: {
        causa_id: config.causa_id,
        agenda_id: config.agenda_id,
        competencia: config.competencia,
        corte: config.corte,
        tribunal: config.tribunal,
        tipoCausa: config.tipoCausa,
        rol: config.rol,
        año: config.año,
        caratulado: config.caratulado,
        cliente: config.cliente,
        rut: config.rut,
        abogado_id: config.abogado_id,
        cuenta_id: config.cuenta_id,
      },
      datos_basicos: {
        rol: datosAGuardar.rol,
        fecha: datosAGuardar.fecha,
        caratulado: datosAGuardar.caratulado,
      },
      demanda: demandaNombre,
      ebook: ebookNombre,
      pdf_mapping: pdfMapping,
      // Datos estructurados de processTableData
      cabecera: datosProcesados.cabecera,
      estado_actual: datosProcesados.estado_actual,
      movimientos: datosProcesados.movimientos,
      partes: datosProcesados.partes,
    };

    // PASO 11: Guardar JSON por causa
    const jsonPath = saveCausaJSON(outputDir, config.rit, payload);
    console.log(`   ✅ JSON guardado: ${jsonPath}`);

    // Opcional: Append a NDJSON
    appendCausaNDJSON(outputDir, payload);

    // Opcional: Actualizar índice
    upsertIndex(outputDir, {
      rit: config.rit,
      processed_at: payload.metadata.processed_at,
      caratulado: payload.cabecera?.caratulado || payload.datos_basicos?.caratulado || null,
      tribunal: payload.cabecera?.juzgado || payload.config_entrada?.tribunal || null,
      estado: payload.estado_actual?.estado || null,
      fecha_ultimo_mov: payload.estado_actual?.fecha_ultimo_movimiento || null,
      total_movimientos: payload.metadata.total_movimientos,
      tiene_pdf: payload.metadata.tiene_documentos_pdf,
      tiene_demanda: payload.metadata.tiene_demanda,
      tiene_ebook: payload.metadata.tiene_ebook,
    });

    // PASO 12: Exportar también formato legacy (JSON y CSV de movimientos) para compatibilidad
    console.log(`   💾 Exportando datos legacy...`);
    exportToJSON(rows, outputDir, ritClean, pdfMapping);
    exportToCSV(rows, outputDir, ritClean);
    console.log(`   ✅ Datos legacy exportados`);

    // Cerrar modal/detalle y volver al formulario
    try {
      const closeButtons = [
        'button.close',
        '.modal-header button',
        '[data-dismiss="modal"]',
        'button[aria-label="Close"]'
      ];
      
      for (const selector of closeButtons) {
        try {
          const closeBtn = await page.$(selector);
          if (closeBtn) {
            await closeBtn.click();
            await page.waitForTimeout(500);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } catch (error) {
      console.warn('   ⚠️ No se pudo cerrar modal:', error.message);
    }

    return { 
      success: true, 
      rol: datosAGuardar.rol,
      fecha: datosAGuardar.fecha,
      caratulado: datosAGuardar.caratulado,
      movimientos: rows.length,
      json_path: jsonPath
    };
  } catch (error) {
    console.error(`   ❌ Error procesando ${config.rit}:`, error.message);
    
    // Intentar cerrar modal/volver al formulario en caso de error
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } catch (e) {
      // Ignorar errores al cerrar
    }
    
    return { success: false, error: error.message };
  }
}

// Validar si una causa es válida para scraping
// IMPORTANTE: Todas las causas con RIT son civiles
// REQUIERE: RIT y Tribunal/Juzgado (Corte puede ser default si no está en CSV)
function isValidForScraping(csvCausa) {
  // Debe tener RIT válido (formato: TIPO-ROL-AÑO)
  if (!csvCausa.rit || csvCausa.rit === 'NULL' || csvCausa.rit.trim() === '') {
    return false;
  }
  
  // Validar formato RIT (debe tener al menos 2 guiones)
  const parts = csvCausa.rit.split('-');
  if (parts.length < 3) {
    // RITs como "SIN ROL", "SOLEDAD SILV", "10187-2021" son inválidos
    return false;
  }
  
  // Validar que tenga TRIBUNAL/JUZGADO (requerido - sin esto no se puede buscar)
  const tribunal = csvCausa.tribunal || csvCausa.tribunal_id || csvCausa.juzgado || csvCausa.juzgado_id;
  if (!tribunal || tribunal === 'NULL' || String(tribunal).trim() === '') {
    return false;
  }
  
  // Corte es opcional en el CSV (si no está, usaremos default '90')
  // No validamos corte aquí porque puede no estar en el CSV
  
  return true;
}

// Procesar múltiples causas desde la base de datos
async function processMultipleCausas(limit = 10, requireTribunal = true, useDatabase = true) {
  // Cargar mapeo de tribunales a cortes al inicio
  console.log('🔍 Cargando mapeo de tribunales a cortes...');
  loadTribunalToCorteMap();
  
  let causas = [];
  let causasValidas = [];
  
  if (useDatabase) {
    console.log('📂 Leyendo causas desde la base de datos...');
    try {
      // Obtener causas de la BD (priorizar las que no han sido scraped o necesitan actualización)
      causas = await getAllCausas({ 
        pendientes: true, // Solo causas que no han sido scraped o necesitan actualización
        limit: limit * 2 // Obtener más para filtrar
      });
      
      console.log(`✅ ${causas.length} causas obtenidas de la base de datos`);
      
      // Convertir causas de BD a formato para scraping
      causasValidas = causas
        .filter(c => c.rit && c.rit.trim() !== '') // Debe tener RIT
        .map(c => ({
          ...c,
          // Asegurar que tenga los campos necesarios
          tribunal: c.tribunal_id || null,
          tribunal_id: c.tribunal_id || null,
          corte: c.corte_id || null,
          corte_id: c.corte_id || null
        }));
      
      // Filtrar solo las que tienen tribunal si es requerido
      if (requireTribunal) {
        causasValidas = causasValidas.filter(c => {
          const tribunal = c.tribunal_id;
          return tribunal && tribunal !== 'NULL' && String(tribunal).trim() !== '';
        });
      }
      
      console.log(`\n📊 Causas válidas de BD: ${causasValidas.length}`);
      console.log(`   Con tribunal/juzgado: ${causasValidas.filter(c => c.tribunal_id).length}`);
      console.log(`   Sin tribunal/juzgado: ${causasValidas.filter(c => !c.tribunal_id).length}`);
      console.log(`   ⚠️  IMPORTANTE: Solo se procesarán causas que tengan TRIBUNAL/JUZGADO`);
      console.log(`   ℹ️  CORTE: Se usará valor por defecto '90' si no está en la BD`);
      
    } catch (error) {
      console.error('❌ Error leyendo causas de la BD:', error.message);
      console.log('📂 Fallback: Leyendo CSV de causas...');
      useDatabase = false;
    }
  }
  
  // Fallback a CSV si no se pudo leer de BD o si useDatabase es false
  if (!useDatabase || causasValidas.length === 0) {
    console.log('📂 Leyendo CSV de causas...');
    causas = readCausaCSV();
    
    // Filtrar solo las válidas para scraping
    causasValidas = causas.filter(c => isValidForScraping(c));
    
    // Mostrar estadísticas de causas válidas
    const causasConTribunal = causasValidas.filter(c => {
      const tribunal = c.tribunal || c.tribunal_id || c.juzgado || c.juzgado_id;
      return tribunal && tribunal !== 'NULL' && String(tribunal).trim() !== '';
    });
    
    console.log(`\n📊 Causas válidas: ${causasValidas.length}`);
    console.log(`   Con tribunal/juzgado: ${causasConTribunal.length}`);
    console.log(`   Sin tribunal/juzgado: ${causasValidas.length - causasConTribunal.length}`);
    console.log(`   ⚠️  Nota: Todas las causas con RIT son civiles (competencia = 3)`);
    console.log(`   ⚠️  IMPORTANTE: Solo se procesarán causas que tengan TRIBUNAL/JUZGADO`);
    console.log(`   ℹ️  CORTE: Se usará valor por defecto '90' si no está en el CSV`);
    
    // Filtrar solo las que tienen tribunal (corte puede ser default)
    causasValidas = causasValidas.filter(c => {
      const tribunal = c.tribunal || c.tribunal_id || c.juzgado || c.juzgado_id;
      return tribunal && tribunal !== 'NULL' && String(tribunal).trim() !== '';
    });
    
    const causasDescartadas = causas.length - causasValidas.length;
    if (causasDescartadas > 0) {
      console.log(`   ⚠️  Se descartaron ${causasDescartadas} causas por falta de TRIBUNAL/JUZGADO`);
    }
  }
  
  console.log(`\n📊 Causas válidas para procesar: ${causasValidas.length}`);
  console.log(`   Limitando a las primeras ${limit} causas\n`);
  
  const outputDir = path.resolve(__dirname, 'outputs');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const logDir = path.resolve(__dirname, 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  
  // Validar que la URL esté configurada
  const ojvUrl = process.env.OJV_URL || 'https://oficinajudicialvirtual.pjud.cl/home/index.php';
  if (!ojvUrl) {
    throw new Error('OJV_URL no configurada. Crea un archivo .env con: OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php');
  }
  
  console.log('🌐 URL configurada:', ojvUrl);
 
  // Ejecutar navegador en modo NO headless para ver la interacción
  const { browser, context, page } = await startBrowser(ojvUrl, {
    headless: false,
    slowMo: 250 // pequeño delay para poder observar los pasos
  });
  
  try {
    // Esperar un poco más para que la página cargue completamente
    await page.waitForTimeout(3000);
    
    // Verificar página inicial con mejor diagnóstico
    const bodyContent = await page.evaluate(() => document.body.innerText);
    const pageTitle = await page.title();
    const pageUrl = page.url();
    
    console.log('📄 URL actual:', pageUrl);
    console.log('📄 Título de la página:', pageTitle);
    console.log('📄 Contenido del body (primeros 200 chars):', bodyContent ? bodyContent.substring(0, 200) : 'VACÍO');
    
    if (!bodyContent || bodyContent.trim().length === 0) {
      // Tomar screenshot para diagnóstico
      await page.screenshot({ path: path.join(logDir, `error_pagina_blanca_${Date.now()}.png`), fullPage: true });
      throw new Error(`La página está en blanco. URL: ${pageUrl}, Título: ${pageTitle}. Verifica que la URL sea correcta y que no requiera autenticación.`);
    }
    
    await closeModalIfExists(page);
    await page.waitForTimeout(1000 + Math.random() * 1000);
    
    // Navegar a consulta causas una sola vez
    await goToConsultaCausas(page);
    
    // Esperar a que el formulario esté completamente cargado
    await page.waitForSelector('#competencia', { timeout: 20000 });
    await page.waitForTimeout(1000);
    
    // Procesar cada causa
    const resultados = [];
    const causasAProcesar = causasValidas.slice(0, limit);
    
    for (let i = 0; i < causasAProcesar.length; i++) {
      const causa = causasAProcesar[i];
      // Usar la función apropiada según si viene de BD o CSV
      const config = useDatabase ? dbCausaToScrapingConfig(causa) : csvToScrapingConfig(causa);
      
      console.log(`\n[${i + 1}/${causasAProcesar.length}] Procesando causa ID: ${causa.id || causa.causa_id}`);
      
      // Validar que tenga tribunal antes de procesar (corte puede ser default)
      if (!config.tribunal || config.tribunal === 'NULL' || String(config.tribunal).trim() === '') {
        console.log(`   ⚠️ Causa saltada: No tiene TRIBUNAL/JUZGADO (RIT: ${config.rit})`);
        resultados.push({
          causa_id: causa.id || causa.causa_id,
          rit: config.rit,
          success: false,
          error: 'Falta campo TRIBUNAL/JUZGADO',
          saltada: true
        });
        continue;
      }
      
      // Validar que tenga corte (si no está, ya tiene default '90')
      if (!config.corte || config.corte === 'NULL' || String(config.corte).trim() === '') {
        console.log(`   ⚠️ Causa saltada: No tiene CORTE (RIT: ${config.rit})`);
        resultados.push({
          causa_id: causa.id || causa.causa_id,
          rit: config.rit,
          success: false,
          error: 'Falta campo CORTE',
          saltada: true
        });
        continue;
      }
      
      const resultado = await processCausa(page, context, config, outputDir);
      resultados.push({
        causa_id: causa.id || causa.causa_id,
        rit: config.rit,
        ...resultado
      });
      
      // Si hubo error, esperar más tiempo antes de continuar
      if (!resultado.success) {
        console.log(`   ⚠️ Error en causa anterior, esperando más tiempo...`);
        await page.waitForTimeout(3000 + Math.random() * 2000);
      }
      
      // Delay entre causas (como humano: 2-4 segundos)
      if (i < causasAProcesar.length - 1) {
        const delay = 2000 + Math.random() * 2000;
        console.log(`   ⏳ Esperando ${Math.round(delay/1000)}s antes de la siguiente causa...`);
        await page.waitForTimeout(delay);
        
        // Verificar que estamos en el formulario (no navegar si ya estamos ahí)
        try {
          const competencia = await page.$('#competencia');
          const hasForm = competencia !== null && await competencia.isVisible();
          
          if (!hasForm) {
            const currentUrl = page.url();
            if (!currentUrl.includes('consulta') && !currentUrl.includes('causa')) {
              console.log('   🔄 Volviendo al formulario de consulta...');
              await goToConsultaCausas(page);
              await page.waitForSelector('#competencia', { timeout: 20000 });
              await page.waitForTimeout(1000);
            } else {
              // Estamos en la URL correcta pero el formulario no es visible (puede ser modal)
              console.log('   🔄 Cerrando modales para mostrar formulario...');
              await page.keyboard.press('Escape');
              await page.waitForTimeout(500);
              await page.waitForSelector('#competencia', { timeout: 10000 });
            }
          } else {
            // Ya estamos en el formulario, solo asegurar que esté listo
            await page.waitForTimeout(500);
          }
        } catch (error) {
          console.warn('   ⚠️ No se pudo verificar formulario:', error.message);
        }
      }
    }
    
    // Resumen
    console.log('\n📊 Resumen de procesamiento:');
    const exitosas = resultados.filter(r => r.success).length;
    const fallidas = resultados.filter(r => !r.success).length;
    console.log(`   ✅ Exitosas: ${exitosas}`);
    console.log(`   ❌ Fallidas: ${fallidas}`);
    
    // Guardar log de resultados
    const logPath = path.join(logDir, `procesamiento_${Date.now()}.json`);
    fs.writeFileSync(logPath, JSON.stringify(resultados, null, 2));
    console.log(`\n📝 Log guardado en: ${logPath}`);
    
  } catch (error) {
    console.error('💥 Error general:', error);
    await saveErrorEvidence(
      page, 
      path.join(logDir, `error_${Date.now()}.png`),
      path.join(logDir, `error_${Date.now()}.html`)
    );
  } finally {
    await browser.close();
  }
}

// Ejecutar
if (require.main === module) {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 5;
  console.log(`🚀 Iniciando procesamiento de ${limit} causas...\n`);
  processMultipleCausas(limit).catch(console.error);
}

module.exports = { 
  processCausa, 
  processMultipleCausas, 
  csvToScrapingConfig,
  dbCausaToScrapingConfig,
  isValidForScraping,
  loadTribunalToCorteMap,
  getCorteFromTribunal,
  extractTipoCausa,
  extractRolAnio
};


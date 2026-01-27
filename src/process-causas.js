// Script para procesar múltiples causas desde el CSV
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { readCausaCSV, mapCsvToDB } = require('./read-csv');
const { startBrowser } = require('./browser');
const { closeModalIfExists, goToConsultaCausas } = require('./navigation');
const { fillForm, openDetalle } = require('./form');
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
    const ritBuscado = config.rit;
    const rolBuscado = config.rol;
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
    }, { ritBuscado, rolBuscado });
    
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
    
    // PASO 2: Abrir el detalle usando el mismo flujo que el sitio (detalleCausaCivil(token))
    console.log(`   🔍 Buscando icono de lupa para entrar al detalle...`);
    try {
      // 1) Buscar el token del onclick "detalleCausaCivil('TOKEN')" en la fila del RIT
      const onclickToken = await page.evaluate((ritBuscado) => {
        const tables = document.querySelectorAll('table, #tablaConsultas');
        
        for (const table of tables) {
          const rows = Array.from(table.querySelectorAll('tbody tr, tr'));
          
          for (const row of rows) {
            const rowText = row.innerText || '';
            if (!rowText) continue;

            // Emparejar por RIT completo o por la parte numérica del RIT (rol)
            const partes = ritBuscado.split('-');
            const rolRit = partes.length >= 2 ? partes[1] : null;
            const coincideRit = rowText.includes(ritBuscado);
            const coincideRol = rolRit && rowText.includes(rolRit);

            if (coincideRit || coincideRol) {
              // Buscar enlace con onclick detalleCausaCivil('TOKEN')
              const link = row.querySelector('a[onclick*="detalleCausaCivil"]') 
                        || row.querySelector('a.toggle-modal[title*="Detalle"]') 
                        || row.querySelector('a[href="#modalDetalleCivil"]');

              if (link) {
                const onclickAttr = link.getAttribute('onclick') || '';
                const match = onclickAttr.match(/detalleCausaCivil\('([^']+)'/);
                if (match && match[1]) {
                  return match[1]; // TOKEN JWT que usa el sitio
                }
              }

              // Fallback: buscar el icono y su padre <a> con onclick
              const icon = row.querySelector('i.fa-search.fa-lg, i.fa-search');
              if (icon) {
                const parentLink = icon.closest('a');
                if (parentLink) {
                  const onclickAttr = parentLink.getAttribute('onclick') || '';
                  const match = onclickAttr.match(/detalleCausaCivil\('([^']+)'/);
                  if (match && match[1]) {
                    return match[1];
                  }
                }
              }
            }
          }
        }
        return null;
      }, config.rit);

      if (!onclickToken) {
        console.log('   ⚠️ No se encontró token de detalleCausaCivil en la tabla, intentando click simple en la lupa...');
        // Último recurso: clickear el primer enlace de detalle (puede abrir modal vacío)
        await page.click('a[onclick*="detalleCausaCivil"], a[href="#modalDetalleCivil"], i.fa-search').catch(() => {
          throw new Error('No se pudo encontrar el icono/enlace de detalle');
        });
      } else {
        // 2) Ejecutar detalleCausaCivil(token) dentro del contexto de la página
        console.log('   ✅ Token de detalleCausaCivil encontrado, ejecutando función en el navegador...');
        await page.evaluate((token) => {
          // La función puede estar en window o en el scope global
          if (typeof window.detalleCausaCivil === 'function') {
            window.detalleCausaCivil(token);
          } else if (typeof detalleCausaCivil === 'function') {
            detalleCausaCivil(token);
          } else {
            // Fallback: buscar cualquier función global que contenga 'detalleCausaCivil'
            for (const key of Object.keys(window)) {
              if (key.toLowerCase().includes('detallecausacivil') && typeof window[key] === 'function') {
                window[key](token);
                break;
              }
            }
          }
        }, onclickToken);
      }

      console.log(`   ✅ Detalle solicitado vía detalleCausaCivil`);
    } catch (error) {
      console.error(`   ❌ Error abriendo detalle de la causa: ${error.message}`);
      throw error;
    }
    
    // PASO 3: Esperar a que se abra el modal de detalle Y que cargue la tabla
    console.log(`   ⏳ Esperando que se abra el detalle...`);
    try {
      // 1. Primero esperar que el modal exista en el DOM
      await Promise.race([
        page.waitForSelector('#modalDetalleCivil', { timeout: 30000, state: 'attached' }),
        page.waitForSelector('#modalDetalleLaboral', { timeout: 30000, state: 'attached' }),
        page.waitForSelector('.modal-body', { timeout: 30000, state: 'attached' })
      ]);
      console.log(`   ✅ Modal detectado en DOM`);

      // 2. CRÍTICO: Esperar a que la tabla DENTRO del modal se cargue (AJAX)
      // El modal se abre vacío y luego se llena via AJAX - necesitamos esperar el contenido
      console.log(`   ⏳ Esperando contenido del modal (tabla de movimientos)...`);
      await Promise.race([
        page.waitForSelector('#modalDetalleCivil table tbody tr:first-child', { timeout: 45000, state: 'attached' }),
        page.waitForSelector('#modalDetalleLaboral table tbody tr:first-child', { timeout: 45000, state: 'attached' }),
        page.waitForSelector('.modal-body table tbody tr:first-child', { timeout: 45000, state: 'attached' })
      ]);

      // 3. Dar tiempo adicional para que todas las filas carguen
      await page.waitForTimeout(3000);
      console.log(`   ✅ Detalle abierto con tabla cargada`);
    } catch (error) {
      // Si falla, intentar verificar si el modal existe aunque no tenga tabla aún
      const modalExists = await page.evaluate(() => {
        return document.querySelector('#modalDetalleCivil, #modalDetalleLaboral, .modal-body') !== null;
      });
      
      if (modalExists) {
        console.log('   ⚠️ Modal detectado pero tabla aún no cargada, esperando adicional...');
        await page.waitForTimeout(3000);
        // Intentar una vez más
        await page.waitForSelector('#modalDetalleCivil table, #modalDetalleLaboral table, .modal-body table', { 
          timeout: 10000,
          state: 'attached'
        });
        console.log(`   ✅ Tabla de detalle finalmente cargada`);
      } else {
        throw new Error(`Modal de detalle no se abrió: ${error.message}`);
      }
    }

    // DIAGNÓSTICO: Verificar estructura del modal antes de extraer tabla
    console.log(`   🔍 Diagnosticando estructura del modal...`);
    const modalDiagnostic = await page.evaluate(() => {
      const modals = [
        document.querySelector('#modalDetalleCivil'),
        document.querySelector('#modalDetalleLaboral'),
        document.querySelector('.modal-body'),
        document.querySelector('.modal')
      ].filter(Boolean);

      if (modals.length === 0) {
        return { error: 'No se encontró ningún modal', modalsFound: 0 };
      }

      const modal = modals[0]; // Usar el primer modal encontrado
      const tables = modal.querySelectorAll('table');
      const tablesInfo = Array.from(tables).map(t => ({
        className: t.className,
        id: t.id,
        rowCount: t.querySelectorAll('tbody tr').length,
        firstRowHTML: t.querySelector('tbody tr') ? t.querySelector('tbody tr').innerHTML.substring(0, 300) : null
      }));

      return {
        modalId: modal.id,
        modalClass: modal.className,
        tablesCount: tables.length,
        tables: tablesInfo,
        modalHTML: modal.innerHTML.substring(0, 1000) // Primeros 1000 chars del modal
      };
    });

    console.log(`   📋 Modal encontrado:`, JSON.stringify(modalDiagnostic, null, 2));

    // PASO 4: Extraer tabla de movimientos
    console.log(`   📊 Extrayendo tabla de movimientos...`);
    const rows = await extractTableAsArray(page);
    console.log(`   ✅ Extraídas ${rows.length} filas de movimientos`);

    // PASO 5: Crear subcarpeta para PDFs
    const pdfDir = path.join(outputDir, 'pdf');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    // PASO 6: Descargar PDFs (pasar las rows ya extraídas)
    console.log(`   📄 Descargando PDFs...`);
    const pdfMapping = await downloadPDFsFromTable(page, context, pdfDir, ritClean, rows) || {};
    console.log(`   ✅ PDFs descargados`);

    // PASO 7: Descargar eBook
    console.log(`   📚 Descargando eBook...`);
    await downloadEbook(page, context, config, pdfDir);
    console.log(`   ✅ eBook descargado`);

    // PASO 8: Identificar PDF de demanda y obtener nombres
    let demandaNombre = null;
    let ebookNombre = null;
    
    // Identificar PDF de demanda (buscar movimiento con "demanda" en descripción)
    // extractTableAsArray retorna objetos con 'texto' (array de celdas) y 'datos_limpios'
    const movDemanda = rows.find(r => {
      // Buscar en texto (array de celdas) - índice 5 suele ser descripción del trámite
      if (r.texto && Array.isArray(r.texto) && r.texto.length > 5) {
        return r.texto[5] && r.texto[5].toLowerCase().includes('demanda');
      }
      // Fallback: buscar en datos_limpios
      if (r.datos_limpios && r.datos_limpios.desc_tramite) {
        return r.datos_limpios.desc_tramite.toLowerCase().includes('demanda');
      }
      return false;
    });
    
    if (movDemanda) {
      // Usar folio del movimiento (primera celda) para buscar en pdfMapping
      const folioDemanda = movDemanda.datos_limpios?.folio || movDemanda.texto?.[0];
      const indiceMov = parseInt(folioDemanda) || null;
      if (indiceMov && pdfMapping[indiceMov] && pdfMapping[indiceMov].azul) {
        demandaNombre = pdfMapping[indiceMov].azul_nombre || pdfMapping[indiceMov].azul;
      }
    }
    
    // Verificar si existe eBook descargado
    const ebookPath = path.join(pdfDir, `${ritClean}_ebook.pdf`);
    if (fs.existsSync(ebookPath)) {
      ebookNombre = `${ritClean}_ebook.pdf`;
    }

    // PASO 9: Procesar datos estructurados
    const datosProcesados = processTableData(rows, config.rit, pdfMapping);

    // PASO 10: Crear payload completo para JSON
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

// Procesar múltiples causas
async function processMultipleCausas(limit = 10, requireTribunal = true) {
  console.log('📂 Leyendo CSV de causas...');
  
  // Cargar mapeo de tribunales a cortes al inicio
  console.log('🔍 Cargando mapeo de tribunales a cortes...');
  loadTribunalToCorteMap();
  
  const causas = readCausaCSV();
  
  // Filtrar solo las válidas para scraping
  let causasValidas = causas.filter(c => isValidForScraping(c));
  
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
  
  console.log(`\n📊 Causas válidas para procesar: ${causasValidas.length}`);
  console.log(`   Limitando a las primeras ${limit} causas\n`);
  
  const outputDir = path.resolve(__dirname, 'outputs');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const logDir = path.resolve(__dirname, 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  
  const { browser, context, page } = await startBrowser(process.env.OJV_URL);
  
  try {
    // Verificar página inicial
    const bodyContent = await page.evaluate(() => document.body.innerText);
    if (!bodyContent || bodyContent.trim().length === 0) {
      throw new Error('La página está en blanco');
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
      const csvCausa = causasAProcesar[i];
      const config = csvToScrapingConfig(csvCausa);
      
      console.log(`\n[${i + 1}/${causasAProcesar.length}] Procesando causa ID: ${csvCausa.causa_id}`);
      
      // Validar que tenga tribunal antes de procesar (corte puede ser default)
      if (!config.tribunal || config.tribunal === 'NULL' || String(config.tribunal).trim() === '') {
        console.log(`   ⚠️ Causa saltada: No tiene TRIBUNAL/JUZGADO (RIT: ${config.rit})`);
        resultados.push({
          causa_id: csvCausa.causa_id,
          rit: config.rit,
          success: false,
          error: 'Falta campo TRIBUNAL/JUZGADO',
          saltada: true
        });
        continue;
      }
      
      // Validar que tenga corte (si no está en CSV, ya tiene default '90')
      if (!config.corte || config.corte === 'NULL' || String(config.corte).trim() === '') {
        console.log(`   ⚠️ Causa saltada: No tiene CORTE (RIT: ${config.rit})`);
        resultados.push({
          causa_id: csvCausa.causa_id,
          rit: config.rit,
          success: false,
          error: 'Falta campo CORTE',
          saltada: true
        });
        continue;
      }
      
      const resultado = await processCausa(page, context, config, outputDir);
      resultados.push({
        causa_id: csvCausa.causa_id,
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
  isValidForScraping,
  loadTribunalToCorteMap,
  getCorteFromTribunal,
  extractTipoCausa,
  extractRolAnio
};


/**
 * Sistema de Almacenamiento de Resultados de Scraping
 * 
 * Almacena los resultados del scraping en archivos JSON para consulta posterior
 */

const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.resolve(__dirname, '../storage');
const RESULTS_FILE = path.join(STORAGE_DIR, 'resultados.json');

// Asegurar que el directorio existe
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Cargar todos los resultados guardados
 */
function cargarResultados() {
  try {
    if (!fs.existsSync(RESULTS_FILE)) {
      return {};
    }
    const data = fs.readFileSync(RESULTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error cargando resultados:', error.message);
    return {};
  }
}

/**
 * Guardar un resultado de scraping
 * 
 * @param {string} rit - RIT de la causa
 * @param {Object} resultado - Resultado del scraping
 */
function guardarResultado(rit, resultado) {
  try {
    const resultados = cargarResultados();
    resultados[rit] = {
      ...resultado,
      fecha_guardado: new Date().toISOString()
    };
    
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(resultados, null, 2), 'utf-8');
    console.log(`✅ Resultado guardado para RIT: ${rit}`);
    return true;
  } catch (error) {
    console.error('Error guardando resultado:', error.message);
    return false;
  }
}

/**
 * Normalizar RIT para buscar archivos
 */
function normalizarRITParaArchivo(rit) {
  if (!rit) return '';
  return rit.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Buscar resultado en archivos JSON de outputs
 */
function buscarResultadoEnArchivos(rit) {
  try {
    const outputsDir = path.resolve(__dirname, '../outputs');
    if (!fs.existsSync(outputsDir)) {
      console.log(`[storage] Directorio outputs no existe: ${outputsDir}`);
      return null;
    }

    const ritNormalizado = normalizarRITParaArchivo(rit);
    console.log(`[storage] Buscando archivos para RIT: ${rit}`);
    console.log(`[storage] ritNormalizado: ${ritNormalizado}`);
    
    // Buscar archivo movimientos_*.json (estructurado del scraper-5-causas)
    const archivoMovimientos = path.join(outputsDir, `movimientos_${ritNormalizado}.json`);
    if (fs.existsSync(archivoMovimientos)) {
      const datos = JSON.parse(fs.readFileSync(archivoMovimientos, 'utf-8'));
      
      // Los PDFs ya vienen en base64 dentro de los movimientos (pdf_azul.base64, pdf_rojo.base64)
      // También puede haber pdf_ebook en el nivel de causa
      const pdfsBase64 = {};
      
      // Extraer PDFs base64 de los movimientos
      if (datos.movimientos && Array.isArray(datos.movimientos)) {
        datos.movimientos.forEach((mov, idx) => {
          if (mov.pdf_azul && mov.pdf_azul.base64) {
            const nombre = mov.pdf_azul.nombre || `${ritNormalizado}_mov_${mov.folio || mov.indice || idx}_azul.pdf`;
            pdfsBase64[nombre] = mov.pdf_azul.base64;
          }
          if (mov.pdf_rojo && mov.pdf_rojo.base64) {
            const nombre = mov.pdf_rojo.nombre || `${ritNormalizado}_mov_${mov.folio || mov.indice || idx}_rojo.pdf`;
            pdfsBase64[nombre] = mov.pdf_rojo.base64;
          }
        });
      }
      
      // Agregar eBook si existe (pdf_ebook)
      if (datos.ebook && datos.ebook.base64) {
        const nombreEbook = datos.ebook.nombre || datos.pdf_ebook?.nombre || `${ritNormalizado}_ebook.pdf`;
        pdfsBase64[nombreEbook] = datos.ebook.base64;
      } else if (datos.pdf_ebook && datos.pdf_ebook.base64) {
        const nombreEbook = datos.pdf_ebook.nombre || `${ritNormalizado}_ebook.pdf`;
        pdfsBase64[nombreEbook] = datos.pdf_ebook.base64;
      }
      
      // También buscar PDFs físicos si no están en base64 (fallback)
      const pdfFiles = fs.readdirSync(outputsDir).filter(f => 
        f.startsWith(ritNormalizado) && f.endsWith('.pdf')
      );
      
      for (const pdfFile of pdfFiles) {
        if (!pdfsBase64[pdfFile]) {
          const pdfPath = path.join(outputsDir, pdfFile);
          try {
            const fileBuffer = fs.readFileSync(pdfPath);
            pdfsBase64[pdfFile] = fileBuffer.toString('base64');
          } catch (error) {
            console.warn(`No se pudo leer PDF ${pdfFile}:`, error.message);
          }
        }
      }
      
      // Estructurar resultado como lo espera el sistema
      return {
        rit: datos.rit || datos.cabecera?.rit || rit,
        fecha_scraping: datos.procesado_en || datos.metadata?.fecha_procesamiento || new Date().toISOString(),
        movimientos: datos.movimientos || [],
        cabecera: datos.cabecera || {},
        estado_actual: datos.estado_actual || {},
        pdfs: pdfsBase64,
        ebook: datos.ebook || datos.pdf_ebook || null,
        pdf_ebook: datos.pdf_ebook || (datos.ebook ? { rit: datos.rit, nombre: datos.ebook.nombre, base64: datos.ebook.base64, tipo: datos.ebook.tipo, tamaño_kb: datos.ebook.tamaño_kb } : null),
        cuadernos: datos.cuadernos || null,
        total_movimientos: datos.movimientos?.length || datos.metadata?.total_movimientos || 0,
        total_pdfs: Object.keys(pdfsBase64).length,
        estado: 'completado'
      };
    }
    
    // También buscar con RIT sin prefijo (16707_2019 en vez de C_16707_2019)
    const ritSinPrefijo = rit.replace(/^[A-Za-z]-/, '').replace(/-/g, '_');
    console.log(`[storage] ritSinPrefijo: ${ritSinPrefijo}`);

    // Si no hay movimientos, intentar con resultado_*.json (crudo)
    const archivoResultado = path.join(outputsDir, `resultado_${ritNormalizado}.json`);
    const archivoResultadoSinPrefijo = path.join(outputsDir, `resultado_${ritSinPrefijo}.json`);
    const archivoParaLeer = fs.existsSync(archivoResultado) ? archivoResultado :
                           (fs.existsSync(archivoResultadoSinPrefijo) ? archivoResultadoSinPrefijo : null);

    if (archivoParaLeer) {
      const contenido = JSON.parse(fs.readFileSync(archivoParaLeer, 'utf-8'));
      
      // Si son filas crudas (array de arrays), procesarlas
      if (Array.isArray(contenido) && contenido.length > 0 && Array.isArray(contenido[0])) {
        try {
          const { processTableData } = require('../dataProcessor');
        
        // Leer PDFs primero para mapeo
        const pdfFiles = fs.readdirSync(outputsDir).filter(f => 
          f.startsWith(ritNormalizado) && f.endsWith('.pdf')
        );
        
        // Intentar reconstruir el mapeo de PDFs desde nombres de archivos
        const pdfMapping = {};
        pdfFiles.forEach(pdfFile => {
          // Formato esperado: 
          // - C_571_2019_mov_11_azul.pdf (movimiento con tipo)
          // - C_3030_2017_doc_18.pdf (documento directo)
          const matchMov = pdfFile.match(/mov_(\d+)_(azul|rojo)\.pdf$/i);
          const matchDoc = pdfFile.match(/doc_(\d+)\.pdf$/i);
          
          if (matchMov) {
            const indice = parseInt(matchMov[1]);
            const tipo = matchMov[2];
            if (!pdfMapping[indice]) {
              pdfMapping[indice] = { azul: null, rojo: null };
            }
            pdfMapping[indice][tipo] = pdfFile;
          } else if (matchDoc) {
            // Para formato doc_INDICE, asignar como azul (principal)
            const indice = parseInt(matchDoc[1]);
            if (!pdfMapping[indice]) {
              pdfMapping[indice] = { azul: null, rojo: null };
            }
            pdfMapping[indice].azul = pdfFile;
          }
        });
        
        try {
          const datosProcesados = processTableData(contenido, rit, pdfMapping);
          
          // Leer PDFs y convertirlos a base64
          const pdfsBase64 = {};
          for (const pdfFile of pdfFiles) {
            const pdfPath = path.join(outputsDir, pdfFile);
            try {
              const fileBuffer = fs.readFileSync(pdfPath);
              pdfsBase64[pdfFile] = fileBuffer.toString('base64');
            } catch (error) {
              console.warn(`No se pudo leer PDF ${pdfFile}:`, error.message);
            }
          }
          
          return {
            rit: rit,
            fecha_scraping: new Date().toISOString(),
            movimientos: datosProcesados.movimientos || [],
            cabecera: datosProcesados.cabecera || {},
            estado_actual: datosProcesados.estado_actual || {},
            pdfs: pdfsBase64,
            total_movimientos: datosProcesados.movimientos?.length || 0,
            total_pdfs: Object.keys(pdfsBase64).length,
            estado: 'completado'
          };
        } catch (error) {
          console.error(`Error procesando resultado crudo para ${rit}:`, error.message);
          return null;
        }
        } catch (outerError) {
          console.error(`Error cargando dataProcessor para ${rit}:`, outerError.message);
          return null;
        }
      }
    }

    // Buscar archivos CSV: resultado_*.csv
    const archivoCsv = path.join(outputsDir, `resultado_${ritNormalizado}.csv`);
    const archivoCsvSinPrefijo = path.join(outputsDir, `resultado_${ritSinPrefijo}.csv`);
    console.log(`[storage] Buscando CSV: ${archivoCsv}`);
    console.log(`[storage] Buscando CSV sin prefijo: ${archivoCsvSinPrefijo}`);
    console.log(`[storage] Existe archivoCsv: ${fs.existsSync(archivoCsv)}`);
    console.log(`[storage] Existe archivoCsvSinPrefijo: ${fs.existsSync(archivoCsvSinPrefijo)}`);
    const csvParaLeer = fs.existsSync(archivoCsv) ? archivoCsv :
                        (fs.existsSync(archivoCsvSinPrefijo) ? archivoCsvSinPrefijo : null);

    if (csvParaLeer) {
      console.log(`[storage] ✅ Leyendo CSV: ${csvParaLeer}`);
      try {
        const contenidoCsv = fs.readFileSync(csvParaLeer, 'utf-8');
        const lineas = contenidoCsv.split('\n').filter(l => l.trim());

        if (lineas.length > 1) {
          // Primera línea son los headers
          // headers: rit;indice;fecha;tipo_movimiento;subtipo_movimiento;descripcion;folio;tiene_pdf;caratulado;juzgado
          const movimientos = [];
          let cabecera = {};

          for (let i = 1; i < lineas.length; i++) {
            const campos = lineas[i].split(';');
            const mov = {
              indice: parseInt(campos[1]) || i,
              fecha: campos[2] || '',
              tipo_movimiento: campos[3] || '',
              subtipo_movimiento: campos[4] || '',
              descripcion: campos[5] || '',
              folio: campos[6] || '',
              tiene_pdf: campos[7] === 'SI'
            };
            movimientos.push(mov);

            // Obtener cabecera del primer registro
            if (i === 1) {
              cabecera = {
                rit: campos[0] || rit,
                caratulado: campos[8] || '',
                juzgado: campos[9] || ''
              };
            }
          }

          // Leer PDFs disponibles
          const pdfsBase64 = {};
          const pdfFiles = fs.readdirSync(outputsDir).filter(f =>
            (f.startsWith(ritNormalizado) || f.startsWith(ritSinPrefijo)) && f.endsWith('.pdf')
          );

          for (const pdfFile of pdfFiles) {
            const pdfPath = path.join(outputsDir, pdfFile);
            try {
              const fileBuffer = fs.readFileSync(pdfPath);
              pdfsBase64[pdfFile] = fileBuffer.toString('base64');
            } catch (error) {
              console.warn(`No se pudo leer PDF ${pdfFile}:`, error.message);
            }
          }

          return {
            rit: cabecera.rit || rit,
            fecha_scraping: new Date().toISOString(),
            movimientos: movimientos,
            cabecera: cabecera,
            estado_actual: {},
            pdfs: pdfsBase64,
            total_movimientos: movimientos.length,
            total_pdfs: Object.keys(pdfsBase64).length,
            estado: 'completado'
          };
        }
      } catch (error) {
        console.error(`Error leyendo CSV para ${rit}:`, error.message);
      }
    }

    return null;
  } catch (error) {
    console.error(`Error buscando resultado en archivos para ${rit}:`, error.message);
    return null;
  }
}

/**
 * Obtener un resultado por RIT
 * Busca primero en storage, luego en archivos JSON de outputs
 * 
 * @param {string} rit - RIT de la causa
 */
function obtenerResultado(rit) {
  // Primero buscar en storage
  const resultados = cargarResultados();
  if (resultados[rit]) {
    return resultados[rit];
  }
  
  // Si no está en storage, buscar en archivos JSON
  const resultadoArchivo = buscarResultadoEnArchivos(rit);
  if (resultadoArchivo) {
    return resultadoArchivo;
  }
  
  // Intentar variaciones del RIT
  const variaciones = [
    rit.toUpperCase(),
    rit.toLowerCase(),
    rit.replace(/-/g, '_'),
    rit.replace(/_/g, '-')
  ];
  
  for (const variacion of variaciones) {
    if (variacion !== rit) {
      if (resultados[variacion]) {
        return resultados[variacion];
      }
      const resultadoVar = buscarResultadoEnArchivos(variacion);
      if (resultadoVar) {
        return resultadoVar;
      }
    }
  }
  
  return null;
}

/**
 * Listar todos los RITs disponibles (de storage y archivos)
 */
function listarRITs() {
  const resultados = cargarResultados();
  const rits = new Set();
  
  // Agregar RITs de storage
  Object.keys(resultados).forEach(rit => rits.add(rit));
  
  // Buscar RITs en archivos JSON de outputs
  try {
    const outputsDir = path.resolve(__dirname, '../outputs');
    if (fs.existsSync(outputsDir)) {
      const archivos = fs.readdirSync(outputsDir);
      
      // Buscar archivos movimientos_*.json y resultado_*.json
      archivos.forEach(archivo => {
        if (archivo.startsWith('movimientos_') && archivo.endsWith('.json')) {
          // Extraer RIT del nombre: movimientos_C_571_2019.json -> C-571-2019
          const ritDelArchivo = archivo.replace('movimientos_', '').replace('.json', '').replace(/_/g, '-');
          rits.add(ritDelArchivo);
        } else if (archivo.startsWith('resultado_') && archivo.endsWith('.json')) {
          const ritDelArchivo = archivo.replace('resultado_', '').replace('.json', '').replace(/_/g, '-');
          rits.add(ritDelArchivo);
        }
      });
    }
  } catch (error) {
    console.error('Error listando RITs desde archivos:', error.message);
  }
  
  // Retornar lista con información
  return Array.from(rits).map(rit => {
    const resultado = obtenerResultado(rit);
    return {
      rit,
      fecha_scraping: resultado?.fecha_scraping || null,
      total_movimientos: resultado?.total_movimientos || resultado?.movimientos?.length || 0,
      total_pdfs: resultado?.total_pdfs || (resultado?.pdfs ? Object.keys(resultado.pdfs).length : 0)
    };
  });
}

/**
 * Eliminar un resultado
 * 
 * @param {string} rit - RIT de la causa
 */
function eliminarResultado(rit) {
  try {
    const resultados = cargarResultados();
    if (resultados[rit]) {
      delete resultados[rit];
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(resultados, null, 2), 'utf-8');
      console.log(`✅ Resultado eliminado para RIT: ${rit}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error eliminando resultado:', error.message);
    return false;
  }
}

module.exports = {
  guardarResultado,
  obtenerResultado,
  listarRITs,
  eliminarResultado,
  cargarResultados
};
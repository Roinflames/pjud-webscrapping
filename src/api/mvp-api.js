/**
 * API MVP - Endpoints para gestión completa de causas y scraping
 */

const express = require('express');
const router = express.Router();
const { obtenerCausas, obtenerCausasValidas, obtenerEstadisticasCausas, buscarCausaPorRIT, prepararConfigScraping } = require('../mvp/causa-manager');
const { inicializarCola, cargarCola, procesarSiguiente, obtenerEstadisticasCola, verificarLimiteDiario } = require('../mvp/cola-scraping');
const { executeScraping } = require('./scraper-service');
const { guardarResultado, obtenerResultado, listarRITs, eliminarResultado } = require('./storage');
const { middlewareAuth } = require('./auth');
const fs = require('fs');
const path = require('path');

/**
 * Verificar si una causa tiene movimientos procesados
 */
function tieneMovimientos(rit) {
  try {
    // Verificar en resultados de scraping
    const resultado = obtenerResultado(rit);
    if (resultado && resultado.movimientos && resultado.movimientos.length > 0) {
      return true;
    }

    // Verificar en archivos JSON de movimientos
    const outputsDir = path.resolve(__dirname, '../outputs');
    const archivoMovimientos = path.join(outputsDir, `movimientos_${rit.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
    if (fs.existsSync(archivoMovimientos)) {
      const contenido = JSON.parse(fs.readFileSync(archivoMovimientos, 'utf-8'));
      if (contenido.movimientos && contenido.movimientos.length > 0) {
        return true;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * GET /api/mvp/causas
 * Obtiene todas las causas (con filtros opcionales)
 * 
 * Query params:
 * - valida: 'true' para solo causas válidas (de causa_validas.csv)
 * - conMovimientos: 'true' para solo causas con movimientos procesados
 * - competencia, tribunal, tipoCausa: filtros adicionales
 */
router.get('/causas', (req, res) => {
  try {
    const { valida, conMovimientos, competencia, tribunal, tipoCausa, limite, offset = 0 } = req.query;
    
    // Cargar desde causa_validas.csv si se solicita
    let causas;
    if (valida === 'true') {
      // Cargar desde causa_validas.csv
      const validasPath = path.resolve(__dirname, '../../causa_validas.csv');
      if (fs.existsSync(validasPath)) {
        const { readCausaCSV } = require('../read-csv');
        const causasRaw = readCausaCSV(validasPath);
        causas = causasRaw.map(c => ({
          causa_id: c.causa_id,
          agenda_id: c.agenda_id,
          rit: c.rit,
          caratulado: c.caratulado,
          competencia: c.competencia,
          tribunal: c.tribunal,
          tipoCausa: c.rit ? c.rit.split('-')[0] : 'C',
          abogado_id: c.abogado_id || null,
          valida: true,
          errores: []
        }));
      } else {
        causas = obtenerCausasValidas();
      }
    } else {
      causas = obtenerCausas();
    }

    // Filtrar por movimientos si se solicita
    if (conMovimientos === 'true') {
      causas = causas.filter(c => {
        const rit = c.rit || c.id_causa;
        return rit && tieneMovimientos(rit);
      });
    }

    // Aplicar filtros adicionales
    if (competencia) {
      causas = causas.filter(c => c.competencia === competencia);
    }
    if (tribunal) {
      causas = causas.filter(c => c.tribunal === tribunal);
    }
    if (tipoCausa) {
      causas = causas.filter(c => c.tipoCausa === tipoCausa);
    }

    const total = causas.length;
    
    // Paginación
    if (limite) {
      const start = parseInt(offset) || 0;
      const end = start + parseInt(limite);
      causas = causas.slice(start, end);
    }

    // Agregar estado de movimientos a cada causa
    const causasConEstado = causas.map(c => {
      const rit = c.rit || c.id_causa;
      const tieneMovs = rit ? tieneMovimientos(rit) : false;
      
      return {
        causa_id: c.causa_id || c.id,
        agenda_id: c.agenda_id,
        rit: rit,
        caratulado: c.caratulado || c.causa_nombre,
        competencia: c.competencia,
        tribunal: c.tribunal,
        tipoCausa: c.tipoCausa,
        abogado_id: c.abogado_id || null, // Agregar abogado_id para filtros
        valida: c.validacion?.valida !== false,
        errores: c.validacion?.errores || [],
        tieneMovimientos: tieneMovs,
        estado: tieneMovs ? 'procesada' : 'pendiente'
      };
    });

    res.json({
      total,
      cantidad: causasConEstado.length,
      offset: parseInt(offset) || 0,
      causas: causasConEstado
    });
  } catch (error) {
    console.error('Error obteniendo causas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mvp/causas/:rit
 * Obtiene una causa específica por RIT
 */
router.get('/causas/:rit', (req, res) => {
  try {
    const causa = buscarCausaPorRIT(req.params.rit);
    if (!causa) {
      return res.status(404).json({ error: 'Causa no encontrada' });
    }

    res.json({
      causa: {
        causa_id: causa.causa_id || causa.id,
        rit: causa.rit || causa.id_causa,
        caratulado: causa.caratulado || causa.causa_nombre,
        competencia: causa.competencia,
        tribunal: causa.tribunal,
        tipoCausa: causa.tipoCausa,
        corte: causa.corte,
        valida: causa.validacion?.valida || false,
        errores: causa.validacion?.errores || [],
        config_scraping: causa.validacion?.valida ? prepararConfigScraping(causa) : null
      }
    });
  } catch (error) {
    console.error('Error obteniendo causa:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mvp/estadisticas
 * Obtiene estadísticas generales
 */
router.get('/estadisticas', (req, res) => {
  try {
    const statsCausas = obtenerEstadisticasCausas();
    const statsCola = obtenerEstadisticasCola();
    const limite = verificarLimiteDiario();
    const resultados = listarRITs();

    res.json({
      causas: statsCausas,
      cola: statsCola,
      limite_diario: limite,
      resultados_scraping: {
        total: resultados.length,
        rits: resultados.map(r => r.rit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mvp/scraping/ejecutar
 * Ejecuta scraping de una causa específica
 */
router.post('/scraping/ejecutar', middlewareAuth, async (req, res) => {
  try {
    const { rit } = req.body;

    if (!rit) {
      return res.status(400).json({ error: 'RIT requerido' });
    }

    const causa = buscarCausaPorRIT(rit);
    if (!causa) {
      return res.status(404).json({ error: 'Causa no encontrada' });
    }

    if (!causa.validacion?.valida) {
      return res.status(400).json({ 
        error: 'Causa inválida para scraping', 
        errores: causa.validacion?.errores || [] 
      });
    }

    const config = prepararConfigScraping(causa);
    console.log(`🚀 Ejecutando scraping para: ${config.rit}`);

    const resultado = await executeScraping(config);
    
    if (resultado && resultado.movimientos) {
      guardarResultado(config.rit, resultado);
    }

    res.json({
      success: true,
      rit: config.rit,
      resultado: {
        movimientos: resultado.movimientos?.length || 0,
        pdfs: resultado.pdfs?.length || 0,
        fecha: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error ejecutando scraping:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mvp/cola/inicializar
 * Inicializa cola de scraping con causas
 */
router.post('/cola/inicializar', middlewareAuth, (req, res) => {
  try {
    const { competencia, tribunal, tipoCausa, limite } = req.body;

    const cola = inicializarCola(null, {
      competencia,
      tribunal,
      tipoCausa,
      limite
    });

    res.json({
      success: true,
      cola: {
        total: cola.pendientes.length,
        fecha_inicio: cola.fecha_inicio
      }
    });
  } catch (error) {
    console.error('Error inicializando cola:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mvp/cola/estado
 * Obtiene estado actual de la cola
 */
router.get('/cola/estado', (req, res) => {
  try {
    const stats = obtenerEstadisticasCola();
    if (!stats) {
      return res.json({ estado: 'no_inicializada' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estado de cola:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mvp/cola/procesar
 * Procesa siguiente item de la cola
 */
router.post('/cola/procesar', middlewareAuth, async (req, res) => {
  try {
    const resultado = await procesarSiguiente();
    res.json(resultado);
  } catch (error) {
    console.error('Error procesando cola:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mvp/resultados
 * Lista todos los resultados de scraping disponibles
 */
/**
 * GET /api/mvp/resultados
 * Lista todos los resultados de scraping disponibles (PÚBLICO)
 */
router.get('/resultados', (req, res) => {
  try {
    const resultados = listarRITs();
    res.json({
      total: resultados.length,
      resultados: resultados
    });
  } catch (error) {
    console.error('Error listando resultados:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mvp/resultados/:rit
 * Obtiene resultado de scraping de una causa (PÚBLICO)
 * Incluye movimientos y PDFs en base64
 */
router.get('/resultados/:rit', (req, res) => {
  try {
    const resultado = obtenerResultado(req.params.rit);
    if (!resultado) {
      return res.status(404).json({ error: 'Resultado no encontrado' });
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error obteniendo resultado:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mvp/movimientos/:rit
 * Obtiene movimientos de una causa específica (PÚBLICO)
 * Vista optimizada para mostrar movimientos similar a PJUD
 */
router.get('/movimientos/:rit', (req, res) => {
  try {
    const rit = req.params.rit;
    
    // obtenerResultado ya busca en storage y archivos JSON, procesando archivos crudos
    let resultado = obtenerResultado(rit);
    
    if (!resultado) {
      return res.status(404).json({ 
        error: 'Resultado no encontrado',
        mensaje: 'Esta causa aún no ha sido procesada. Ejecuta scraping primero.'
      });
    }
    
    // Buscar PDFs disponibles en el directorio outputs
    const outputsDir = path.resolve(__dirname, '../outputs');
    const ritClean = rit.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Buscar todos los PDFs relacionados con este RIT
    const pdfsDisponibles = [];
    try {
      const archivos = fs.readdirSync(outputsDir);
      archivos.forEach(archivo => {
        if (archivo.startsWith(ritClean) && archivo.endsWith('.pdf')) {
          pdfsDisponibles.push(archivo);
        }
      });
    } catch (error) {
      console.error('Error leyendo directorio de outputs:', error);
    }
    
    // Mapear PDFs a movimientos según el índice/folio
    if (resultado.movimientos && Array.isArray(resultado.movimientos)) {
      resultado.movimientos = resultado.movimientos.map(mov => {
        // Obtener índice del movimiento (puede ser indice o folio)
        const indiceMov = parseInt(mov.indice) || parseInt(mov.folio) || null;
        
        // Si ya tiene nombres de PDF asignados desde storage.js, usarlos
        if (mov.pdf_principal_nombre || mov.pdf_anexo_nombre) {
          return mov;
        }
        
        // Si tiene_pdf es true y hay índice, buscar PDFs
        if (mov.tiene_pdf && indiceMov !== null && pdfsDisponibles.length > 0) {
          // Buscar PDFs que correspondan a este movimiento
          // Formatos posibles:
          // - C_3030_2017_doc_18.pdf (formato doc)
          // - C_3030_2017_mov_18_azul.pdf (formato mov con tipo)
          // - C_3030_2017_mov_18_rojo.pdf
          const pdfsMov = pdfsDisponibles.filter(pdf => {
            // Extraer número del documento del nombre del archivo
            const matchDoc = pdf.match(/_doc_(\d+)\.pdf$/i);
            const matchMov = pdf.match(/_mov_(\d+)_/i);
            
            if (matchDoc && parseInt(matchDoc[1]) === indiceMov) {
              return true;
            }
            if (matchMov && parseInt(matchMov[1]) === indiceMov) {
              return true;
            }
            // También buscar formato alternativo: C_RIT_mov_INDICE_P.pdf (P = Principal/Azul, pero puede ser Rojo en algunos casos)
            const matchMovP = pdf.match(/_mov_(\d+)_P\.pdf$/i);
            if (matchMovP && parseInt(matchMovP[1]) === indiceMov) {
              return true;
            }
            return false;
          });
          
          if (pdfsMov.length > 0) {
            // Separar PDFs azules y rojos según el formato
            // Formatos reconocidos:
            // - _mov_INDICE_azul.pdf (azul)
            // - _mov_INDICE_rojo.pdf (rojo)
            // - _mov_INDICE_P.pdf (rojo/anexo - formato alternativo)
            // - _mov_INDICE_A.pdf (azul - formato alternativo raro)
            // - _doc_INDICE.pdf (formato antiguo - por defecto azul, pero puede haber múltiples)
            
            const pdfAzul = pdfsMov.find(p => {
              const lower = p.toLowerCase();
              // Buscar formato explícito azul
              if (lower.includes('_azul') || lower.includes('_a.pdf')) {
                return true;
              }
              // Si es formato _doc_ y no hay otro PDF para este movimiento, es azul
              if (lower.includes('_doc_') && !lower.includes('_rojo') && !lower.includes('_p.pdf') && !lower.includes('_anexo')) {
                // Verificar si hay otro PDF con formato _P o _rojo para el mismo movimiento
                const tieneRojo = pdfsMov.some(p2 => {
                  const lower2 = p2.toLowerCase();
                  return lower2.includes('_p.pdf') || lower2.includes('_rojo') || lower2.includes('_anexo');
                });
                // Si no tiene rojo, o si este es el único PDF, es azul
                return !tieneRojo || pdfsMov.length === 1;
              }
              return false;
            });
            
            const pdfRojo = pdfsMov.find(p => {
              const lower = p.toLowerCase();
              // Buscar formato explícito rojo
              // Nota: _P.pdf puede ser Principal (azul) o Anexo (rojo) dependiendo del contexto
              // Pero en el sistema actual, generalmente _P.pdf es el anexo/rojo
              if (lower.includes('_rojo') || 
                  lower.match(/_mov_\d+_p\.pdf$/i) ||  // Formato _mov_INDICE_P.pdf (generalmente rojo)
                  lower.includes('_anexo')) {
                return true;
              }
              return false;
            });
            
            // Asignar PDFs
            if (pdfAzul && pdfRojo) {
              // Hay ambos tipos explícitos
              mov.pdf_principal_nombre = pdfAzul;
              mov.pdf_anexo_nombre = pdfRojo;
            } else if (pdfsMov.length === 1) {
              // Solo hay un PDF, asignarlo como principal
              mov.pdf_principal_nombre = pdfsMov[0];
            } else if (pdfAzul) {
              // Solo hay azul explícito
              mov.pdf_principal_nombre = pdfAzul;
            } else if (pdfRojo) {
              // Solo hay rojo explícito
              mov.pdf_anexo_nombre = pdfRojo;
            } else if (pdfsMov.length > 0) {
              // Múltiples PDFs sin clasificación clara (formato _doc_ antiguo)
              // Asumir que el primero es azul y el segundo rojo
              mov.pdf_principal_nombre = pdfsMov[0];
              if (pdfsMov.length > 1) {
                mov.pdf_anexo_nombre = pdfsMov[1];
              }
            }
          }
        }
        
        return mov;
      });
    }
    
    if (!resultado) {
      return res.status(404).json({ 
        error: 'Resultado no encontrado',
        mensaje: 'Esta causa aún no ha sido procesada. Ejecuta scraping primero.'
      });
    }

    // Preparar respuesta optimizada para visualización
    const respuesta = {
      rit: req.params.rit,
      cabecera: resultado.cabecera || {},
      estado_actual: resultado.estado_actual || {},
      movimientos: resultado.movimientos || [],
      total_movimientos: resultado.total_movimientos || 0,
      total_pdfs: resultado.total_pdfs || 0,
      fecha_scraping: resultado.fecha_scraping,
      pdfs: resultado.pdfs || {}
    };

    res.json(respuesta);
  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

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
        rit: rit,
        caratulado: c.caratulado || c.causa_nombre,
        competencia: c.competencia,
        tribunal: c.tribunal,
        tipoCausa: c.tipoCausa,
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
    const resultado = obtenerResultado(req.params.rit);
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

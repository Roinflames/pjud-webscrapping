/**
 * API REST de Causas - Endpoints para consultar datos desde la base de datos
 * 
 * Endpoints disponibles:
 *   GET  /api/causas              - Lista todas las causas (con paginación y filtros)
 *   GET  /api/causas/:rit        - Obtiene una causa específica por RIT
 *   GET  /api/causas/:rit/movimientos - Obtiene movimientos de una causa
 *   GET  /api/movimientos        - Lista movimientos (con filtros)
 *   GET  /api/movimientos/:id    - Obtiene un movimiento específico
 *   GET  /api/pdfs               - Lista PDFs (con filtros)
 *   GET  /api/pdfs/:id           - Obtiene un PDF específico
 */

const express = require('express');
const router = express.Router();
const {
  getAllCausas,
  getCausaByRit,
  getCausaCompleta,
  getMovimientosByCausa,
  getPdfsByCausa,
  getPdfsByMovimiento,
  getEbookByCausa,
  query
} = require('../database/db-mariadb');

/**
 * GET /api/causas
 * Lista todas las causas con paginación y filtros
 * 
 * Query params:
 *   - limit: Número de resultados (default: 50, max: 500)
 *   - offset: Offset para paginación (default: 0)
 *   - estado: Filtrar por estado (EN_TRAMITE, TERMINADA)
 *   - tribunal: Filtrar por tribunal
 *   - tiene_movimientos: true/false - Solo causas con movimientos
 *   - tiene_pdfs: true/false - Solo causas con PDFs
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const offset = parseInt(req.query.offset) || 0;
    const estado = req.query.estado;
    const tribunal = req.query.tribunal;
    const tieneMovimientos = req.query.tiene_movimientos === 'true';
    const tienePdfs = req.query.tiene_pdfs === 'true';

    const options = { limit, offset };
    if (estado) options.estado = estado;
    if (tribunal) options.tribunal = tribunal;

    const causas = await getAllCausas(options);

    // Aplicar filtros adicionales
    let causasFiltradas = causas;
    if (tieneMovimientos) {
      causasFiltradas = causasFiltradas.filter(c => (c.total_movimientos || 0) > 0);
    }
    if (tienePdfs) {
      causasFiltradas = causasFiltradas.filter(c => (c.total_pdfs || 0) > 0);
    }

    // Obtener total para paginación
    const totalQuery = await query('SELECT COUNT(*) as total FROM causas');
    const total = totalQuery[0]?.total || 0;

    res.json({
      success: true,
      data: causasFiltradas,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + causasFiltradas.length < total
      }
    });
  } catch (error) {
    console.error('Error obteniendo causas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/causas/:rit
 * Obtiene una causa específica por RIT
 */
router.get('/:rit', async (req, res) => {
  try {
    const { rit } = req.params;
    const causa = await getCausaByRit(rit);

    if (!causa) {
      return res.status(404).json({
        success: false,
        error: 'Causa no encontrada',
        rit
      });
    }

    res.json({
      success: true,
      data: causa
    });
  } catch (error) {
    console.error(`Error obteniendo causa ${req.params.rit}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/causas/:rit/completa
 * Obtiene causa completa con movimientos y PDFs
 */
router.get('/:rit/completa', async (req, res) => {
  try {
    const { rit } = req.params;
    const causaCompleta = await getCausaCompleta(rit);

    if (!causaCompleta) {
      return res.status(404).json({
        success: false,
        error: 'Causa no encontrada',
        rit
      });
    }

    res.json({
      success: true,
      data: causaCompleta
    });
  } catch (error) {
    console.error(`Error obteniendo causa completa ${req.params.rit}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/causas/:rit/movimientos
 * Obtiene movimientos de una causa específica
 * 
 * Query params:
 *   - etapa: Filtrar por etapa
 *   - tiene_pdf: true/false - Solo movimientos con PDF
 *   - limit: Número de resultados (default: 100)
 *   - offset: Offset para paginación
 */
router.get('/:rit/movimientos', async (req, res) => {
  try {
    const { rit } = req.params;
    const causa = await getCausaByRit(rit);

    if (!causa) {
      return res.status(404).json({
        success: false,
        error: 'Causa no encontrada',
        rit
      });
    }

    const options = {};
    if (req.query.etapa) options.etapa_codigo = req.query.etapa;
    if (req.query.tiene_pdf === 'true') options.tiene_pdf = true;
    if (req.query.tiene_pdf === 'false') options.tiene_pdf = false;

    const movimientos = await getMovimientosByCausa(causa.id, options);

    // Aplicar paginación
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const paginados = movimientos.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginados,
      pagination: {
        limit,
        offset,
        total: movimientos.length,
        hasMore: offset + paginados.length < movimientos.length
      },
      causa: {
        rit: causa.rit,
        caratulado: causa.caratulado,
        tribunal: causa.tribunal_nombre
      }
    });
  } catch (error) {
    console.error(`Error obteniendo movimientos de ${req.params.rit}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/causas/:rit/pdfs
 * Obtiene PDFs de una causa específica
 */
router.get('/:rit/pdfs', async (req, res) => {
  try {
    const { rit } = req.params;
    const causa = await getCausaByRit(rit);

    if (!causa) {
      return res.status(404).json({
        success: false,
        error: 'Causa no encontrada',
        rit
      });
    }

    const pdfs = await getPdfsByCausa(causa.id);

    // No enviar base64 completo en el listado, solo metadata
    const pdfsInfo = pdfs.map(p => ({
      id: p.id,
      movimiento_id: p.movimiento_id,
      tipo: p.tipo,
      nombre_archivo: p.nombre_archivo,
      descargado: p.descargado,
      fecha_descarga: p.fecha_descarga,
      tiene_contenido: !!p.base64_content,
      tamano_bytes: p.tamano_base64_bytes
    }));

    res.json({
      success: true,
      data: pdfsInfo,
      total: pdfs.length,
      causa: {
        rit: causa.rit,
        caratulado: causa.caratulado
      }
    });
  } catch (error) {
    console.error(`Error obteniendo PDFs de ${req.params.rit}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/causas/:rit/ebook
 * Obtiene el eBook de una causa
 */
router.get('/:rit/ebook', async (req, res) => {
  try {
    const { rit } = req.params;
    const causa = await getCausaByRit(rit);

    if (!causa) {
      return res.status(404).json({
        success: false,
        error: 'Causa no encontrada',
        rit
      });
    }

    const ebook = await getEbookByCausa(causa.id);

    if (!ebook) {
      return res.status(404).json({
        success: false,
        error: 'eBook no encontrado para esta causa',
        rit
      });
    }

    // No enviar base64 completo, solo metadata
    res.json({
      success: true,
      data: {
        id: ebook.id,
        nombre_archivo: ebook.nombre_archivo,
        fecha_descarga: ebook.fecha_descarga,
        tiene_contenido: !!ebook.base64_content,
        tamano_bytes: ebook.tamano_base64_bytes
      },
      causa: {
        rit: causa.rit,
        caratulado: causa.caratulado
      }
    });
  } catch (error) {
    console.error(`Error obteniendo eBook de ${req.params.rit}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

/**
 * API REST de Movimientos - Endpoints para consultar movimientos desde la base de datos
 * 
 * Endpoints disponibles:
 *   GET  /api/movimientos              - Lista movimientos (con filtros y paginación)
 *   GET  /api/movimientos/:id         - Obtiene un movimiento específico
 *   GET  /api/movimientos/:id/pdfs   - Obtiene PDFs de un movimiento
 */

const express = require('express');
const router = express.Router();
const {
  query,
  getPdfsByMovimiento
} = require('../database/db-mariadb');

/**
 * GET /api/movimientos
 * Lista movimientos con filtros y paginación
 * 
 * Query params:
 *   - limit: Número de resultados (default: 50, max: 500)
 *   - offset: Offset para paginación (default: 0)
 *   - rit: Filtrar por RIT de causa
 *   - etapa: Filtrar por etapa
 *   - tiene_pdf: true/false - Solo movimientos con PDF
 *   - fecha_desde: Fecha desde (YYYY-MM-DD)
 *   - fecha_hasta: Fecha hasta (YYYY-MM-DD)
 *   - cuaderno: Filtrar por id_cuaderno
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const offset = parseInt(req.query.offset) || 0;
    const rit = req.query.rit;
    const etapa = req.query.etapa;
    const tienePdf = req.query.tiene_pdf;
    const fechaDesde = req.query.fecha_desde;
    const fechaHasta = req.query.fecha_hasta;
    const cuaderno = req.query.cuaderno;

    let sql = `
      SELECT m.*, c.rit, c.caratulado, c.tribunal_nombre
      FROM movimientos m
      INNER JOIN causas c ON m.causa_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (rit) {
      sql += ' AND c.rit = ?';
      params.push(rit);
    }

    if (etapa) {
      sql += ' AND m.etapa = ?';
      params.push(etapa);
    }

    if (tienePdf === 'true') {
      sql += ' AND m.tiene_pdf = 1';
    } else if (tienePdf === 'false') {
      sql += ' AND m.tiene_pdf = 0';
    }

    if (fechaDesde) {
      sql += ' AND m.fecha_parsed >= ?';
      params.push(fechaDesde);
    }

    if (fechaHasta) {
      sql += ' AND m.fecha_parsed <= ?';
      params.push(fechaHasta);
    }

    if (cuaderno) {
      sql += ' AND m.id_cuaderno = ?';
      params.push(cuaderno);
    }

    // Contar total (sin LIMIT y OFFSET)
    const countSql = sql.replace(/SELECT m\.\*, c\.rit, c\.caratulado, c\.tribunal_nombre/, 'SELECT COUNT(*) as total').replace(/ORDER BY.*$/, '');
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Aplicar orden y paginación
    sql += ' ORDER BY m.fecha_parsed DESC, m.indice DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const movimientos = await query(sql, params);

    res.json({
      success: true,
      data: movimientos,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + movimientos.length < total
      }
    });
  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/movimientos/:id
 * Obtiene un movimiento específico por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const movimientos = await query(
      `SELECT m.*, c.rit, c.caratulado, c.tribunal_nombre
       FROM movimientos m
       INNER JOIN causas c ON m.causa_id = c.id
       WHERE m.id = ?`,
      [id]
    );

    if (movimientos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento no encontrado',
        id
      });
    }

    res.json({
      success: true,
      data: movimientos[0]
    });
  } catch (error) {
    console.error(`Error obteniendo movimiento ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/movimientos/:id/pdfs
 * Obtiene PDFs de un movimiento específico
 */
router.get('/:id/pdfs', async (req, res) => {
  try {
    const { id } = req.params;
    const pdfs = await getPdfsByMovimiento(parseInt(id));

    // No enviar base64 completo, solo metadata
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
      total: pdfs.length
    });
  } catch (error) {
    console.error(`Error obteniendo PDFs del movimiento ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

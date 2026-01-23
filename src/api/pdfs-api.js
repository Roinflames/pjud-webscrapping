/**
 * API REST de PDFs - Endpoints para consultar PDFs desde la base de datos
 * 
 * Endpoints disponibles:
 *   GET  /api/pdfs              - Lista PDFs (con filtros)
 *   GET  /api/pdfs/:id          - Obtiene un PDF específico (archivo)
 *   GET  /api/pdfs/:id/base64   - Obtiene un PDF en base64
 *   GET  /api/pdfs/:id/metadata - Obtiene metadata de un PDF
 */

const express = require('express');
const router = express.Router();
const {
  query
} = require('../database/db-mariadb');

/**
 * GET /api/pdfs
 * Lista PDFs con filtros
 * 
 * Query params:
 *   - limit: Número de resultados (default: 50, max: 500)
 *   - offset: Offset para paginación
 *   - rit: Filtrar por RIT de causa
 *   - tipo: Filtrar por tipo (PRINCIPAL, ANEXO)
 *   - movimiento_id: Filtrar por movimiento
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const offset = parseInt(req.query.offset) || 0;
    const rit = req.query.rit;
    const tipo = req.query.tipo;
    const movimientoId = req.query.movimiento_id;

    let sql = `
      SELECT p.*, c.rit, c.caratulado, m.folio, m.fecha
      FROM pdfs p
      INNER JOIN movimientos m ON p.movimiento_id = m.id
      INNER JOIN causas c ON m.causa_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (rit) {
      sql += ' AND c.rit = ?';
      params.push(rit);
    }

    if (tipo) {
      sql += ' AND p.tipo = ?';
      params.push(tipo);
    }

    if (movimientoId) {
      sql += ' AND p.movimiento_id = ?';
      params.push(movimientoId);
    }

    // Contar total
    const countSql = sql.replace(/SELECT p\.\*, c\.rit.*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Aplicar orden y paginación
    sql += ' ORDER BY p.fecha_descarga DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const pdfs = await query(sql, params);

    // No enviar base64 completo, solo metadata
    const pdfsInfo = pdfs.map(p => ({
      id: p.id,
      movimiento_id: p.movimiento_id,
      tipo: p.tipo,
      nombre_archivo: p.nombre_archivo,
      descargado: p.descargado,
      fecha_descarga: p.fecha_descarga,
      tiene_contenido: !!p.base64_content,
      tamano_bytes: p.tamano_base64_bytes,
      causa: {
        rit: p.rit,
        caratulado: p.caratulado
      },
      movimiento: {
        folio: p.folio,
        fecha: p.fecha
      }
    }));

    res.json({
      success: true,
      data: pdfsInfo,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + pdfsInfo.length < total
      }
    });
  } catch (error) {
    console.error('Error obteniendo PDFs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/pdfs/:id/metadata
 * Obtiene metadata de un PDF (sin base64)
 */
router.get('/:id/metadata', async (req, res) => {
  try {
    const { id } = req.params;
    const pdfs = await query(
      `SELECT p.*, c.rit, c.caratulado, m.folio, m.fecha
       FROM pdfs p
       INNER JOIN movimientos m ON p.movimiento_id = m.id
       INNER JOIN causas c ON m.causa_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (pdfs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PDF no encontrado',
        id
      });
    }

    const pdf = pdfs[0];
    res.json({
      success: true,
      data: {
        id: pdf.id,
        movimiento_id: pdf.movimiento_id,
        tipo: pdf.tipo,
        nombre_archivo: pdf.nombre_archivo,
        descargado: pdf.descargado,
        fecha_descarga: pdf.fecha_descarga,
        tiene_contenido: !!pdf.base64_content,
        tamano_bytes: pdf.tamano_base64_bytes,
        causa: {
          rit: pdf.rit,
          caratulado: pdf.caratulado
        },
        movimiento: {
          folio: pdf.folio,
          fecha: pdf.fecha
        }
      }
    });
  } catch (error) {
    console.error(`Error obteniendo metadata del PDF ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

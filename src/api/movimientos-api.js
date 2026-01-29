/**
 * API para la gestión de movimientos procesales desde la base de datos
 */
const express = require('express');
const router = express.Router();
const db = require('../database/db-mariadb');

/**
 * GET /api/movimientos
 * Obtiene una lista de movimientos desde la base de datos.
 * Soporta paginación con 'limit' y 'page'.
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const movimientos = await db.getAllMovimientos({ limit, offset });

    res.json({
      success: true,
      data: movimientos,
      pagination: {
        page,
        limit,
        total: movimientos.length
      }
    });
  } catch (error) {
    console.error('Error en GET /api/movimientos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener movimientos.'
    });
  }
});

/**
 * GET /api/movimientos/causa/:causa_id
 * Obtiene todos los movimientos de una causa específica
 */
router.get('/causa/:causa_id', async (req, res) => {
  try {
    const causa_id = parseInt(req.params.causa_id);
    if (isNaN(causa_id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de causa inválido'
      });
    }

    const movimientos = await db.getMovimientosByCausa(causa_id);

    res.json({
      success: true,
      data: movimientos,
      causa_id: causa_id,
      total: movimientos.length
    });
  } catch (error) {
    console.error('Error en GET /api/movimientos/causa/:causa_id:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor.'
    });
  }
});

/**
 * GET /api/movimientos/:id
 * Obtiene un movimiento específico por su ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const rows = await db.query('SELECT * FROM movimientos WHERE id = ?', [id]);
    const movimiento = rows[0];

    if (!movimiento) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento no encontrado'
      });
    }

    res.json({
      success: true,
      data: movimiento
    });
  } catch (error) {
    console.error('Error en GET /api/movimientos/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor.'
    });
  }
});

module.exports = router;

/**
 * API para la gestión de causas desde la base de datos
 */
const express = require('express');
const router = express.Router();
const db = require('../database/db-mariadb');

/**
 * GET /api/causas
 * Obtiene una lista de causas desde la base de datos.
 * Soporta paginación con 'limit' y 'page'.
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const causas = await db.getAllCausas({ limit, offset });
    
    // Simplificar el resultado para la demo
    const resultado = causas.map(c => ({
      rit: c.rit,
      caratulado: c.caratulado,
      tribunal: c.tribunal_nombre,
      estado: c.estado_descripcion || 'No disponible'
    }));

    res.json({
      success: true,
      data: resultado,
      pagination: {
        page,
        limit,
        total: causas.length // Esto no es el total real, lo ajustaremos después
      }
    });
  } catch (error) {
    console.error('Error en GET /api/causas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor al obtener causas.' });
  }
});

/**
 * GET /api/causas/:id
 * Obtiene una causa por su ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const causa = await db.getCausaById(id);

    if (!causa) {
      return res.status(404).json({ success: false, error: 'Causa no encontrada' });
    }

    res.json({
      success: true,
      data: causa
    });
  } catch (error) {
    console.error('Error en GET /api/causas/:id:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
});

/**
 * GET /api/causas/rit/:rit
 * Obtiene una causa por su RIT
 */
router.get('/rit/:rit', async (req, res) => {
  try {
    const rit = req.params.rit;

    const causa = await db.getCausaByRit(rit);

    if (!causa) {
      return res.status(404).json({ success: false, error: 'Causa no encontrada con ese RIT' });
    }

    // Obtener también los movimientos de esta causa
    const movimientos = await db.getMovimientosByCausa(causa.id);

    res.json({
      success: true,
      data: {
        ...causa,
        movimientos: movimientos
      }
    });
  } catch (error) {
    console.error('Error en GET /api/causas/rit/:rit:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
});

module.exports = router;

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

module.exports = router;

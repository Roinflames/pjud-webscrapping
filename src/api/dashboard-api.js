/**
 * API de Dashboard - Estadísticas y métricas para abogados
 */

const express = require('express');
const router = express.Router();
const { 
  getEstadisticasAbogados, 
  getCausasConMovimientosNuevos,
  detectarMovimientosNuevos,
  getAllCausas,
  getCausaByRit
} = require('../database/db-mariadb');
const { enviarNotificacionMovimientos } = require('../utils/email');

/**
 * GET /api/dashboard/estadisticas
 * Obtiene estadísticas relevantes para abogados
 */
router.get('/estadisticas', async (req, res) => {
  try {
    const stats = await getEstadisticasAbogados();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/dashboard/movimientos-nuevos
 * Obtiene causas con movimientos nuevos
 */
router.get('/movimientos-nuevos', async (req, res) => {
  try {
    const causas = await getCausasConMovimientosNuevos();
    res.json({ success: true, data: causas, total: causas.length });
  } catch (error) {
    console.error('Error obteniendo movimientos nuevos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/dashboard/causas
 * Lista todas las causas con información básica
 */
router.get('/causas', async (req, res) => {
  try {
    const { limit = 100, offset = 0, estado, tribunal } = req.query;
    const options = { limit: parseInt(limit), offset: parseInt(offset) };
    if (estado) options.estado = estado;
    if (tribunal) options.tribunal = tribunal;

    const causas = await getAllCausas(options);
    res.json({ success: true, data: causas, total: causas.length });
  } catch (error) {
    console.error('Error obteniendo causas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/dashboard/verificar-movimientos/:rit
 * Verifica movimientos nuevos en una causa específica y envía email si los hay
 */
router.post('/verificar-movimientos/:rit', async (req, res) => {
  try {
    const { rit } = req.params;
    const { email_cliente, nombre_cliente } = req.body;

    const deteccion = await detectarMovimientosNuevos(rit);
    
    if (!deteccion.tieneNuevos) {
      return res.json({ 
        success: true, 
        tieneNuevos: false, 
        message: 'No hay movimientos nuevos' 
      });
    }

    const causa = await getCausaByRit(rit);
    
    // Si hay email, enviar notificación
    let emailEnviado = false;
    if (email_cliente) {
      const resultadoEmail = await enviarNotificacionMovimientos(
        causa,
        deteccion.movimientos,
        email_cliente,
        nombre_cliente || 'Cliente'
      );
      emailEnviado = resultadoEmail.enviado;
    }

    res.json({
      success: true,
      tieneNuevos: true,
      totalNuevos: deteccion.movimientos.length,
      movimientos: deteccion.movimientos,
      emailEnviado
    });
  } catch (error) {
    console.error('Error verificando movimientos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/dashboard/verificar-todas
 * Verifica todas las causas y envía emails de movimientos nuevos
 */
router.post('/verificar-todas', async (req, res) => {
  try {
    const causasConNuevos = await getCausasConMovimientosNuevos();
    const resultados = [];

    for (const item of causasConNuevos) {
      // Aquí deberías obtener el email del cliente desde la BD
      // Por ahora, solo registramos que hay movimientos nuevos
      resultados.push({
        rit: item.causa.rit,
        caratulado: item.causa.caratulado,
        totalNuevos: item.totalNuevos,
        emailEnviado: false, // Se enviará cuando tengas los emails en BD
        nota: 'Email no configurado en BD'
      });
    }

    res.json({
      success: true,
      totalCausasConNuevos: causasConNuevos.length,
      resultados
    });
  } catch (error) {
    console.error('Error verificando todas las causas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

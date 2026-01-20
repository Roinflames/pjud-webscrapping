/**
 * API ERP - Endpoints para comunicación con ERP mediante eventos
 * 
 * Permite al ERP:
 * - Crear eventos de scraping específico
 * - Consultar estado de eventos
 * - Listar eventos por filtros
 * - Obtener resultados del scraping completado
 * 
 * FLUJO:
 * 1. ERP inserta contrato → Trigger o Listener detecta
 * 2. Se crea evento en pjud_eventos_scraping
 * 3. Worker-eventos procesa el scraping
 * 4. ERP consulta resultados vía API
 */

const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codi_ejamtest',
  port: process.env.DB_PORT || 3306
};

/**
 * Conectar a la base de datos
 */
async function getConnection() {
  return await mysql.createConnection(DB_CONFIG);
}

/**
 * POST /api/erp/eventos/crear
 * Crear evento de scraping específico
 */
router.post('/eventos/crear', async (req, res) => {
  const connection = await getConnection();
  
  try {
    const {
      rit,
      competencia_id,
      corte_id,
      tribunal_id,
      tipo_causa,
      abogado_id,
      causa_id,
      agenda_id,
      prioridad,
      erp_origen,
      erp_usuario_id,
      metadata
    } = req.body;

    // Validar RIT
    if (!rit || !rit.trim()) {
      return res.status(400).json({
        success: false,
        error: 'RIT es requerido'
      });
    }

    // Validar datos PJUD
    const { validarParaScraping } = require('../utils/validacion-pjud');
    const validacion = validarParaScraping({
      rit,
      competencia: competencia_id,
      corte: corte_id,
      tribunal: tribunal_id,
      tipoCausa: tipo_causa,
      causa_id
    });

    if (!validacion.puedeProcesar) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos para scraping',
        motivo: validacion.motivo,
        errores: validacion.errores
      });
    }

    // Crear evento usando procedimiento almacenado
    const [result] = await connection.query(`
      CALL sp_crear_evento_scraping(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      validacion.config.rit,
      parseInt(validacion.config.competencia) || null,
      parseInt(validacion.config.corte) || null,
      parseInt(validacion.config.tribunal) || null,
      validacion.config.tipoCausa,
      abogado_id ? parseInt(abogado_id) : null,
      causa_id ? parseInt(causa_id) : null,
      agenda_id ? parseInt(agenda_id) : null,
      erp_origen || 'ERP',
      erp_usuario_id ? parseInt(erp_usuario_id) : null,
      prioridad || 5,
      metadata ? JSON.stringify(metadata) : null
    ]);

    const eventoId = result[0][0].evento_id;

    res.json({
      success: true,
      mensaje: 'Evento de scraping creado exitosamente',
      evento_id: eventoId,
      rit: validacion.config.rit,
      estado: 'PENDIENTE'
    });

  } catch (error) {
    console.error('Error creando evento:', error);
    
    // Si el procedimiento no existe, crear evento directamente
    if (error.code === 'ER_SP_DOES_NOT_EXIST' || error.message.includes('sp_crear_evento_scraping')) {
      try {
        await crearEventoDirecto(connection, req.body);
        res.json({
          success: true,
          mensaje: 'Evento creado (fallback)',
          evento_id: 'N/A'
        });
      } catch (fallbackError) {
        res.status(500).json({
          success: false,
          error: 'Error creando evento',
          mensaje: fallbackError.message
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'Error creando evento',
        mensaje: error.message
      });
    }
  } finally {
    await connection.end();
  }
});

/**
 * Función fallback para crear evento directamente
 */
async function crearEventoDirecto(connection, datos) {
  const {
    rit,
    competencia_id,
    corte_id,
    tribunal_id,
    tipo_causa = 'C',
    abogado_id,
    causa_id,
    agenda_id,
    prioridad = 5,
    erp_origen = 'ERP',
    erp_usuario_id,
    metadata
  } = datos;

  await connection.query(`
    INSERT INTO pjud_eventos_scraping (
      evento_tipo,
      rit,
      competencia_id,
      corte_id,
      tribunal_id,
      tipo_causa,
      abogado_id,
      causa_id,
      agenda_id,
      prioridad,
      erp_origen,
      erp_usuario_id,
      erp_metadata,
      estado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')
  `, [
    'SCRAPING_ESPECIFICO',
    rit,
    competencia_id || null,
    corte_id || null,
    tribunal_id || null,
    tipo_causa,
    abogado_id || null,
    causa_id || null,
    agenda_id || null,
    prioridad,
    erp_origen,
    erp_usuario_id || null,
    metadata ? JSON.stringify(metadata) : null
  ]);
}

/**
 * GET /api/erp/eventos/:id
 * Obtener estado de un evento específico
 */
router.get('/eventos/:id', async (req, res) => {
  const connection = await getConnection();
  
  try {
    const [rows] = await connection.query(`
      SELECT * FROM pjud_eventos_scraping WHERE id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    const evento = rows[0];
    
    // Parsear JSON si existe
    if (evento.erp_metadata) {
      try {
        evento.erp_metadata = JSON.parse(evento.erp_metadata);
      } catch (e) {
        // Mantener como string si no es JSON válido
      }
    }

    if (evento.resultado_data) {
      try {
        evento.resultado_data = JSON.parse(evento.resultado_data);
      } catch (e) {
        // Mantener como string si no es JSON válido
      }
    }

    // Si el evento está completado, incluir datos completos del scraping
    let resultadoCompleto = null;
    if (evento.estado === 'COMPLETADO' && evento.resultado_rit) {
      const { obtenerResultado } = require('./storage');
      const resultado = obtenerResultado(evento.resultado_rit);
      if (resultado) {
        resultadoCompleto = {
          rit: resultado.rit,
          fecha_scraping: resultado.fecha_scraping,
          movimientos: resultado.movimientos,
          cabecera: resultado.cabecera,
          estado_actual: resultado.estado_actual,
          total_movimientos: resultado.total_movimientos || (resultado.movimientos ? resultado.movimientos.length : 0),
          total_pdfs: resultado.total_pdfs || 0,
          pdfs_disponibles: evento.resultado_pdfs || 0
        };
      }
    }

    res.json({
      success: true,
      evento,
      resultado: resultadoCompleto
    });

  } catch (error) {
    console.error('Error obteniendo evento:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo evento',
      mensaje: error.message
    });
  } finally {
    await connection.end();
  }
});

/**
 * GET /api/erp/eventos/resultado/:rit
 * Obtener resultados completos del scraping por RIT
 */
router.get('/eventos/resultado/:rit', async (req, res) => {
  try {
    const { rit } = req.params;
    const { obtenerResultado } = require('./storage');
    
    const resultado = obtenerResultado(rit);
    
    if (!resultado) {
      // Buscar si hay un evento completado para este RIT
      const connection = await getConnection();
      try {
        const [eventos] = await connection.query(`
          SELECT * FROM pjud_eventos_scraping 
          WHERE rit = ? AND estado = 'COMPLETADO'
          ORDER BY fecha_completado DESC
          LIMIT 1
        `, [rit]);

        if (eventos.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Resultado no encontrado',
            mensaje: `No se encontró resultado para el RIT: ${rit}. El scraping aún puede estar en proceso.`
          });
        }

        const evento = eventos[0];
        if (evento.resultado_data) {
          try {
            const resultadoData = JSON.parse(evento.resultado_data);
            return res.json({
              success: true,
              resultado: resultadoData,
              evento_id: evento.id,
              fecha_completado: evento.fecha_completado
            });
          } catch (e) {
            // Continuar para buscar en archivos
          }
        }
      } finally {
        await connection.end();
      }

      return res.status(404).json({
        success: false,
        error: 'Resultado no encontrado',
        mensaje: `No se encontró resultado para el RIT: ${rit}`
      });
    }

    res.json({
      success: true,
      resultado
    });
  } catch (error) {
    console.error('Error obteniendo resultado:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo resultado',
      mensaje: error.message
    });
  }
});

/**
 * GET /api/erp/eventos/resultado/:rit
 * Obtener resultados completos del scraping por RIT
 */
router.get('/eventos/resultado/:rit', async (req, res) => {
  try {
    const { rit } = req.params;
    const { obtenerResultado } = require('./storage');
    
    const resultado = obtenerResultado(rit);
    
    if (!resultado) {
      // Buscar si hay un evento completado para este RIT
      const connection = await getConnection();
      try {
        const [eventos] = await connection.query(`
          SELECT * FROM pjud_eventos_scraping 
          WHERE rit = ? AND estado = 'COMPLETADO'
          ORDER BY fecha_completado DESC
          LIMIT 1
        `, [rit]);

        if (eventos.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Resultado no encontrado',
            mensaje: `No se encontró resultado para el RIT: ${rit}. El scraping aún puede estar en proceso.`
          });
        }

        const evento = eventos[0];
        if (evento.resultado_data) {
          try {
            const resultadoData = JSON.parse(evento.resultado_data);
            return res.json({
              success: true,
              resultado: resultadoData,
              evento_id: evento.id,
              fecha_completado: evento.fecha_completado
            });
          } catch (e) {
            // Continuar para buscar en archivos
          }
        }
      } finally {
        await connection.end();
      }

      return res.status(404).json({
        success: false,
        error: 'Resultado no encontrado',
        mensaje: `No se encontró resultado para el RIT: ${rit}`
      });
    }

    res.json({
      success: true,
      resultado
    });
  } catch (error) {
    console.error('Error obteniendo resultado:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo resultado',
      mensaje: error.message
    });
  }
});

/**
 * GET /api/erp/eventos
 * Listar eventos con filtros
 */
router.get('/eventos', async (req, res) => {
  const connection = await getConnection();
  
  try {
    const {
      estado,
      rit,
      abogado_id,
      erp_origen,
      limite = 100,
      offset = 0
    } = req.query;

    let query = 'SELECT * FROM pjud_eventos_scraping WHERE 1=1';
    const params = [];

    if (estado) {
      query += ' AND estado = ?';
      params.push(estado);
    }

    if (rit) {
      query += ' AND rit LIKE ?';
      params.push(`%${rit}%`);
    }

    if (abogado_id) {
      query += ' AND abogado_id = ?';
      params.push(parseInt(abogado_id));
    }

    if (erp_origen) {
      query += ' AND erp_origen = ?';
      params.push(erp_origen);
    }

    query += ' ORDER BY prioridad DESC, fecha_creacion DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limite), parseInt(offset));

    const [rows] = await connection.query(query, params);

    // Contar total
    let countQuery = 'SELECT COUNT(*) as total FROM pjud_eventos_scraping WHERE 1=1';
    const countParams = [];
    
    if (estado) {
      countQuery += ' AND estado = ?';
      countParams.push(estado);
    }
    if (rit) {
      countQuery += ' AND rit LIKE ?';
      countParams.push(`%${rit}%`);
    }
    if (abogado_id) {
      countQuery += ' AND abogado_id = ?';
      countParams.push(parseInt(abogado_id));
    }
    if (erp_origen) {
      countQuery += ' AND erp_origen = ?';
      countParams.push(erp_origen);
    }

    const [countResult] = await connection.query(countQuery, countParams);
    const total = countResult[0].total;

    // Parsear JSONs
    const eventos = rows.map(evento => {
      if (evento.erp_metadata) {
        try {
          evento.erp_metadata = JSON.parse(evento.erp_metadata);
        } catch (e) {}
      }
      if (evento.resultado_data) {
        try {
          evento.resultado_data = JSON.parse(evento.resultado_data);
        } catch (e) {}
      }
      return evento;
    });

    res.json({
      success: true,
      total,
      cantidad: eventos.length,
      offset: parseInt(offset),
      eventos
    });

  } catch (error) {
    console.error('Error listando eventos:', error);
    res.status(500).json({
      success: false,
      error: 'Error listando eventos',
      mensaje: error.message
    });
  } finally {
    await connection.end();
  }
});

module.exports = router;

/**
 * LISTENER ERP - Detecta nuevos contratos en la base de datos del ERP
 * 
 * Este listener se conecta a la base de datos del ERP y detecta cuando
 * se insertan nuevos contratos (contrato_id nuevo). Cuando detecta uno,
 * extrae los datos necesarios y crea un evento de scraping en nuestra BD.
 * 
 * Uso:
 *   node src/api/listener-erp.js
 *   node src/api/listener-erp.js --table contratos --interval 5000
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const { agregarACola } = require('../agregar_a_cola');
const { validarParaScraping } = require('../utils/validacion-pjud');

// Configuración de la base de datos del ERP
const ERP_DB_CONFIG = {
  host: process.env.ERP_DB_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.ERP_DB_USER || process.env.DB_USER || 'root',
  password: process.env.ERP_DB_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.ERP_DB_NAME || 'erp_database',
  port: parseInt(process.env.ERP_DB_PORT || process.env.DB_PORT || '3306')
};

// Configuración de nuestra base de datos (para eventos)
const PJUD_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codi_ejamtest',
  port: parseInt(process.env.DB_PORT || '3306')
};

// Configuración del listener
const CHECK_INTERVAL = process.argv.includes('--interval')
  ? parseInt(process.argv[process.argv.indexOf('--interval') + 1]) || 10000
  : 10000; // 10 segundos por defecto

const TABLA_CONTRATOS = process.argv.includes('--table')
  ? process.argv[process.argv.indexOf('--table') + 1] || 'contrato'
  : 'contrato'; // Tabla por defecto: contrato

const CAMPO_FECHA = process.argv.includes('--date-field')
  ? process.argv[process.argv.indexOf('--date-field') + 1]
  : 'created_at'; // Campo de fecha por defecto

let isRunning = true;
let ultimaVerificacion = null;
let contratosProcesados = new Set(); // Para evitar duplicados

/**
 * Conectar a la base de datos del ERP
 */
async function getERPConnection() {
  return await mysql.createConnection(ERP_DB_CONFIG);
}

/**
 * Conectar a nuestra base de datos
 */
async function getPJUDConnection() {
  return await mysql.createConnection(PJUD_DB_CONFIG);
}

/**
 * Detectar campos de fecha disponibles en la tabla
 */
async function detectarCampoFecha(connection, tableName) {
  try {
    const [fields] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = ? 
        AND COLUMN_NAME IN ('created_at', 'updated_at', 'fecha_creacion', 'fecha_insert', 'inserted_at')
      ORDER BY 
        CASE COLUMN_NAME
          WHEN 'created_at' THEN 1
          WHEN 'updated_at' THEN 2
          WHEN 'fecha_creacion' THEN 3
          WHEN 'fecha_insert' THEN 4
          WHEN 'inserted_at' THEN 5
        END
      LIMIT 1
    `, [ERP_DB_CONFIG.database, tableName]);
    
    if (fields.length > 0) {
      return fields[0].COLUMN_NAME;
    }
    
    // Si no hay campo de fecha, usar id (menos eficiente)
    return 'id';
  } catch (error) {
    console.error('Error detectando campo de fecha:', error.message);
    return 'id'; // Fallback
  }
}

/**
 * Extraer RIT desde el registro del contrato
 */
function extraerRIT(registro) {
  // Intentar diferentes campos posibles
  if (registro.id_causa) {
    return registro.id_causa;
  }
  if (registro.rit) {
    return registro.rit;
  }
  if (registro.rol && registro.anio) {
    return `${registro.rol}-${registro.anio}`;
  }
  if (registro.rol && registro.ano) {
    return `${registro.rol}-${registro.ano}`;
  }
  // Si viene con contrato_id, puede que necesitemos buscar en otra tabla
  return null;
}

/**
 * Obtener configuración PJUD desde el registro del contrato
 */
async function obtenerConfiguracion(erpConnection, registro) {
  // Valores por defecto
  let competenciaId = 3; // Civil por defecto
  let corteId = 90; // C.A. de Santiago por defecto
  let tribunalId = null;
  let tipoCausa = 'C'; // Civil por defecto
  let abogadoId = null;
  let causaId = registro.causa_id || registro.id_causa || null;

  // Intentar obtener tribunal_id si existe
  if (registro.tribunal_id) {
    tribunalId = registro.tribunal_id;
  } else if (registro.juzgado_id) {
    tribunalId = registro.juzgado_id;
  }

  // Intentar obtener competencia_id
  if (registro.competencia_id) {
    competenciaId = registro.competencia_id;
  } else if (registro.materia_estrategia_id) {
    competenciaId = registro.materia_estrategia_id;
  }

  // Intentar obtener corte_id
  if (registro.corte_id) {
    corteId = registro.corte_id;
  }

  // Intentar obtener tipo de causa
  if (registro.tipo_causa) {
    tipoCausa = registro.tipo_causa;
  } else if (registro.letra) {
    tipoCausa = registro.letra;
  }

  // Intentar obtener abogado_id
  if (registro.abogado_id) {
    abogadoId = registro.abogado_id;
  } else if (registro.usuario_id) {
    abogadoId = registro.usuario_id;
  }

  // Si tenemos contrato_id, buscar datos relacionados en otras tablas
  if (registro.contrato_id || registro.id) {
    try {
      const contratoId = registro.contrato_id || registro.id;
      
      // Buscar en tabla causa si existe relación
      if (causaId) {
        try {
          const [causaRows] = await erpConnection.query(
            'SELECT * FROM causa WHERE id = ? LIMIT 1',
            [causaId]
          );
          
          if (causaRows.length > 0) {
            const causa = causaRows[0];
            tribunalId = tribunalId || causa.tribunal_id || causa.juzgado_id;
            competenciaId = competenciaId || causa.competencia_id || causa.materia_estrategia_id;
            tipoCausa = tipoCausa || causa.tipo_causa || causa.letra || 'C';
            abogadoId = abogadoId || causa.abogado_id || causa.usuario_id;
          }
        } catch (e) {
          console.warn(`No se pudo buscar en tabla causa: ${e.message}`);
        }
      }
    } catch (e) {
      console.warn(`Error buscando datos relacionados: ${e.message}`);
    }
  }

  return {
    competenciaId,
    corteId,
    tribunalId,
    tipoCausa,
    abogadoId,
    causaId
  };
}

/**
 * Crear evento de scraping en nuestra base de datos
 */
async function crearEventoScraping(pjudConnection, rit, config, contratoId, metadata) {
  try {
    // Validar datos antes de crear evento
    const validacion = validarParaScraping({
      rit,
      competencia: config.competenciaId,
      corte: config.corteId,
      tribunal: config.tribunalId,
      tipoCausa: config.tipoCausa,
      causa_id: config.causaId
    });

    if (!validacion.puedeProcesar) {
      console.warn(`⚠️  Contrato ${contratoId}: Datos incompletos para scraping. Motivo: ${validacion.motivo}`);
      console.warn(`   Errores: ${JSON.stringify(validacion.errores)}`);
      return null;
    }

    // Verificar si ya existe un evento pendiente para este RIT
    const [existentes] = await pjudConnection.query(`
      SELECT id FROM pjud_eventos_scraping
      WHERE rit = ? AND estado IN ('PENDIENTE', 'PROCESANDO')
      LIMIT 1
    `, [validacion.config.rit]);

    if (existentes.length > 0) {
      console.log(`ℹ️  Ya existe evento pendiente para RIT: ${validacion.config.rit}`);
      return existentes[0].id;
    }

    // Crear evento usando procedimiento almacenado o INSERT directo
    try {
      const [result] = await pjudConnection.query(`
        CALL sp_crear_evento_scraping(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        validacion.config.rit,
        parseInt(validacion.config.competencia) || null,
        parseInt(validacion.config.corte) || null,
        parseInt(validacion.config.tribunal) || null,
        validacion.config.tipoCausa,
        config.abogadoId ? parseInt(config.abogadoId) : null,
        config.causaId ? parseInt(config.causaId) : null,
        null, // agenda_id
        'ERP', // erp_origen
        null, // erp_usuario_id
        5, // prioridad por defecto
        JSON.stringify({ ...metadata, contrato_id: contratoId }) // metadata
      ]);

      const eventoId = result[0]?.[0]?.evento_id || result.insertId || null;
      
      if (eventoId) {
        console.log(`✅ Evento creado para RIT ${validacion.config.rit} (Evento ID: ${eventoId}, Contrato ID: ${contratoId})`);
        return eventoId;
      }
    } catch (spError) {
      // Si el procedimiento no existe, usar INSERT directo
      console.warn(`Procedimiento no disponible, usando INSERT directo: ${spError.message}`);
      
      const [result] = await pjudConnection.query(`
        INSERT INTO pjud_eventos_scraping (
          evento_tipo, rit, competencia_id, corte_id, tribunal_id, tipo_causa,
          abogado_id, causa_id, prioridad, erp_origen, erp_metadata, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')
      `, [
        'SCRAPING_ESPECIFICO',
        validacion.config.rit,
        parseInt(validacion.config.competencia) || null,
        parseInt(validacion.config.corte) || null,
        parseInt(validacion.config.tribunal) || null,
        validacion.config.tipoCausa,
        config.abogadoId ? parseInt(config.abogadoId) : null,
        config.causaId ? parseInt(config.causaId) : null,
        5, // prioridad
        'ERP',
        JSON.stringify({ ...metadata, contrato_id: contratoId })
      ]);

      console.log(`✅ Evento creado para RIT ${validacion.config.rit} (Evento ID: ${result.insertId}, Contrato ID: ${contratoId})`);
      return result.insertId;
    }

    return null;
  } catch (error) {
    console.error(`❌ Error creando evento de scraping:`, error.message);
    return null;
  }
}

/**
 * Verificar nuevos contratos en la base de datos del ERP
 */
async function verificarNuevosContratos() {
  const erpConnection = await getERPConnection();
  const pjudConnection = await getPJUDConnection();
  
  try {
    // Detectar campo de fecha disponible
    const campoFecha = await detectarCampoFecha(erpConnection, TABLA_CONTRATOS);
    
    if (ultimaVerificacion === null) {
      // Primera verificación: obtener último registro
      const [ultimos] = await erpConnection.query(`
        SELECT ${campoFecha} FROM ${TABLA_CONTRATOS}
        ORDER BY ${campoFecha} DESC
        LIMIT 1
      `);
      
      if (ultimos.length > 0) {
        ultimaVerificacion = ultimos[0][campoFecha];
        console.log(`📅 Inicializando listener con fecha: ${ultimaVerificacion}`);
      }
      return;
    }

    // Buscar contratos nuevos
    let query;
    let params = [];

    if (campoFecha === 'id') {
      // Si no hay campo de fecha, usar id (menos eficiente)
      query = `
        SELECT * FROM ${TABLA_CONTRATOS}
        WHERE id > ?
        ORDER BY id ASC
        LIMIT 100
      `;
      params = [ultimaVerificacion || 0];
    } else {
      query = `
        SELECT * FROM ${TABLA_CONTRATOS}
        WHERE ${campoFecha} > ?
        ORDER BY ${campoFecha} ASC
        LIMIT 100
      `;
      params = [ultimaVerificacion];
    }

    const [nuevosContratos] = await erpConnection.query(query, params);

    if (nuevosContratos.length === 0) {
      return; // No hay nuevos contratos
    }

    console.log(`🔍 Detectados ${nuevosContratos.length} nuevo(s) contrato(s)`);

    for (const contrato of nuevosContratos) {
      const contratoId = contrato.contrato_id || contrato.id;
      
      // Evitar procesar duplicados
      if (contratosProcesados.has(contratoId)) {
        continue;
      }

      console.log(`\n📋 Procesando contrato ID: ${contratoId}`);

      // Extraer RIT
      const rit = extraerRIT(contrato);
      
      if (!rit) {
        console.warn(`   ⚠️  No se pudo extraer RIT del contrato ${contratoId}`);
        console.warn(`   Campos disponibles: ${Object.keys(contrato).join(', ')}`);
        contratosProcesados.add(contratoId);
        continue;
      }

      console.log(`   📌 RIT detectado: ${rit}`);

      // Obtener configuración PJUD
      const config = await obtenerConfiguracion(erpConnection, contrato);
      
      console.log(`   ⚙️  Configuración:`, {
        competencia: config.competenciaId,
        corte: config.corteId,
        tribunal: config.tribunalId,
        tipoCausa: config.tipoCausa
      });

      // Crear evento de scraping
      const eventoId = await crearEventoScraping(
        pjudConnection,
        rit,
        config,
        contratoId,
        { fecha_deteccion: new Date().toISOString(), origen: 'LISTENER_ERP' }
      );

      if (eventoId) {
        contratosProcesados.add(contratoId);
        
        // Actualizar última verificación
        const fechaContrato = contrato[campoFecha];
        if (fechaContrato && (!ultimaVerificacion || fechaContrato > ultimaVerificacion)) {
          ultimaVerificacion = fechaContrato;
        }
      }
    }

  } catch (error) {
    console.error('❌ Error verificando nuevos contratos:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error(`   Tabla '${TABLA_CONTRATOS}' no existe en la base de datos del ERP`);
      console.error(`   Verifica ERP_DB_NAME y TABLA_CONTRATOS en la configuración`);
    }
  } finally {
    await erpConnection.end();
    await pjudConnection.end();
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando Listener ERP...');
  console.log('   - Base de datos ERP:', ERP_DB_CONFIG.host, '->', ERP_DB_CONFIG.database);
  console.log('   - Tabla monitoreada:', TABLA_CONTRATOS);
  console.log('   - Intervalo:', CHECK_INTERVAL, 'ms');
  console.log('   - Base de datos PJUD:', PJUD_DB_CONFIG.database);

  // Verificar conexión al ERP
  try {
    const testConnection = await getERPConnection();
    await testConnection.query('SELECT 1');
    await testConnection.end();
    console.log('✅ Conexión al ERP establecida');
  } catch (error) {
    console.error('❌ No se pudo conectar al ERP:', error.message);
    console.error('   Verifica las variables ERP_DB_* en tu archivo .env');
    process.exit(1);
  }

  // Verificar conexión a nuestra BD
  try {
    const testConnection = await getPJUDConnection();
    await testConnection.query('SELECT 1');
    await testConnection.end();
    console.log('✅ Conexión a BD PJUD establecida');
  } catch (error) {
    console.error('❌ No se pudo conectar a BD PJUD:', error.message);
    process.exit(1);
  }

  // Ciclo principal
  const ciclo = async () => {
    if (isRunning) {
      await verificarNuevosContratos();
      setTimeout(ciclo, CHECK_INTERVAL);
    }
  };

  // Manejar señales de terminación
  process.on('SIGINT', () => {
    console.log('\n🛑 Deteniendo Listener ERP...');
    isRunning = false;
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Deteniendo Listener ERP...');
    isRunning = false;
    process.exit(0);
  });

  // Iniciar ciclo
  await ciclo();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { main, verificarNuevosContratos };

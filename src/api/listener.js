/**
 * LISTENER DE BASE DE DATOS - Detección Automática de Nuevos Contratos
 * 
 * Este script escucha cambios en la base de datos para detectar cuando
 * se insertan nuevos contratos/causas y automáticamente inicia el flujo
 * de scraping agregándolos a la cola.
 * 
 * Uso:
 *   node src/api/listener.js
 *   node src/api/listener.js --table causa --interval 5000
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const { agregarACola } = require('../agregar_a_cola');
const { validarParaScraping } = require('../utils/validacion-pjud');

// Configuración de la base de datos
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codi_ejamtest',
  port: process.env.DB_PORT || 3306
};

// Configuración del listener
const CHECK_INTERVAL = process.argv.includes('--interval')
  ? parseInt(process.argv[process.argv.indexOf('--interval') + 1]) || 10000
  : 10000; // 10 segundos por defecto

const TABLA_MONITOREAR = process.argv.includes('--table')
  ? process.argv[process.argv.indexOf('--table') + 1] || 'causa'
  : 'causa'; // Tabla por defecto: causa

const CAMPO_FECHA = process.argv.includes('--date-field')
  ? process.argv[process.argv.indexOf('--date-field') + 1]
  : 'created_at'; // Campo de fecha por defecto

let isRunning = true;
let ultimaVerificacion = null;
let registrosProcesados = new Set(); // Para evitar duplicados

/**
 * Conectar a la base de datos
 */
async function getConnection() {
  return await mysql.createConnection(DB_CONFIG);
}

/**
 * Obtener RIT desde diferentes posibles campos de la tabla causa
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
  return null;
}

/**
 * Obtener datos de configuración desde el registro o buscar en tablas relacionadas
 */
async function obtenerConfiguracion(connection, registro) {
  // Valores por defecto
  let competenciaId = 3; // Civil por defecto
  let corteId = 90; // C.A. de Santiago por defecto
  let tribunalId = null;
  let tipoCausa = 'C'; // Civil por defecto

  // Intentar obtener tribunal_id si existe el campo
  if (registro.tribunal_id) {
    tribunalId = registro.tribunal_id;
  } else if (registro.juzgado_id) {
    tribunalId = registro.juzgado_id;
  }

  // Intentar obtener competencia_id si existe
  if (registro.competencia_id) {
    competenciaId = registro.competencia_id;
  } else if (registro.materia_estrategia_id) {
    competenciaId = registro.materia_estrategia_id;
  }

  // Intentar obtener corte_id si existe
  if (registro.corte_id) {
    corteId = registro.corte_id;
  }

  // Intentar obtener tipo de causa
  if (registro.tipo_causa) {
    tipoCausa = registro.tipo_causa;
  } else if (registro.letra) {
    tipoCausa = registro.letra;
  }

  // Si tenemos agenda_id, buscar datos relacionados
  if (registro.agenda_id) {
    try {
      const [agendaRows] = await connection.query(
        'SELECT * FROM agenda WHERE id = ?',
        [registro.agenda_id]
      );
      
      if (agendaRows.length > 0) {
        const agenda = agendaRows[0];
        // Si hay relación con juzgado, obtener tribunal
        if (agenda.cuenta_id) {
          // Intentar buscar juzgado relacionado
          try {
            const [juzgadoRows] = await connection.query(
              'SELECT * FROM contrato_rol WHERE cuenta_id = ? LIMIT 1',
              [agenda.cuenta_id]
            );
            if (juzgadoRows.length > 0 && juzgadoRows[0].juzgado_id) {
              tribunalId = juzgadoRows[0].juzgado_id;
            }
          } catch (e) {
            // Tabla puede no existir, continuar
          }
        }
      }
    } catch (e) {
      // Ignorar errores al buscar en agenda
    }
  }

  return {
    competenciaId,
    corteId,
    tribunalId,
    tipoCausa
  };
}

/**
 * Detectar campo de fecha disponible en la tabla
 */
async function detectarCampoFecha(connection) {
  try {
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = ? 
        AND COLUMN_NAME IN ('created_at', 'updated_at', 'fecha_creacion', 'fecha_actualizacion', 'fecha_ultimo_ingreso')
      ORDER BY 
        CASE COLUMN_NAME
          WHEN 'created_at' THEN 1
          WHEN 'updated_at' THEN 2
          WHEN 'fecha_creacion' THEN 3
          WHEN 'fecha_actualizacion' THEN 4
          WHEN 'fecha_ultimo_ingreso' THEN 5
        END
      LIMIT 1
    `, [DB_CONFIG.database, TABLA_MONITOREAR]);
    
    if (columns.length > 0) {
      return columns[0].COLUMN_NAME;
    }
    return null;
  } catch (error) {
    console.warn('⚠️  No se pudo detectar campo de fecha:', error.message);
    return null;
  }
}

/**
 * Verificar nuevos registros en la tabla monitoreada
 */
async function verificarNuevosRegistros() {
  const connection = await getConnection();
  
  try {
    // Detectar campo de fecha disponible
    const campoFechaDisponible = await detectarCampoFecha(connection);
    
    if (!campoFechaDisponible) {
      // Si no hay campo de fecha, usar ID para detectar nuevos registros
      console.log('⚠️  No se encontró campo de fecha, usando ID para detectar nuevos registros');
      const query = `
        SELECT * FROM ${TABLA_MONITOREAR}
        ORDER BY id DESC
        LIMIT 100
      `;
      const [rows] = await connection.query(query);
      
      if (rows.length === 0) {
        console.log('   ✅ No hay registros en la tabla');
        return;
      }
      
      // Procesar solo los primeros 10 para evitar procesar todo
      const registrosNuevos = rows.slice(0, 10);
      console.log(`   📋 Procesando ${registrosNuevos.length} registro(s) (sin campo de fecha)`);
      
      for (const registro of registrosNuevos) {
        await procesarRegistro(registro, connection);
      }
      
      return;
    }
    
    // Construir query según el campo de fecha disponible
    let query;
    let params = [];

    if (ultimaVerificacion) {
      // Si tenemos una fecha de última verificación, buscar registros más nuevos
      const fechaFormateada = ultimaVerificacion instanceof Date 
        ? ultimaVerificacion.toISOString().slice(0, 19).replace('T', ' ')
        : ultimaVerificacion;
      query = `
        SELECT * FROM ${TABLA_MONITOREAR}
        WHERE ${campoFechaDisponible} > ?
        ORDER BY ${campoFechaDisponible} ASC
      `;
      params = [fechaFormateada];
    } else {
      // Primera ejecución: buscar registros de las últimas 24 horas
      query = `
        SELECT * FROM ${TABLA_MONITOREAR}
        WHERE ${campoFechaDisponible} >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY ${campoFechaDisponible} DESC
      `;
    }

    console.log(`🔍 Verificando nuevos registros en tabla: ${TABLA_MONITOREAR}`);
    const [rows] = await connection.query(query, params);

    if (rows.length === 0) {
      console.log('   ✅ No hay nuevos registros');
      return;
    }

    console.log(`   📋 Encontrados ${rows.length} registro(s) nuevo(s)`);

    // Procesar cada registro
    for (const registro of rows) {
      const rit = extraerRIT(registro);
      
      if (!rit) {
        console.log(`   ⚠️  No se pudo extraer RIT del registro ID: ${registro.id || 'N/A'}`);
        continue;
      }

      // Evitar procesar duplicados
      if (registrosProcesados.has(rit)) {
        console.log(`   ⏭️  RIT ${rit} ya fue procesado, omitiendo...`);
        continue;
      }

      // Preparar objeto causa para validación
      const causaParaValidar = {
        rit: rit,
        competencia: registro.competencia_id || registro.materia_estrategia_id,
        corte: registro.corte_id,
        tribunal: registro.tribunal_id || registro.juzgado_id || registro.juzgado_cuenta_id,
        tipoCausa: registro.tipo_causa || registro.letra,
        caratulado: registro.causa_nombre || registro.caratulado,
        causa_id: registro.id,
        agenda_id: registro.agenda_id
      };

      // Validar que tenga todos los datos requeridos del PJUD
      const validacion = validarParaScraping(causaParaValidar);

      if (!validacion.puedeProcesar) {
        console.log(`\n   ⚠️  Registro descartado (datos incompletos):`);
        console.log(`      - RIT: ${rit}`);
        console.log(`      - Motivo: ${validacion.motivo}`);
        console.log(`      - Errores: ${validacion.errores.join(', ')}`);
        continue; // Saltar esta causa
      }

      console.log(`\n   🆕 Nuevo registro detectado (datos completos):`);
      console.log(`      - RIT: ${validacion.config.rit}`);
      console.log(`      - Competencia: ${validacion.config.competencia}`);
      console.log(`      - Corte: ${validacion.config.corte}`);
      console.log(`      - Tribunal: ${validacion.config.tribunal}`);
      console.log(`      - Tipo Causa: ${validacion.config.tipoCausa}`);
      console.log(`      - Caratulado: ${validacion.config.caratulado || 'No especificado'}`);

      // Agregar a la cola de scraping con datos validados
      const agregado = await agregarACola(
        validacion.config.rit,
        parseInt(validacion.config.competencia),
        parseInt(validacion.config.corte),
        parseInt(validacion.config.tribunal),
        validacion.config.tipoCausa
      );

      if (agregado) {
        registrosProcesados.add(rit);
        console.log(`      ✅ RIT agregado a la cola de scraping`);
      } else {
        console.log(`      ⚠️  No se pudo agregar RIT a la cola (puede que ya exista)`);
      }

      // Actualizar última verificación con la fecha de este registro
      const campoFechaDisponible = await detectarCampoFecha(connection);
      if (campoFechaDisponible && registro[campoFechaDisponible]) {
        const fechaRegistro = registro[campoFechaDisponible] instanceof Date 
          ? registro[campoFechaDisponible]
          : new Date(registro[campoFechaDisponible]);
        if (!ultimaVerificacion || fechaRegistro > ultimaVerificacion) {
          ultimaVerificacion = fechaRegistro;
        }
      }
    }

    // Si no hay registros pero tenemos fechas, actualizar igual
    if (rows.length > 0 && !ultimaVerificacion) {
      ultimaVerificacion = new Date();
    }

  } catch (error) {
    console.error('❌ Error verificando registros:', error.message);
    
    // Si el error es porque la tabla no existe, sugerir alternativas
    if (error.message.includes("doesn't exist") || error.message.includes("Table")) {
      console.log('\n💡 Sugerencias:');
      console.log('   1. Verifica que la tabla exista: SHOW TABLES;');
      console.log('   2. Especifica otra tabla: --table nombre_tabla');
      console.log('   3. Verifica el nombre del campo de fecha: --date-field nombre_campo');
    }
  } finally {
    await connection.end();
  }

  // Actualizar última verificación si no se hizo en el loop
  if (!ultimaVerificacion) {
    ultimaVerificacion = new Date();
  }
}

/**
 * Función principal del listener
 */
async function iniciarListener() {
  console.log('\n' + '='.repeat(60));
  console.log('👂 LISTENER DE BASE DE DATOS - Detección Automática');
  console.log('='.repeat(60));
  console.log(`📊 Tabla monitoreada: ${TABLA_MONITOREAR}`);
  console.log(`📅 Campo de fecha: ${CAMPO_FECHA}`);
  console.log(`⏱️  Intervalo de verificación: ${CHECK_INTERVAL}ms (${CHECK_INTERVAL / 1000}s)`);
  console.log(`💾 Base de datos: ${DB_CONFIG.database}`);
  console.log('='.repeat(60));
  console.log('\n⏳ Iniciando verificación...\n');

  // Verificación inicial
  await verificarNuevosRegistros();

  // Verificaciones periódicas
  const intervalo = setInterval(async () => {
    if (!isRunning) {
      clearInterval(intervalo);
      return;
    }

    await verificarNuevosRegistros();
  }, CHECK_INTERVAL);

  // Manejo de señales para cerrar limpiamente
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Deteniendo listener...');
    isRunning = false;
    clearInterval(intervalo);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\n🛑 Deteniendo listener...');
    isRunning = false;
    clearInterval(intervalo);
    process.exit(0);
  });
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  iniciarListener().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { iniciarListener, verificarNuevosRegistros };


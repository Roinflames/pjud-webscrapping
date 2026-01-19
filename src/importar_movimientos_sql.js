// Script para importar movimientos estructurados a MySQL
// Lee archivos movimientos_*.json y los inserta en la base de datos

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { prepareMovimientosForDB } = require('./dataProcessor');

// Configuración de base de datos desde .env
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codi_ejamtest',
  port: process.env.DB_PORT || 3306
};

/**
 * Verifica si un movimiento ya existe en la base de datos
 */
async function movimientoExiste(connection, rit, indice) {
  const [rows] = await connection.execute(
    'SELECT id FROM movimientos WHERE rit = ? AND indice = ? LIMIT 1',
    [rit, indice]
  );
  return rows.length > 0;
}

/**
 * Inserta o actualiza un movimiento en la base de datos
 */
async function insertarMovimiento(connection, movimiento) {
  try {
    // Verificar si ya existe
    const existe = await movimientoExiste(connection, movimiento.rit, movimiento.indice);
    
    if (existe) {
      // Actualizar movimiento existente
      await connection.execute(
        `UPDATE movimientos SET
          fecha = ?,
          caratulado = ?,
          juzgado = ?,
          folio = ?,
          tipo_movimiento = ?,
          subtipo_movimiento = ?,
          descripcion = ?,
          tiene_pdf = ?,
          observaciones = ?,
          raw_data = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE rit = ? AND indice = ?`,
        [
          movimiento.fecha,
          movimiento.caratulado,
          movimiento.juzgado,
          movimiento.folio,
          movimiento.tipo_movimiento,
          movimiento.subtipo_movimiento,
          movimiento.descripcion,
          movimiento.tiene_pdf,
          movimiento.observaciones,
          JSON.stringify(movimiento.raw_data),
          movimiento.rit,
          movimiento.indice
        ]
      );
      return { accion: 'actualizado', movimiento };
    } else {
      // Insertar nuevo movimiento
      await connection.execute(
        `INSERT INTO movimientos (
          rit, indice, fecha, caratulado, juzgado, folio,
          tipo_movimiento, subtipo_movimiento, descripcion,
          tiene_pdf, observaciones, raw_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          movimiento.rit,
          movimiento.indice,
          movimiento.fecha,
          movimiento.caratulado,
          movimiento.juzgado,
          movimiento.folio,
          movimiento.tipo_movimiento,
          movimiento.subtipo_movimiento,
          movimiento.descripcion,
          movimiento.tiene_pdf,
          movimiento.observaciones,
          JSON.stringify(movimiento.raw_data)
        ]
      );
      return { accion: 'insertado', movimiento };
    }
  } catch (error) {
    throw new Error(`Error procesando movimiento ${movimiento.rit}-${movimiento.indice}: ${error.message}`);
  }
}

/**
 * Procesa un archivo JSON y lo importa a la base de datos
 */
async function procesarArchivo(connection, filePath) {
  console.log(`\n📄 Procesando: ${path.basename(filePath)}`);
  
  try {
    const contenido = fs.readFileSync(filePath, 'utf8');
    const datos = JSON.parse(contenido);
    
    if (!datos.movimientos || datos.movimientos.length === 0) {
      console.log('   ℹ️  No hay movimientos para importar');
      return { insertados: 0, actualizados: 0, errores: 0 };
    }
    
    // Preparar movimientos para BD
    const movimientos = prepareMovimientosForDB(datos);
    
    // Log del estado actual si está disponible
    if (datos.estado_actual) {
      console.log(`   📊 Estado: ${datos.estado_actual.estado} - ${datos.estado_actual.descripcion}`);
    }
    
    let insertados = 0;
    let actualizados = 0;
    let errores = 0;
    
    for (const movimiento of movimientos) {
      try {
        const resultado = await insertarMovimiento(connection, movimiento);
        if (resultado.accion === 'insertado') {
          insertados++;
        } else {
          actualizados++;
        }
      } catch (error) {
        console.warn(`   ⚠️  Error: ${error.message}`);
        errores++;
      }
    }
    
    console.log(`   ✅ Insertados: ${insertados}, Actualizados: ${actualizados}, Errores: ${errores}`);
    
    return { insertados, actualizados, errores };
    
  } catch (error) {
    console.error(`   ❌ Error procesando archivo: ${error.message}`);
    return { insertados: 0, actualizados: 0, errores: 1 };
  }
}

/**
 * Importa todos los archivos movimientos_*.json
 */
async function importarMovimientos() {
  const outputsDir = path.resolve(__dirname, 'outputs');
  
  if (!fs.existsSync(outputsDir)) {
    console.error('❌ No se encontró el directorio outputs');
    return;
  }
  
  // Buscar archivos movimientos_*.json
  const archivos = fs.readdirSync(outputsDir)
    .filter(file => file.startsWith('movimientos_') && file.endsWith('.json'))
    .map(file => path.join(outputsDir, file));
  
  if (archivos.length === 0) {
    console.log('ℹ️  No se encontraron archivos movimientos_*.json para importar');
    return;
  }
  
  console.log(`📂 Encontrados ${archivos.length} archivos para importar\n`);
  
  let connection;
  try {
    // Conectar a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado a:', DB_CONFIG.database);
    
    let totalInsertados = 0;
    let totalActualizados = 0;
    let totalErrores = 0;
    
    // Procesar cada archivo
    for (const archivo of archivos) {
      const resultado = await procesarArchivo(connection, archivo);
      totalInsertados += resultado.insertados;
      totalActualizados += resultado.actualizados;
      totalErrores += resultado.errores;
    }
    
    // Resumen
    console.log('\n📊 Resumen de importación:');
    console.log(`   ✅ Insertados: ${totalInsertados}`);
    console.log(`   🔄 Actualizados: ${totalActualizados}`);
    console.log(`   ❌ Errores: ${totalErrores}`);
    console.log(`   📄 Archivos procesados: ${archivos.length}`);
    
  } catch (error) {
    console.error('💥 Error en la importación:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Verifica que MySQL esté corriendo y las credenciales en .env');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  importarMovimientos().catch(console.error);
}

module.exports = { importarMovimientos, procesarArchivo };


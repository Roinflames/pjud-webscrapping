/**
 * SCRIPT HELPER: Agregar RIT a la cola de scraping manualmente
 * 
 * Uso:
 *   node src/agregar_a_cola.js C-12345-2020
 *   node src/agregar_a_cola.js C-12345-2020 3 90 276
 *   node src/agregar_a_cola.js C-12345-2020 3 90 276 C
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codi_ejamtest',
  port: process.env.DB_PORT || 3306
};

async function agregarACola(rit, competenciaId = 3, corteId = 90, tribunalId = null, tipoCausa = 'C') {
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    
    // Verificar si ya existe pendiente o procesando
    const [existentes] = await connection.query(`
      SELECT * FROM pjud_cola_scraping
      WHERE rit = ? AND estado IN ('PENDIENTE', 'PROCESANDO')
    `, [rit]);
    
    if (existentes.length > 0) {
      console.log(`⚠️  El RIT ${rit} ya está en la cola con estado: ${existentes[0].estado}`);
      return false;
    }
    
    // Insertar en la cola
    const [result] = await connection.query(`
      INSERT INTO pjud_cola_scraping (
        rit,
        competencia_id,
        corte_id,
        tribunal_id,
        tipo_causa,
        estado
      ) VALUES (?, ?, ?, ?, ?, 'PENDIENTE')
    `, [rit, competenciaId, corteId, tribunalId, tipoCausa]);
    
    console.log(`✅ RIT ${rit} agregado a la cola de scraping`);
    console.log(`   - ID en cola: ${result.insertId}`);
    console.log(`   - Competencia: ${competenciaId}`);
    console.log(`   - Corte: ${corteId}`);
    console.log(`   - Tribunal: ${tribunalId || 'No especificado'}`);
    console.log(`   - Tipo Causa: ${tipoCausa}`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error agregando RIT a la cola:`, error.message);
    return false;
  } finally {
    if (connection) await connection.end();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Uso: node src/agregar_a_cola.js <RIT> [competencia_id] [corte_id] [tribunal_id] [tipo_causa]');
    console.log('');
    console.log('Ejemplos:');
    console.log('  node src/agregar_a_cola.js C-12345-2020');
    console.log('  node src/agregar_a_cola.js C-12345-2020 3 90 276');
    console.log('  node src/agregar_a_cola.js C-12345-2020 3 90 276 C');
    process.exit(1);
  }
  
  const rit = args[0];
  const competenciaId = args[1] ? parseInt(args[1]) : 3;
  const corteId = args[2] ? parseInt(args[2]) : 90;
  const tribunalId = args[3] ? parseInt(args[3]) : null;
  const tipoCausa = args[4] || 'C';
  
  agregarACola(rit, competenciaId, corteId, tribunalId, tipoCausa)
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { agregarACola };



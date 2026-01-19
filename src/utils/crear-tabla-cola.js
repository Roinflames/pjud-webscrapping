/**
 * Script para crear la tabla de cola de scraping si no existe
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

async function crearTablaCola() {
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    
    console.log('🔧 Creando tabla pjud_cola_scraping si no existe...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pjud_cola_scraping (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rit VARCHAR(50) NOT NULL,
        competencia_id INT,
        corte_id INT,
        tribunal_id INT,
        tipo_causa VARCHAR(10) DEFAULT 'C',
        estado ENUM('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR') DEFAULT 'PENDIENTE',
        intentos INT DEFAULT 0,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_procesamiento DATETIME NULL,
        fecha_completado DATETIME NULL,
        error_message TEXT NULL,
        INDEX idx_estado (estado),
        INDEX idx_rit (rit),
        INDEX idx_fecha_creacion (fecha_creacion)
      )
    `);
    
    console.log('✅ Tabla pjud_cola_scraping creada/verificada exitosamente');
    
    // Verificar que existe
    const [tables] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'pjud_cola_scraping'
    `, [DB_CONFIG.database]);
    
    if (tables[0].count > 0) {
      console.log('✅ Verificación: La tabla existe');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error creando la tabla:', error.message);
    return false;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  crearTablaCola()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { crearTablaCola };

// Script para ejecutar búsqueda de usuario directamente en la BD
// Requiere: npm install mysql2

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de BD (ajustar según tu entorno)
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codi_ejamtest',
  port: process.env.DB_PORT || 3306
};

// Leer configuración del usuario
const configPath = path.resolve(__dirname, 'config/pjud_config.json');
const CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

async function buscarUsuario() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    console.log(`   Host: ${DB_CONFIG.host}`);
    console.log(`   Database: ${DB_CONFIG.database}\n`);
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado a la base de datos\n');
    
    console.log('🔍 Buscando usuario con los siguientes datos:');
    console.log(`   RIT: ${CONFIG.rit}`);
    console.log(`   Cliente: ${CONFIG.cliente}`);
    console.log(`   RUT: ${CONFIG.rut}`);
    console.log(`   Folio: ${CONFIG.folio}\n`);
    
    // Búsqueda 1: Por RIT
    console.log('📋 BÚSQUEDA 1: Por RIT...');
    const [ritResults] = await connection.execute(`
      SELECT 
          c.id AS causa_id,
          c.agenda_id,
          c.id_causa AS rit,
          c.causa_nombre AS caratulado,
          c.materia_estrategia_id AS competencia,
          c.juzgado_cuenta_id AS tribunal,
          c.estado
      FROM causa c
      WHERE c.id_causa = ? OR c.id_causa LIKE ? OR c.id_causa LIKE ?
    `, [CONFIG.rit, `%${CONFIG.rit}%`, `%${CONFIG.rit.replace('-', '%')}%`]);
    
    if (ritResults.length > 0) {
      console.log(`   ✅ Encontradas ${ritResults.length} causa(s) por RIT:`);
      ritResults.forEach((row, i) => {
        console.log(`      ${i + 1}. Causa ID: ${row.causa_id}, RIT: ${row.rit}, Caratulado: ${row.caratulado}`);
      });
    } else {
      console.log('   ❌ No se encontraron causas por RIT');
    }
    console.log('');
    
    // Búsqueda 2: Por RIT con AGENDA
    console.log('📋 BÚSQUEDA 2: Por RIT con datos de AGENDA...');
    const [ritAgendaResults] = await connection.execute(`
      SELECT 
          c.id AS causa_id,
          c.agenda_id,
          c.id_causa AS rit,
          c.causa_nombre AS caratulado,
          c.materia_estrategia_id AS competencia,
          c.juzgado_cuenta_id AS tribunal,
          a.nombre_cliente AS cliente,
          a.rut_cliente AS rut,
          a.folio,
          a.abogado_id,
          a.cuenta_id,
          a.email_cliente,
          a.telefono_cliente
      FROM causa c
      LEFT JOIN agenda a ON c.agenda_id = a.id
      WHERE c.id_causa = ? OR c.id_causa LIKE ? OR c.id_causa LIKE ?
    `, [CONFIG.rit, `%${CONFIG.rit}%`, `%${CONFIG.rit.replace('-', '%')}%`]);
    
    if (ritAgendaResults.length > 0) {
      console.log(`   ✅ Encontradas ${ritAgendaResults.length} causa(s) con datos de agenda:`);
      ritAgendaResults.forEach((row, i) => {
        console.log(`      ${i + 1}. Causa ID: ${row.causa_id}`);
        console.log(`         RIT: ${row.rit}`);
        console.log(`         Cliente: ${row.cliente || 'N/A'}`);
        console.log(`         RUT: ${row.rut || 'N/A'}`);
        console.log(`         Folio: ${row.folio || 'N/A'}`);
        console.log(`         Caratulado: ${row.caratulado || 'N/A'}`);
      });
    } else {
      console.log('   ❌ No se encontraron causas con datos de agenda');
    }
    console.log('');
    
    // Búsqueda 3: Por nombre
    if (CONFIG.cliente) {
      console.log('📋 BÚSQUEDA 3: Por nombre del cliente...');
      const nombreSearch = CONFIG.cliente.replace(/\s+/g, '%');
      const [nombreResults] = await connection.execute(`
        SELECT 
            a.id AS agenda_id,
            a.nombre_cliente AS cliente,
            a.rut_cliente AS rut,
            a.folio,
            a.email_cliente,
            a.telefono_cliente,
            c.id AS causa_id,
            c.id_causa AS rit,
            c.causa_nombre AS caratulado
        FROM agenda a
        LEFT JOIN causa c ON a.id = c.agenda_id
        WHERE a.nombre_cliente LIKE ?
      `, [`%${nombreSearch}%`]);
      
      if (nombreResults.length > 0) {
        console.log(`   ✅ Encontradas ${nombreResults.length} agenda(s) por nombre:`);
        nombreResults.slice(0, 5).forEach((row, i) => {
          console.log(`      ${i + 1}. Agenda ID: ${row.agenda_id}, Cliente: ${row.cliente}, RUT: ${row.rut || 'N/A'}`);
        });
        if (nombreResults.length > 5) {
          console.log(`      ... y ${nombreResults.length - 5} más`);
        }
      } else {
        console.log('   ❌ No se encontraron agendas por nombre');
      }
      console.log('');
    }
    
    // Búsqueda 4: Por RUT
    if (CONFIG.rut) {
      console.log('📋 BÚSQUEDA 4: Por RUT...');
      const rutClean = CONFIG.rut.replace(/[.-]/g, '');
      const [rutResults] = await connection.execute(`
        SELECT 
            a.id AS agenda_id,
            a.nombre_cliente AS cliente,
            a.rut_cliente AS rut,
            a.folio,
            a.email_cliente,
            a.telefono_cliente,
            c.id AS causa_id,
            c.id_causa AS rit,
            c.causa_nombre AS caratulado
        FROM agenda a
        LEFT JOIN causa c ON a.id = c.agenda_id
        WHERE a.rut_cliente LIKE ? OR a.rut_cliente LIKE ?
      `, [`%${rutClean}%`, `%${CONFIG.rut}%`]);
      
      if (rutResults.length > 0) {
        console.log(`   ✅ Encontradas ${rutResults.length} agenda(s) por RUT:`);
        rutResults.forEach((row, i) => {
          console.log(`      ${i + 1}. Agenda ID: ${row.agenda_id}, Cliente: ${row.cliente}, RUT: ${row.rut}`);
        });
      } else {
        console.log('   ❌ No se encontraron agendas por RUT');
      }
      console.log('');
    }
    
    // Búsqueda 5: Por folio
    if (CONFIG.folio) {
      console.log('📋 BÚSQUEDA 5: Por folio...');
      const [folioResults] = await connection.execute(`
        SELECT 
            a.id AS agenda_id,
            a.nombre_cliente AS cliente,
            a.rut_cliente AS rut,
            a.folio,
            c.id AS causa_id,
            c.id_causa AS rit,
            c.causa_nombre AS caratulado
        FROM agenda a
        LEFT JOIN causa c ON a.id = c.agenda_id
        WHERE a.folio = ? OR a.folio LIKE ?
      `, [CONFIG.folio, `%${CONFIG.folio}%`]);
      
      if (folioResults.length > 0) {
        console.log(`   ✅ Encontradas ${folioResults.length} agenda(s) por folio:`);
        folioResults.forEach((row, i) => {
          console.log(`      ${i + 1}. Agenda ID: ${row.agenda_id}, Folio: ${row.folio}, Cliente: ${row.cliente}`);
        });
      } else {
        console.log('   ❌ No se encontraron agendas por folio');
      }
      console.log('');
    }
    
    // Búsqueda 6: Combinada (la más completa)
    console.log('📋 BÚSQUEDA 6: BÚSQUEDA COMBINADA (Todos los criterios)...');
    const nombreSearch = CONFIG.cliente ? CONFIG.cliente.replace(/\s+/g, '%') : '';
    const rutClean = CONFIG.rut ? CONFIG.rut.replace(/[.-]/g, '') : '';
    const caratuladoSearch = CONFIG.caratulado ? CONFIG.caratulado.replace(/\s+/g, '%') : '';
    
    const [combinadaResults] = await connection.execute(`
      SELECT 
          c.id AS causa_id,
          c.agenda_id,
          c.id_causa AS rit,
          c.causa_nombre AS caratulado,
          c.materia_estrategia_id AS competencia,
          c.juzgado_cuenta_id AS tribunal,
          a.nombre_cliente AS cliente,
          a.rut_cliente AS rut,
          a.folio,
          a.abogado_id,
          a.cuenta_id,
          a.email_cliente,
          a.telefono_cliente,
          a.fecha_carga,
          a.fecha_asignado,
          a.status_id
      FROM causa c
      LEFT JOIN agenda a ON c.agenda_id = a.id
      WHERE (
          c.id_causa = ? OR c.id_causa LIKE ?
          ${CONFIG.cliente ? 'OR a.nombre_cliente LIKE ?' : ''}
          ${CONFIG.rut ? 'OR a.rut_cliente LIKE ? OR a.rut_cliente LIKE ?' : ''}
          ${CONFIG.folio ? 'OR a.folio = ?' : ''}
          ${CONFIG.caratulado ? 'OR c.causa_nombre LIKE ?' : ''}
          ${CONFIG.tribunal && CONFIG.competencia ? 'OR (c.juzgado_cuenta_id = ? AND c.materia_estrategia_id = ?)' : ''}
      )
      ORDER BY c.id DESC
      LIMIT 20
    `, [
      CONFIG.rit,
      `%${CONFIG.rit}%`,
      ...(CONFIG.cliente ? [`%${nombreSearch}%`] : []),
      ...(CONFIG.rut ? [`%${rutClean}%`, `%${CONFIG.rut}%`] : []),
      ...(CONFIG.folio ? [CONFIG.folio] : []),
      ...(CONFIG.caratulado ? [`%${caratuladoSearch}%`] : []),
      ...(CONFIG.tribunal && CONFIG.competencia ? [parseInt(CONFIG.tribunal), parseInt(CONFIG.competencia)] : [])
    ]);
    
    if (combinadaResults.length > 0) {
      console.log(`   ✅ Encontradas ${combinadaResults.length} coincidencia(s):\n`);
      combinadaResults.forEach((row, i) => {
        console.log(`   📋 Resultado ${i + 1}:`);
        console.log(`      Causa ID: ${row.causa_id}`);
        console.log(`      Agenda ID: ${row.agenda_id || 'N/A'}`);
        console.log(`      RIT: ${row.rit || 'N/A'}`);
        console.log(`      Caratulado: ${row.caratulado || 'N/A'}`);
        console.log(`      Cliente: ${row.cliente || 'N/A'}`);
        console.log(`      RUT: ${row.rut || 'N/A'}`);
        console.log(`      Folio: ${row.folio || 'N/A'}`);
        console.log(`      Competencia: ${row.competencia || 'N/A'}`);
        console.log(`      Tribunal: ${row.tribunal || 'N/A'}`);
        console.log(`      Email: ${row.email_cliente || 'N/A'}`);
        console.log(`      Teléfono: ${row.telefono_cliente || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No se encontraron coincidencias con la búsqueda combinada');
      console.log('\n💡 Sugerencias:');
      console.log('   - Verifica que el RIT esté en formato correcto');
      console.log('   - El RIT puede estar almacenado con tipo (ej: "C-16707-2019")');
      console.log('   - Verifica que los datos existan en la BD');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 No se pudo conectar a la base de datos.');
      console.error('   Verifica:');
      console.error('   1. Que MySQL/MariaDB esté corriendo');
      console.error('   2. Las credenciales en el código o variables de entorno');
      console.error('   3. Que la base de datos "codi_ejamtest" exista');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Error de acceso a la base de datos.');
      console.error('   Verifica usuario y contraseña');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
buscarUsuario().catch(console.error);


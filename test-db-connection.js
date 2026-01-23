/**
 * Script de prueba de conexión a MariaDB
 * 
 * Uso: node test-db-connection.js
 * 
 * Verifica:
 * - Conexión a la base de datos
 * - Existencia de tablas
 * - Datos disponibles
 */

require('dotenv').config();
const { testConnection, query, getCausaCompleta, listarCausas, getEstadisticas } = require('./src/database/db-mariadb');

async function testDatabase() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 PRUEBA DE CONEXIÓN A MARIADB');
  console.log('='.repeat(60));
  
  // Mostrar configuración (sin contraseña)
  console.log('\n📋 Configuración:');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Port: ${process.env.DB_PORT || '3306'}`);
  console.log(`   User: ${process.env.DB_USER || 'root'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'pjud_scraping'}`);
  console.log(`   Password: ${process.env.DB_PASSWORD ? '***' : 'NO CONFIGURADA'}`);
  
  // 1. Probar conexión
  console.log('\n1️⃣ Probando conexión...');
  try {
    const connectionTest = await testConnection();
    if (connectionTest.success) {
      console.log('   ✅ Conexión exitosa');
    } else {
      console.log('   ❌ Error de conexión:', connectionTest.message);
      console.log('   💡 Verifica:');
      console.log('      - Que MariaDB esté corriendo');
      console.log('      - Que las credenciales en .env sean correctas');
      console.log('      - Que la base de datos exista');
      return;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    return;
  }
  
  // 2. Verificar tablas
  console.log('\n2️⃣ Verificando tablas...');
  try {
    const tables = await query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME || 'pjud_scraping']);
    
    const expectedTables = ['causas', 'movimientos', 'pdfs', 'ebooks', 'errores_scraping', 'scraping_log'];
    const existingTables = tables.map(t => t.TABLE_NAME);
    
    console.log(`   📊 Tablas encontradas: ${existingTables.length}`);
    expectedTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`      ${exists ? '✅' : '❌'} ${table}`);
    });
    
    if (existingTables.length === 0) {
      console.log('   ⚠️ No se encontraron tablas. Ejecuta el script de creación de esquema.');
      console.log('   💡 Archivo: database/schema_mariadb_5.5.sql');
    }
  } catch (error) {
    console.log('   ❌ Error verificando tablas:', error.message);
  }
  
  // 3. Estadísticas
  console.log('\n3️⃣ Estadísticas de la base de datos...');
  try {
    const stats = await getEstadisticas();
    console.log(`   📊 Causas: ${stats.causas.total} total, ${stats.causas.exitosos} exitosas`);
    console.log(`   📊 Movimientos: ${stats.movimientos.total} total, ${stats.movimientos.con_pdf} con PDF`);
    console.log(`   📊 Errores: ${stats.errores.total} total, ${stats.errores.pendientes} pendientes`);
  } catch (error) {
    console.log('   ⚠️ No se pudieron obtener estadísticas:', error.message);
  }
  
  // 4. Listar causas
  console.log('\n4️⃣ Causas disponibles...');
  try {
    const causas = await listarCausas();
    if (causas.length > 0) {
      console.log(`   📋 Total: ${causas.length} causas`);
      console.log('\n   Primeras 5 causas:');
      causas.slice(0, 5).forEach(c => {
        console.log(`      - ${c.rit}: ${c.caratulado || 'Sin caratulado'} (${c.total_movimientos || 0} movimientos)`);
      });
    } else {
      console.log('   ⚠️ No hay causas en la base de datos');
      console.log('   💡 Ejecuta el scraper para cargar datos: node src/test/scraper-5-causas.js');
    }
  } catch (error) {
    console.log('   ❌ Error listando causas:', error.message);
  }
  
  // 5. Probar obtener causa completa
  console.log('\n5️⃣ Probando obtener causa completa...');
  try {
    const causas = await listarCausas();
    if (causas.length > 0) {
      const testRit = causas[0].rit;
      console.log(`   🔍 Probando con RIT: ${testRit}`);
      const causaCompleta = await getCausaCompleta(testRit);
      if (causaCompleta) {
        console.log(`   ✅ Causa obtenida:`);
        console.log(`      - RIT: ${causaCompleta.rit}`);
        console.log(`      - Caratulado: ${causaCompleta.cabecera?.caratulado || 'N/A'}`);
        console.log(`      - Movimientos: ${causaCompleta.movimientos?.length || 0}`);
        console.log(`      - PDFs: ${causaCompleta.total_pdfs || 0}`);
        console.log(`      - eBook: ${causaCompleta.ebook ? 'Sí' : 'No'}`);
      } else {
        console.log('   ⚠️ No se pudo obtener la causa completa');
      }
    } else {
      console.log('   ⏭️ Saltando (no hay causas disponibles)');
    }
  } catch (error) {
    console.log('   ❌ Error obteniendo causa completa:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Prueba completada');
  console.log('='.repeat(60) + '\n');
}

// Ejecutar
testDatabase().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

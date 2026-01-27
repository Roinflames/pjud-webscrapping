/**
 * Script para insertar causa de prueba en la BD
 * RIT: C-213-2023
 * Para testear el scraping que detecta cambios en BD
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const path = require('path');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codi_ejamtest',
  port: process.env.DB_PORT || 3306
};

async function insertarCausaTest() {
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('🔍 Buscando tribunal "1º Juzgado de Letras de Iquique"...');
    
    // Buscar tribunal por nombre
    const [tribunales] = await connection.query(`
      SELECT 
        j.id AS tribunal_id,
        j.nombre AS tribunal_nombre
      FROM juzgado j
      WHERE j.nombre LIKE '%Iquique%'
         OR j.nombre LIKE '%1%Juzgado%Letras%'
         OR j.nombre LIKE '%Juzgado%Iquique%'
      ORDER BY j.id
      LIMIT 10
    `);
    
    let tribunalId = null;
    
    if (tribunales.length > 0) {
      console.log(`✅ Encontrados ${tribunales.length} tribunal(es) relacionados con Iquique:`);
      tribunales.forEach(t => {
        console.log(`   - ID: ${t.tribunal_id}, Nombre: ${t.tribunal_nombre}`);
      });
      
      // Usar el primero que contenga "1º" o "Primero"
      tribunalId = tribunales.find(t => 
        t.tribunal_nombre.includes('1') || 
        t.tribunal_nombre.includes('Primero') ||
        t.tribunal_nombre.includes('1º')
      )?.tribunal_id || tribunales[0].tribunal_id;
      
      console.log(`\n✅ Usando tribunal_id: ${tribunalId}`);
    } else {
      console.log('⚠️  No se encontró tribunal específico para Iquique');
      console.log('   Buscando todos los juzgados disponibles...');
      
      const [todosJuzgados] = await connection.query(`
        SELECT id, nombre FROM juzgado 
        WHERE nombre LIKE '%Iquique%' 
        LIMIT 5
      `);
      
      if (todosJuzgados.length > 0) {
        console.log('   Juzgados encontrados:');
        todosJuzgados.forEach(j => {
          console.log(`   - ID: ${j.id}, Nombre: ${j.nombre}`);
        });
        tribunalId = todosJuzgados[0].id;
        console.log(`\n✅ Usando tribunal_id: ${tribunalId} (primer resultado)`);
      } else {
        console.log('❌ No se encontró ningún juzgado de Iquique');
        console.log('   Se insertará la causa con tribunal_id = NULL');
        console.log('   ⚠️  Necesitarás actualizar manualmente el tribunal_id');
      }
    }
    
    console.log('\n📝 Insertando causa de prueba...');
    
    // Verificar si ya existe
    const [existentes] = await connection.query(`
      SELECT id, id_causa, causa_nombre 
      FROM causa 
      WHERE id_causa = 'C-213-2023'
    `);
    
    if (existentes.length > 0) {
      console.log('⚠️  La causa ya existe, actualizando...');
      
      await connection.query(`
        UPDATE causa SET
          causa_nombre = ?,
          materia_estrategia_id = ?,
          juzgado_cuenta_id = ?,
          letra = ?,
          rol = ?,
          anio = ?,
          estado = 1
        WHERE id_causa = 'C-213-2023'
      `, [
        'COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI SCM/FISCO DE CHILE (CDE)',
        3,  // Competencia: Civil
        tribunalId,
        'C',  // Tipo: Civil
        '213',
        2023
      ]);
      
      console.log('✅ Causa actualizada exitosamente');
    } else {
      await connection.query(`
        INSERT INTO causa (
          id_causa,
          causa_nombre,
          materia_estrategia_id,
          juzgado_cuenta_id,
          letra,
          rol,
          anio,
          estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'C-213-2023',
        'COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI SCM/FISCO DE CHILE (CDE)',
        3,  // Competencia: Civil
        tribunalId,
        'C',  // Tipo: Civil
        '213',
        2023,
        1  // Estado: activo
      ]);
      
      console.log('✅ Causa insertada exitosamente');
    }
    
    // Verificar inserción
    const [verificacion] = await connection.query(`
      SELECT 
        c.id AS causa_id,
        c.id_causa AS rit,
        c.causa_nombre AS caratulado,
        c.materia_estrategia_id AS competencia,
        c.juzgado_cuenta_id AS tribunal_id,
        c.letra AS tipo_causa,
        c.rol,
        c.anio,
        j.nombre AS tribunal_nombre
      FROM causa c
      LEFT JOIN juzgado j ON c.juzgado_cuenta_id = j.id
      WHERE c.id_causa = 'C-213-2023'
    `);
    
    if (verificacion.length > 0) {
      const causa = verificacion[0];
      console.log('\n📊 Causa insertada/actualizada:');
      console.log(`   - ID: ${causa.causa_id}`);
      console.log(`   - RIT: ${causa.rit}`);
      console.log(`   - Caratulado: ${causa.caratulado}`);
      console.log(`   - Competencia: ${causa.competencia} (Civil)`);
      console.log(`   - Tribunal ID: ${causa.tribunal_id || 'NULL'}`);
      console.log(`   - Tribunal Nombre: ${causa.tribunal_nombre || 'No encontrado'}`);
      console.log(`   - Tipo: ${causa.tipo_causa}`);
      console.log(`   - Rol: ${causa.rol}, Año: ${causa.anio}`);
      
      if (!causa.tribunal_id) {
        console.log('\n⚠️  ADVERTENCIA: La causa no tiene tribunal_id asignado');
        console.log('   El scraping puede fallar si requiere tribunal_id');
        console.log('   Busca manualmente el ID del tribunal y actualiza:');
        console.log(`   UPDATE causa SET juzgado_cuenta_id = TRIBUNAL_ID WHERE id_causa = 'C-213-2023';`);
      } else {
        console.log('\n✅ La causa está lista para scraping');
        console.log('\n🚀 Próximos pasos:');
        console.log('   1. Inicia el listener: npm run api:listener');
        console.log('   2. O inicia el worker de cola: node src/worker_cola_scraping.js');
        console.log('   3. El sistema detectará la nueva causa y ejecutará el scraping');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('   La tabla "causa" no existe. Verifica la estructura de la BD.');
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.error('   Campo no encontrado. Verifica la estructura de la tabla "causa".');
      console.error('   Campos esperados: id_causa, causa_nombre, materia_estrategia_id, juzgado_cuenta_id, letra, rol, anio, estado');
    }
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Ejecutar
if (require.main === module) {
  insertarCausaTest().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { insertarCausaTest };

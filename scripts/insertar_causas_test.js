/**
 * Script para insertar múltiples causas de prueba en la BD
 * Hace match automático con tribunales según nombre
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const path = require('path');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'codi_ejamtest',
  port: process.env.DB_PORT || 3306
};

// Causas a insertar
const CAUSAS_TEST = [
  {
    rit: 'C-213-2023',
    fecha: '10/01/2023',
    caratulado: 'COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI SCM/FISCO DE CHILE (CDE)',
    tribunal_nombre: '1º Juzgado de Letras de Iquique'
  },
  {
    rit: 'C-212-2023',
    fecha: '10/01/2023',
    caratulado: 'COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI SCM/FISCO DE CHILE (CDE)',
    tribunal_nombre: '1º Juzgado de Letras de Iquique'
  },
  {
    rit: 'C-212-2023',
    fecha: '01/02/2023',
    caratulado: 'BANCO DEL ESTADO DE CHILE/NAVARRETE',
    tribunal_nombre: 'Juzgado de Letras de Casablanca'
  },
  {
    rit: 'C-201-2021',
    fecha: '19/02/2021',
    caratulado: 'CAJA DE COMPENSACIÓN DE ASIGNACIÓN FAMILIAR LOS ANDES./ESCOBAR',
    tribunal_nombre: '2º Juzgado de Letras de Los Andes'
  },
  {
    rit: 'C-200-2020',
    fecha: '31/01/2020',
    caratulado: 'BANCO DEL ESTADO DE CHIL/FIGUEROA',
    tribunal_nombre: '3º Juzgado de Letras de Punta Arenas'
  },
  {
    rit: 'C-200-2020',
    fecha: '07/01/2020',
    caratulado: 'HOSPITAL CLÍNICO - UNIVERSIDAD DE CHILE/LORCA',
    tribunal_nombre: '13º Juzgado Civil de Santiago'
  }
];

/**
 * Buscar tribunal por nombre (match flexible)
 */
async function buscarTribunal(connection, tribunalNombre) {
  // Normalizar nombre para búsqueda
  const nombreNormalizado = tribunalNombre
    .toLowerCase()
    .replace(/[º°]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Extraer palabras clave
  const palabras = nombreNormalizado.split(' ').filter(p => p.length > 2);
  
  // Construir query con LIKE para cada palabra clave
  const condiciones = palabras.map(p => `j.nombre LIKE '%${p}%'`).join(' AND ');
  
  const [tribunales] = await connection.query(`
    SELECT 
      j.id AS tribunal_id,
      j.nombre AS tribunal_nombre
    FROM juzgado j
    WHERE ${condiciones}
    ORDER BY 
      CASE 
        WHEN j.nombre LIKE ? THEN 1
        WHEN j.nombre LIKE ? THEN 2
        ELSE 3
      END,
      j.id
    LIMIT 10
  `, [
    `%${tribunalNombre}%`,
    `%${palabras[0]}%`
  ]);
  
  if (tribunales.length > 0) {
    // Intentar match exacto primero
    const matchExacto = tribunales.find(t => 
      t.tribunal_nombre.toLowerCase().replace(/[º°]/g, '').trim() === nombreNormalizado
    );
    
    if (matchExacto) {
      return matchExacto.tribunal_id;
    }
    
    // Si no hay match exacto, usar el primero
    return tribunales[0].tribunal_id;
  }
  
  return null;
}

/**
 * Extraer datos del RIT
 */
function extraerDatosRIT(rit) {
  const parts = rit.split('-');
  if (parts.length >= 3) {
    return {
      tipo: parts[0], // 'C'
      rol: parts[1],  // '213'
      año: parseInt(parts[2]) // 2023
    };
  } else if (parts.length === 2) {
    return {
      tipo: 'C',
      rol: parts[0],
      año: parseInt(parts[1])
    };
  }
  return { tipo: 'C', rol: null, año: null };
}

/**
 * Insertar o actualizar causa
 */
async function insertarCausa(connection, causaData, tribunalId) {
  const { tipo, rol, año } = extraerDatosRIT(causaData.rit);
  
  // Verificar si ya existe
  const [existentes] = await connection.query(`
    SELECT id, id_causa, causa_nombre, juzgado_cuenta_id
    FROM causa 
    WHERE id_causa = ?
  `, [causaData.rit]);
  
  if (existentes.length > 0) {
    // Actualizar
    await connection.query(`
      UPDATE causa SET
        causa_nombre = ?,
        materia_estrategia_id = ?,
        juzgado_cuenta_id = ?,
        letra = ?,
        rol = ?,
        anio = ?,
        estado = 1
      WHERE id_causa = ?
    `, [
      causaData.caratulado,
      3,  // Competencia: Civil
      tribunalId,
      tipo,
      rol,
      año,
      causaData.rit
    ]);
    return { accion: 'actualizada', id: existentes[0].id };
  } else {
    // Insertar
    const [result] = await connection.query(`
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
      causaData.rit,
      causaData.caratulado,
      3,  // Competencia: Civil
      tribunalId,
      tipo,
      rol,
      año,
      1  // Estado: activo
    ]);
    return { accion: 'insertada', id: result.insertId };
  }
}

/**
 * Función principal
 */
async function insertarCausasTest() {
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('🚀 Iniciando inserción de causas de prueba...\n');
    
    const resultados = [];
    
    for (const causaData of CAUSAS_TEST) {
      console.log(`\n📋 Procesando: ${causaData.rit}`);
      console.log(`   Caratulado: ${causaData.caratulado}`);
      console.log(`   Tribunal: ${causaData.tribunal_nombre}`);
      
      // Buscar tribunal
      const tribunalId = await buscarTribunal(connection, causaData.tribunal_nombre);
      
      if (!tribunalId) {
        console.log(`   ⚠️  No se encontró tribunal para: ${causaData.tribunal_nombre}`);
        console.log(`   ⚠️  Se insertará con tribunal_id = NULL`);
        resultados.push({
          rit: causaData.rit,
          tribunal_nombre: causaData.tribunal_nombre,
          tribunal_id: null,
          estado: 'sin_tribunal'
        });
      } else {
        // Verificar nombre del tribunal encontrado
        const [tribunalInfo] = await connection.query(`
          SELECT id, nombre FROM juzgado WHERE id = ?
        `, [tribunalId]);
        
        if (tribunalInfo.length > 0) {
          console.log(`   ✅ Tribunal encontrado: ID ${tribunalId} - ${tribunalInfo[0].nombre}`);
        }
        
        // Insertar/actualizar causa
        const resultado = await insertarCausa(connection, causaData, tribunalId);
        console.log(`   ✅ Causa ${resultado.accion} (ID: ${resultado.id})`);
        
        resultados.push({
          rit: causaData.rit,
          tribunal_nombre: causaData.tribunal_nombre,
          tribunal_id: tribunalId,
          tribunal_nombre_encontrado: tribunalInfo[0]?.nombre || 'N/A',
          estado: 'ok',
          accion: resultado.accion,
          causa_id: resultado.id
        });
      }
    }
    
    // Resumen
    console.log('\n\n📊 RESUMEN DE INSERCIÓN:');
    console.log('='.repeat(80));
    
    const ok = resultados.filter(r => r.estado === 'ok').length;
    const sinTribunal = resultados.filter(r => r.estado === 'sin_tribunal').length;
    
    console.log(`✅ Insertadas/Actualizadas correctamente: ${ok}`);
    console.log(`⚠️  Sin tribunal encontrado: ${sinTribunal}`);
    
    console.log('\n📋 Detalle:');
    resultados.forEach((r, i) => {
      console.log(`\n   ${i + 1}. ${r.rit}`);
      console.log(`      Tribunal buscado: ${r.tribunal_nombre}`);
      if (r.tribunal_id) {
        console.log(`      Tribunal encontrado: ID ${r.tribunal_id} - ${r.tribunal_nombre_encontrado}`);
        console.log(`      Estado: ✅ ${r.accion} (Causa ID: ${r.causa_id})`);
      } else {
        console.log(`      Estado: ⚠️  Sin tribunal (necesita actualización manual)`);
      }
    });
    
    // Verificar causas insertadas
    console.log('\n\n🔍 VERIFICACIÓN DE CAUSAS EN BD:');
    console.log('='.repeat(80));
    
    const rits = CAUSAS_TEST.map(c => c.rit);
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
      WHERE c.id_causa IN (?)
      ORDER BY c.id_causa, c.id
    `, [rits]);
    
    if (verificacion.length > 0) {
      verificacion.forEach((c, i) => {
        console.log(`\n   ${i + 1}. ${c.rit}`);
        console.log(`      ID: ${c.causa_id}`);
        console.log(`      Caratulado: ${c.caratulado}`);
        console.log(`      Competencia: ${c.competencia} (Civil)`);
        console.log(`      Tribunal ID: ${c.tribunal_id || 'NULL'}`);
        console.log(`      Tribunal Nombre: ${c.tribunal_nombre || 'No encontrado'}`);
        console.log(`      Tipo: ${c.tipo_causa}, Rol: ${c.rol}, Año: ${c.anio}`);
      });
    } else {
      console.log('   ⚠️  No se encontraron causas en la BD');
    }
    
    console.log('\n✅ Proceso completado');
    console.log('\n🚀 Próximos pasos:');
    console.log('   1. Ejecutar scraping: PLAYWRIGHT_BROWSER=firefox node src/process-causas.js 5');
    console.log('   2. O iniciar worker: node src/worker-monitoreo-continuo.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('   La tabla "causa" o "juzgado" no existe. Verifica la estructura de la BD.');
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.error('   Campo no encontrado. Verifica la estructura de la tabla.');
    }
    console.error(error.stack);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Ejecutar
if (require.main === module) {
  insertarCausasTest().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { insertarCausasTest, buscarTribunal };

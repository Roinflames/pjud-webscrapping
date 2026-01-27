/**
 * Script para insertar múltiples causas de prueba en la BD
 * Inserta directamente en la tabla 'causas' con IDs de tribunal manuales
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'codi_ejamtest',
  port: process.env.DB_PORT || 3306
};

// Causas a insertar con IDs de tribunal únicos
const CAUSAS_TEST = [
  {
    rit: 'C-213-2023',
    fecha: '10/01/2023',
    caratulado: 'COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI SCM/FISCO DE CHILE (CDE)',
    tribunal_id: '500',
    tribunal_nombre: '1º Juzgado de Letras de Iquique',
    corte_id: '50',
    corte_nombre: 'C.A. de Iquique'
  },
  {
    rit: 'C-212-2023',
    fecha: '10/01/2023',
    caratulado: 'COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI SCM/FISCO DE CHILE (CDE)',
    tribunal_id: '500',
    tribunal_nombre: '1º Juzgado de Letras de Iquique',
    corte_id: '50',
    corte_nombre: 'C.A. de Iquique'
  },
  {
    rit: 'C-211-2023',  // Cambiado de C-212-2023 (duplicado)
    fecha: '01/02/2023',
    caratulado: 'BANCO DEL ESTADO DE CHILE/NAVARRETE',
    tribunal_id: '501',
    tribunal_nombre: 'Juzgado de Letras de Casablanca',
    corte_id: '30',
    corte_nombre: 'C.A. de Valparaíso'
  },
  {
    rit: 'C-201-2021',
    fecha: '19/02/2021',
    caratulado: 'CAJA DE COMPENSACIÓN DE ASIGNACIÓN FAMILIAR LOS ANDES./ESCOBAR',
    tribunal_id: '502',
    tribunal_nombre: '2º Juzgado de Letras de Los Andes',
    corte_id: '30',
    corte_nombre: 'C.A. de Valparaíso'
  },
  {
    rit: 'C-200-2020',
    fecha: '31/01/2020',
    caratulado: 'BANCO DEL ESTADO DE CHIL/FIGUEROA',
    tribunal_id: '503',
    tribunal_nombre: '3º Juzgado de Letras de Punta Arenas',
    corte_id: '60',
    corte_nombre: 'C.A. de Punta Arenas'
  },
  {
    rit: 'C-199-2020',  // Cambiado de C-200-2020 (duplicado)
    fecha: '07/01/2020',
    caratulado: 'HOSPITAL CLÍNICO - UNIVERSIDAD DE CHILE/LORCA',
    tribunal_id: '504',
    tribunal_nombre: '13º Juzgado Civil de Santiago',
    corte_id: '90',
    corte_nombre: 'C.A. de Santiago'
  }
];

/**
 * Extraer datos del RIT
 */
function extraerDatosRIT(rit) {
  const parts = rit.split('-');
  if (parts.length >= 3) {
    return {
      tipo: parts[0],      // 'C'
      rol: parts[1],       // '213'
      anio: parseInt(parts[2])  // 2023
    };
  }
  return { tipo: 'C', rol: null, anio: null };
}

/**
 * Insertar o actualizar causa
 */
async function insertarCausa(connection, causaData) {
  const { tipo, rol, anio } = extraerDatosRIT(causaData.rit);

  // Verificar si ya existe
  const [existentes] = await connection.query(`
    SELECT id, rit, tribunal_nombre
    FROM causas
    WHERE rit = ?
  `, [causaData.rit]);

  if (existentes.length > 0) {
    // Actualizar
    await connection.query(`
      UPDATE causas SET
        caratulado = ?,
        tipo_causa = ?,
        rol = ?,
        anio = ?,
        competencia_id = '3',
        competencia_nombre = 'Civil',
        corte_id = ?,
        corte_nombre = ?,
        tribunal_id = ?,
        tribunal_nombre = ?,
        estado = 'SIN_INFORMACION',
        scraping_exitoso = 0
      WHERE rit = ?
    `, [
      causaData.caratulado,
      tipo,
      rol,
      anio,
      causaData.corte_id,
      causaData.corte_nombre,
      causaData.tribunal_id,
      causaData.tribunal_nombre,
      causaData.rit
    ]);
    return { accion: 'actualizada', id: existentes[0].id };
  } else {
    // Insertar
    const [result] = await connection.query(`
      INSERT INTO causas (
        rit,
        tipo_causa,
        rol,
        anio,
        competencia_id,
        competencia_nombre,
        corte_id,
        corte_nombre,
        tribunal_id,
        tribunal_nombre,
        caratulado,
        estado,
        scraping_exitoso,
        total_movimientos,
        total_pdfs
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      causaData.rit,
      tipo,
      rol,
      anio,
      '3',  // competencia_id: Civil
      'Civil',  // competencia_nombre
      causaData.corte_id,
      causaData.corte_nombre,
      causaData.tribunal_id,
      causaData.tribunal_nombre,
      causaData.caratulado,
      'SIN_INFORMACION',  // estado
      0,  // scraping_exitoso
      0,  // total_movimientos
      0   // total_pdfs
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
    console.log(`📍 Conectando a: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
    console.log(`👤 Usuario: ${DB_CONFIG.user}\n`);

    const resultados = [];

    for (const causaData of CAUSAS_TEST) {
      console.log(`\n📋 Procesando: ${causaData.rit}`);
      console.log(`   Caratulado: ${causaData.caratulado.substring(0, 60)}...`);
      console.log(`   Tribunal: ${causaData.tribunal_nombre} (ID: ${causaData.tribunal_id})`);
      console.log(`   Corte: ${causaData.corte_nombre} (ID: ${causaData.corte_id})`);

      try {
        // Insertar/actualizar causa
        const resultado = await insertarCausa(connection, causaData);
        console.log(`   ✅ Causa ${resultado.accion} (ID: ${resultado.id})`);

        resultados.push({
          rit: causaData.rit,
          tribunal_nombre: causaData.tribunal_nombre,
          tribunal_id: causaData.tribunal_id,
          estado: 'ok',
          accion: resultado.accion,
          causa_id: resultado.id
        });
      } catch (error) {
        console.log(`   ❌ Error al insertar: ${error.message}`);
        resultados.push({
          rit: causaData.rit,
          estado: 'error',
          error: error.message
        });
      }
    }

    // Resumen
    console.log('\n\n📊 RESUMEN DE INSERCIÓN:');
    console.log('='.repeat(80));

    const ok = resultados.filter(r => r.estado === 'ok').length;
    const errores = resultados.filter(r => r.estado === 'error').length;

    console.log(`✅ Insertadas/Actualizadas correctamente: ${ok}`);
    console.log(`❌ Errores: ${errores}`);

    console.log('\n📋 Detalle:');
    resultados.forEach((r, i) => {
      console.log(`\n   ${i + 1}. ${r.rit}`);
      if (r.estado === 'ok') {
        console.log(`      Tribunal: ${r.tribunal_nombre} (ID: ${r.tribunal_id})`);
        console.log(`      Estado: ✅ ${r.accion} (Causa ID: ${r.causa_id})`);
      } else {
        console.log(`      Estado: ❌ Error: ${r.error}`);
      }
    });

    // Verificar causas insertadas
    console.log('\n\n🔍 VERIFICACIÓN DE CAUSAS EN BD:');
    console.log('='.repeat(80));

    const rits = CAUSAS_TEST.map(c => c.rit);
    const [verificacion] = await connection.query(`
      SELECT
        id AS causa_id,
        rit,
        caratulado,
        competencia_id,
        competencia_nombre,
        tribunal_id,
        tribunal_nombre,
        corte_id,
        corte_nombre,
        tipo_causa,
        rol,
        anio,
        estado,
        scraping_exitoso
      FROM causas
      WHERE rit IN (?)
      ORDER BY rit
    `, [rits]);

    if (verificacion.length > 0) {
      verificacion.forEach((c, i) => {
        console.log(`\n   ${i + 1}. ${c.rit}`);
        console.log(`      ID: ${c.causa_id}`);
        console.log(`      Caratulado: ${c.caratulado.substring(0, 60)}...`);
        console.log(`      Competencia: ${c.competencia_id} - ${c.competencia_nombre}`);
        console.log(`      Tribunal: ${c.tribunal_id} - ${c.tribunal_nombre}`);
        console.log(`      Corte: ${c.corte_id} - ${c.corte_nombre}`);
        console.log(`      Tipo: ${c.tipo_causa}, Rol: ${c.rol}, Año: ${c.anio}`);
        console.log(`      Estado: ${c.estado}, Scraping: ${c.scraping_exitoso ? 'Sí' : 'No'}`);
      });
    } else {
      console.log('   ⚠️  No se encontraron causas en la BD');
    }

    console.log('\n✅ Proceso completado');
    console.log('\n🚀 Próximos pasos:');
    console.log('   1. Ejecutar scraping de prueba (5 causas):');
    console.log('      PLAYWRIGHT_BROWSER=firefox node src/process-causas.js 5');
    console.log('\n   2. O ejecutar las causas insertadas específicamente:');
    console.log(`      node src/processRit.js ${CAUSAS_TEST[0].rit} "${CAUSAS_TEST[0].caratulado}" "${CAUSAS_TEST[0].tribunal_nombre}"`);

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('   La tabla "causas" no existe. Verifica la estructura de la BD.');
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.error('   Campo no encontrado. Verifica la estructura de la tabla.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error(`   No se pudo conectar a MySQL en ${DB_CONFIG.host}:${DB_CONFIG.port}`);
      console.error('   Verifica que MySQL esté corriendo y que DB_PORT en .env sea correcto');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error(`   Acceso denegado para usuario '${DB_CONFIG.user}'`);
      console.error('   Verifica DB_USER y DB_PASS en .env');
    }
    console.error('\n📝 Error completo:', error.stack);
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

module.exports = { insertarCausasTest, extraerDatosRIT };

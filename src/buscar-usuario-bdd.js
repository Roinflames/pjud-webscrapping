// Script para buscar usuario en la BD basado en pjud_config.json
const fs = require('fs');
const path = require('path');

// Leer configuración
const configPath = path.resolve(__dirname, 'config/pjud_config.json');
const CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

console.log('🔍 Buscando usuario en BD basado en pjud_config.json\n');
console.log('📋 Datos de búsqueda:');
console.log(`   RIT: ${CONFIG.rit}`);
console.log(`   Cliente: ${CONFIG.cliente}`);
console.log(`   RUT: ${CONFIG.rut}`);
console.log(`   Folio: ${CONFIG.folio}`);
console.log(`   Caratulado: ${CONFIG.caratulado}`);
console.log(`   Tribunal: ${CONFIG.tribunal}`);
console.log(`   Competencia: ${CONFIG.competencia}\n`);

// Generar queries SQL
const queries = {
  porRit: `
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    c.estado,
    c.fecha_ultimo_ingreso
FROM causa c
WHERE c.id_causa = '${CONFIG.rit}'
   OR c.id_causa LIKE '%${CONFIG.rit}%'
   OR c.id_causa LIKE '%${CONFIG.rit.replace('-', '%')}%';
`,

  porRitConAgenda: `
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id,
    a.folio,
    a.email_cliente,
    a.telefono_cliente,
    a.fecha_carga,
    a.fecha_asignado,
    a.status_id
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.id_causa = '${CONFIG.rit}'
   OR c.id_causa LIKE '%${CONFIG.rit}%'
   OR c.id_causa LIKE '%${CONFIG.rit.replace('-', '%')}%';
`,

  porNombre: `
SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.folio,
    a.email_cliente,
    a.telefono_cliente,
    a.abogado_id,
    a.cuenta_id,
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado
FROM agenda a
LEFT JOIN causa c ON a.id = c.agenda_id
WHERE a.nombre_cliente LIKE '%${CONFIG.cliente.replace(/\s+/g, '%')}%'
   OR a.nombre_cliente LIKE '%${CONFIG.cliente.split(' ').slice(0, 2).join('%')}%';
`,

  porRut: `
SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.folio,
    a.email_cliente,
    a.telefono_cliente,
    a.abogado_id,
    a.cuenta_id,
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal
FROM agenda a
LEFT JOIN causa c ON a.id = c.agenda_id
WHERE a.rut_cliente LIKE '%${CONFIG.rut.replace(/[.-]/g, '')}%'
   OR a.rut_cliente LIKE '%${CONFIG.rut}%';
`,

  porFolio: `
SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.folio,
    a.email_cliente,
    a.telefono_cliente,
    a.abogado_id,
    a.cuenta_id,
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado
FROM agenda a
LEFT JOIN causa c ON a.id = c.agenda_id
WHERE a.folio = '${CONFIG.folio}'
   OR a.folio LIKE '%${CONFIG.folio}%';
`,

  porCaratulado: `
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.causa_nombre LIKE '%${CONFIG.caratulado.replace(/\s+/g, '%')}%';
`,

  combinada: `
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
    c.id_causa = '${CONFIG.rit}' OR c.id_causa LIKE '%${CONFIG.rit}%'
    OR a.nombre_cliente LIKE '%${CONFIG.cliente.replace(/\s+/g, '%')}%'
    OR a.rut_cliente LIKE '%${CONFIG.rut.replace(/[.-]/g, '')}%'
    OR a.folio = '${CONFIG.folio}'
    OR c.causa_nombre LIKE '%${CONFIG.caratulado.replace(/\s+/g, '%')}%'
    OR (c.juzgado_cuenta_id = ${CONFIG.tribunal} AND c.materia_estrategia_id = ${CONFIG.competencia})
)
ORDER BY c.id DESC;
`
};

// Guardar queries en archivo SQL
const sqlPath = path.resolve(__dirname, '../buscar_usuario_bdd.sql');
const sqlContent = `-- ============================================
-- BUSCAR USUARIO EN BASE DE DATOS
-- Generado automáticamente desde pjud_config.json
-- Fecha: ${new Date().toISOString()}
-- ============================================

USE codi_ejamtest;

-- ============================================
-- BÚSQUEDA 1: Por RIT
-- ============================================
${queries.porRit}

-- ============================================
-- BÚSQUEDA 2: Por RIT con datos de AGENDA
-- ============================================
${queries.porRitConAgenda}

-- ============================================
-- BÚSQUEDA 3: Por nombre del cliente
-- ============================================
${queries.porNombre}

-- ============================================
-- BÚSQUEDA 4: Por RUT
-- ============================================
${queries.porRut}

-- ============================================
-- BÚSQUEDA 5: Por folio
-- ============================================
${queries.porFolio}

-- ============================================
-- BÚSQUEDA 6: Por caratulado
-- ============================================
${queries.porCaratulado}

-- ============================================
-- BÚSQUEDA 7: BÚSQUEDA COMBINADA (Todos los criterios)
-- ============================================
${queries.combinada}
`;

fs.writeFileSync(sqlPath, sqlContent, 'utf-8');

console.log('✅ Archivo SQL generado: buscar_usuario_bdd.sql\n');
console.log('📝 Queries disponibles:');
console.log('   1. Por RIT');
console.log('   2. Por RIT con datos de AGENDA');
console.log('   3. Por nombre del cliente');
console.log('   4. Por RUT');
console.log('   5. Por folio');
console.log('   6. Por caratulado');
console.log('   7. Búsqueda combinada (recomendada)\n');
console.log('💡 Para ejecutar:');
console.log('   mysql -u root -p codi_ejamtest < buscar_usuario_bdd.sql');
console.log('   O copia y pega las queries en phpMyAdmin\n');


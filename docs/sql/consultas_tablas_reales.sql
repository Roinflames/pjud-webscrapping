-- ============================================
-- CONSULTAS BASADAS EN TABLAS QUE EXISTEN
-- Tablas confirmadas: agenda, accion, actuacion, actuacion_anexo_procesal
-- ============================================

-- ============================================
-- PASO 1: Ver TODAS las tablas (ejecuta esto primero)
-- ============================================
SHOW TABLES;

-- ============================================
-- PASO 2: Ver estructura de la tabla AGENDA
-- ============================================
DESCRIBE agenda;

-- Ver algunos registros de agenda
SELECT * FROM agenda LIMIT 10;

-- ============================================
-- PASO 3: Buscar en AGENDA por datos del JSON
-- ============================================
-- Buscar por nombre del cliente
SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.folio,
    a.abogado_id,
    a.cuenta_id,
    a.sucursal_id
FROM agenda a
WHERE a.nombre_cliente LIKE '%Carlos Domingo Gutierrez Ramos%'
   OR a.nombre_cliente LIKE '%Carlos%Gutierrez%'
   OR a.rut_cliente LIKE '%8462961%'
   OR a.folio = '20212'
   OR a.folio LIKE '%20212%';

-- ============================================
-- PASO 4: Ver estructura de ACTUACION
-- ============================================
DESCRIBE actuacion;

-- Ver algunos registros
SELECT * FROM actuacion LIMIT 10;

-- ============================================
-- PASO 5: Buscar tablas que puedan tener los datos
-- ============================================
-- Buscar tablas con "contrato"
SHOW TABLES LIKE '%contrato%';

-- Buscar tablas con "causa"
SHOW TABLES LIKE '%causa%';

-- Buscar tablas con "cliente"
SHOW TABLES LIKE '%cliente%';

-- Buscar tablas con "juzgado"
SHOW TABLES LIKE '%juzgado%';

-- Buscar tablas con "usuario"
SHOW TABLES LIKE '%usuario%';

-- Buscar tablas con "cuenta"
SHOW TABLES LIKE '%cuenta%';

-- Buscar tablas con "rol"
SHOW TABLES LIKE '%rol%';

-- ============================================
-- PASO 6: Ver todas las tablas con información
-- ============================================
SELECT 
    TABLE_NAME AS nombre_tabla,
    TABLE_ROWS AS cantidad_registros
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'codi_ejamtest'
ORDER BY TABLE_NAME;


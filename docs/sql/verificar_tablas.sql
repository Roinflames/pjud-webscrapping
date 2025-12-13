-- ============================================
-- PASO 1: Ver TODAS las tablas que existen en la base de datos
-- ============================================
SHOW TABLES;

-- ============================================
-- PASO 2: Buscar tablas que contengan palabras clave
-- ============================================
-- Esto te mostrará todas las tablas que contengan estas palabras
SHOW TABLES LIKE '%contrato%';
SHOW TABLES LIKE '%causa%';
SHOW TABLES LIKE '%cliente%';
SHOW TABLES LIKE '%agenda%';
SHOW TABLES LIKE '%juzgado%';
SHOW TABLES LIKE '%usuario%';

-- ============================================
-- PASO 3: Ver estructura de la base de datos
-- ============================================
-- Ver todas las tablas con información adicional
SELECT 
    TABLE_NAME AS nombre_tabla,
    TABLE_ROWS AS cantidad_registros
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'codi_ejamtest'
ORDER BY TABLE_NAME;


-- ============================================
-- CONSULTA CRÍTICA: Ver TODAS las tablas sin filtros
-- ============================================
SHOW TABLES;

-- ============================================
-- Contar cuántas tablas hay en total
-- ============================================
SELECT COUNT(*) AS total_tablas
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'codi_ejamtest';

-- ============================================
-- Ver todas las tablas con información
-- ============================================
SELECT 
    TABLE_NAME AS nombre_tabla,
    TABLE_ROWS AS cantidad_registros
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'codi_ejamtest'
ORDER BY TABLE_NAME;


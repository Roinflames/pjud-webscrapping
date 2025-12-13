-- ============================================
-- EXPORTAR DATOS LIMPIOS - Sin duplicados y con mejor formato
-- ============================================

-- ============================================
-- CONSULTA 1: Datos únicos (sin duplicados) con RIT y caratulado
-- ============================================
SELECT DISTINCT
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    (c.id_causa IS NOT NULL AND c.id_causa != '')
    AND (c.causa_nombre IS NOT NULL AND c.causa_nombre != '')
ORDER BY c.id
LIMIT 500;

-- ============================================
-- CONSULTA 2: Solo registros con RUT (más completos)
-- ============================================
SELECT DISTINCT
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    (c.id_causa IS NOT NULL AND c.id_causa != '')
    AND (c.causa_nombre IS NOT NULL AND c.causa_nombre != '')
    AND (a.rut_cliente IS NOT NULL AND a.rut_cliente != '')
ORDER BY c.id
LIMIT 500;

-- ============================================
-- CONSULTA 3: Exportar en formato JSON-like para análisis
-- ============================================
SELECT DISTINCT
    CONCAT('{') AS inicio_json,
    CONCAT('  "rit": "', COALESCE(c.id_causa, ''), '",') AS rit_json,
    CONCAT('  "competencia": "', COALESCE(CAST(c.materia_estrategia_id AS CHAR), ''), '",') AS competencia_json,
    CONCAT('  "tribunal": "', COALESCE(CAST(c.juzgado_cuenta_id AS CHAR), ''), '",') AS tribunal_json,
    CONCAT('  "tipoCausa": "', COALESCE(SUBSTRING_INDEX(c.id_causa, '-', 1), ''), '",') AS tipoCausa_json,
    CONCAT('  "caratulado": "', COALESCE(REPLACE(c.causa_nombre, '"', '\"'), ''), '",') AS caratulado_json,
    CONCAT('  "cliente": "', COALESCE(REPLACE(a.nombre_cliente, '"', '\"'), ''), '",') AS cliente_json,
    CONCAT('  "rut": "', COALESCE(a.rut_cliente, ''), '",') AS rut_json,
    CONCAT('  "abogado_id": "', COALESCE(CAST(a.abogado_id AS CHAR), ''), '",') AS abogado_id_json,
    CONCAT('  "juzgado_cuenta_id": "', COALESCE(CAST(a.cuenta_id AS CHAR), ''), '",') AS juzgado_cuenta_id_json,
    CONCAT('  "causa_id": ', c.id, ',') AS causa_id_json,
    CONCAT('  "agenda_id": ', a.id) AS agenda_id_json,
    CONCAT('}') AS fin_json
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    (c.id_causa IS NOT NULL AND c.id_causa != '')
    AND (c.causa_nombre IS NOT NULL AND c.causa_nombre != '')
ORDER BY c.id
LIMIT 100;

-- ============================================
-- CONSULTA 4: Datos en formato CSV-like (más simple)
-- ============================================
SELECT DISTINCT
    c.id_causa AS rit,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    SUBSTRING_INDEX(c.id_causa, '-', 1) AS tipoCausa,
    c.causa_nombre AS caratulado,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id AS juzgado_cuenta_id_agenda,
    c.id AS causa_id,
    a.id AS agenda_id
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    (c.id_causa IS NOT NULL AND c.id_causa != '')
    AND (c.causa_nombre IS NOT NULL AND c.causa_nombre != '')
ORDER BY c.id
LIMIT 1000;

-- ============================================
-- CONSULTA 5: Solo los mejores registros (con más campos llenos)
-- ============================================
SELECT DISTINCT
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
    -- Calcular completitud
    (CASE WHEN c.id_causa IS NOT NULL AND c.id_causa != '' THEN 1 ELSE 0 END +
     CASE WHEN c.causa_nombre IS NOT NULL AND c.causa_nombre != '' THEN 1 ELSE 0 END +
     CASE WHEN c.juzgado_cuenta_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN a.nombre_cliente IS NOT NULL AND a.nombre_cliente != '' THEN 1 ELSE 0 END +
     CASE WHEN a.rut_cliente IS NOT NULL AND a.rut_cliente != '' THEN 1 ELSE 0 END +
     CASE WHEN a.abogado_id IS NOT NULL THEN 1 ELSE 0 END) AS completitud
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    (c.id_causa IS NOT NULL AND c.id_causa != '')
    AND (c.causa_nombre IS NOT NULL AND c.causa_nombre != '')
ORDER BY completitud DESC, c.id
LIMIT 500;

-- ============================================
-- CONSULTA 6: Extraer tipoCausa del RIT (si está en formato C-XXXX-YYYY)
-- ============================================
SELECT DISTINCT
    c.id AS causa_id,
    c.id_causa AS rit,
    SUBSTRING_INDEX(c.id_causa, '-', 1) AS tipoCausa_extraido,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    (c.id_causa IS NOT NULL AND c.id_causa != '')
    AND (c.causa_nombre IS NOT NULL AND c.causa_nombre != '')
    AND c.id_causa LIKE '%-%-%'  -- Formato: X-XXXX-YYYY
ORDER BY c.id
LIMIT 500;

-- ============================================
-- CONSULTA 7: Estadísticas por tipo de RIT
-- ============================================
SELECT 
    SUBSTRING_INDEX(c.id_causa, '-', 1) AS tipoCausa,
    COUNT(DISTINCT c.id) AS cantidad_causas,
    COUNT(DISTINCT CASE WHEN a.rut_cliente IS NOT NULL AND a.rut_cliente != '' THEN c.id END) AS con_rut,
    COUNT(DISTINCT CASE WHEN c.juzgado_cuenta_id IS NOT NULL THEN c.id END) AS con_tribunal
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    (c.id_causa IS NOT NULL AND c.id_causa != '')
    AND c.id_causa LIKE '%-%-%'
GROUP BY SUBSTRING_INDEX(c.id_causa, '-', 1)
ORDER BY cantidad_causas DESC;


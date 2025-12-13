-- ============================================
-- EXPORTAR TODOS LOS REGISTROS CON RIT Y CARATULADO
-- Sin límites restrictivos
-- ============================================

-- ============================================
-- CONSULTA 1: TODOS los registros con RIT y caratulado (sin límite)
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
ORDER BY c.id;

-- ============================================
-- CONSULTA 2: Con tipoCausa extraído del RIT
-- ============================================
SELECT DISTINCT
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    SUBSTRING_INDEX(c.id_causa, '-', 1) AS tipoCausa,
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
ORDER BY c.id;

-- ============================================
-- CONSULTA 3: Contar cuántos registros hay en total
-- ============================================
SELECT 
    COUNT(DISTINCT c.id) AS total_registros_con_rit_y_caratulado
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    (c.id_causa IS NOT NULL AND c.id_causa != '')
    AND (c.causa_nombre IS NOT NULL AND c.causa_nombre != '');

-- ============================================
-- CONSULTA 4: Exportar en formato CSV (para copiar/pegar)
-- ============================================
SELECT DISTINCT
    CONCAT(
        c.id_causa, ',',
        COALESCE(CAST(c.materia_estrategia_id AS CHAR), ''), ',',
        COALESCE(CAST(c.juzgado_cuenta_id AS CHAR), ''), ',',
        SUBSTRING_INDEX(c.id_causa, '-', 1), ',',
        REPLACE(REPLACE(c.causa_nombre, ',', ';'), '"', '""'), ',',
        REPLACE(REPLACE(a.nombre_cliente, ',', ';'), '"', '""'), ',',
        COALESCE(a.rut_cliente, ''), ',',
        COALESCE(CAST(a.abogado_id AS CHAR), ''), ',',
        COALESCE(CAST(a.cuenta_id AS CHAR), ''), ',',
        c.id, ',',
        a.id
    ) AS csv_line
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    (c.id_causa IS NOT NULL AND c.id_causa != '')
    AND (c.causa_nombre IS NOT NULL AND c.causa_nombre != '')
ORDER BY c.id;

-- ============================================
-- CONSULTA 5: Exportar en lotes (para evitar timeouts)
-- Lote 1: IDs 1-10000
-- ============================================
SELECT DISTINCT
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    SUBSTRING_INDEX(c.id_causa, '-', 1) AS tipoCausa,
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
    AND c.id BETWEEN 1 AND 10000
ORDER BY c.id;

-- ============================================
-- CONSULTA 6: Lote 2: IDs 10001-20000
-- ============================================
SELECT DISTINCT
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    SUBSTRING_INDEX(c.id_causa, '-', 1) AS tipoCausa,
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
    AND c.id BETWEEN 10001 AND 20000
ORDER BY c.id;

-- ============================================
-- CONSULTA 7: Lote 3: IDs 20001-30000
-- ============================================
SELECT DISTINCT
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    SUBSTRING_INDEX(c.id_causa, '-', 1) AS tipoCausa,
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
    AND c.id BETWEEN 20001 AND 30000
ORDER BY c.id;

-- ============================================
-- CONSULTA 8: Lote 4: IDs 30001-40000
-- ============================================
SELECT DISTINCT
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    SUBSTRING_INDEX(c.id_causa, '-', 1) AS tipoCausa,
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
    AND c.id BETWEEN 30001 AND 40000
ORDER BY c.id;

-- ============================================
-- CONSULTA 9: Lote 5: IDs 40001-50000
-- ============================================
SELECT DISTINCT
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    SUBSTRING_INDEX(c.id_causa, '-', 1) AS tipoCausa,
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
    AND c.id BETWEEN 40001 AND 50000
ORDER BY c.id;

-- ============================================
-- CONSULTA 10: Lote 6: IDs 50001-61539 (o más)
-- ============================================
SELECT DISTINCT
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    SUBSTRING_INDEX(c.id_causa, '-', 1) AS tipoCausa,
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
    AND c.id >= 50001
ORDER BY c.id;

-- ============================================
-- CONSULTA 11: Usar OFFSET para paginación (alternativa)
-- ============================================
-- Página 1
SELECT DISTINCT
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    SUBSTRING_INDEX(c.id_causa, '-', 1) AS tipoCausa,
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
LIMIT 10000 OFFSET 0;

-- Página 2
-- LIMIT 10000 OFFSET 10000;

-- Página 3
-- LIMIT 10000 OFFSET 20000;

-- etc.


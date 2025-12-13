-- ============================================
-- ANÁLISIS DE CAMPOS - Encontrar registros con datos completos
-- Objetivo: Ver cómo están estructurados los datos para abstraerlos
-- ============================================

-- ============================================
-- CONSULTA 1: Ver todos los registros de CAUSA con campos relevantes llenos
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    c.estado
FROM causa c
WHERE c.id_causa IS NOT NULL 
   AND c.id_causa != ''
   AND c.causa_nombre IS NOT NULL
   AND c.causa_nombre != ''
ORDER BY c.id
LIMIT 100;

-- ============================================
-- CONSULTA 2: Contar cuántos registros tienen cada campo lleno
-- ============================================
SELECT 
    COUNT(*) AS total_registros,
    COUNT(c.id_causa) AS con_rit,
    COUNT(c.causa_nombre) AS con_caratulado,
    COUNT(c.materia_estrategia_id) AS con_competencia,
    COUNT(c.juzgado_cuenta_id) AS con_tribunal,
    COUNT(CASE WHEN c.id_causa IS NOT NULL AND c.id_causa != '' THEN 1 END) AS rit_no_vacio,
    COUNT(CASE WHEN c.causa_nombre IS NOT NULL AND c.causa_nombre != '' THEN 1 END) AS caratulado_no_vacio
FROM causa c;

-- ============================================
-- CONSULTA 3: Ver registros con AGENDA relacionada (cliente, RUT, abogado)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    
    -- Datos de AGENDA
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id AS juzgado_cuenta_id_agenda
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    -- Filtrar solo los que tienen datos relevantes
    (c.id_causa IS NOT NULL AND c.id_causa != '')
    AND (c.causa_nombre IS NOT NULL AND c.causa_nombre != '')
    AND (a.nombre_cliente IS NOT NULL AND a.nombre_cliente != '')
    AND (a.rut_cliente IS NOT NULL AND a.rut_cliente != '')
ORDER BY c.id
LIMIT 100;

-- ============================================
-- CONSULTA 4: Ver ejemplos de diferentes formatos de RIT
-- ============================================
SELECT DISTINCT
    c.id_causa AS rit,
    COUNT(*) AS cantidad
FROM causa c
WHERE c.id_causa IS NOT NULL 
   AND c.id_causa != ''
GROUP BY c.id_causa
ORDER BY cantidad DESC
LIMIT 50;

-- ============================================
-- CONSULTA 5: Ver ejemplos de caratulados
-- ============================================
SELECT DISTINCT
    c.causa_nombre AS caratulado,
    COUNT(*) AS cantidad
FROM causa c
WHERE c.causa_nombre IS NOT NULL 
   AND c.causa_nombre != ''
GROUP BY c.causa_nombre
ORDER BY cantidad DESC
LIMIT 50;

-- ============================================
-- CONSULTA 6: Ver valores únicos de competencia (materia_estrategia_id)
-- ============================================
SELECT DISTINCT
    c.materia_estrategia_id AS competencia,
    COUNT(*) AS cantidad
FROM causa c
WHERE c.materia_estrategia_id IS NOT NULL
GROUP BY c.materia_estrategia_id
ORDER BY c.materia_estrategia_id;

-- ============================================
-- CONSULTA 7: Ver valores únicos de tribunal (juzgado_cuenta_id)
-- ============================================
SELECT DISTINCT
    c.juzgado_cuenta_id AS tribunal,
    COUNT(*) AS cantidad
FROM causa c
WHERE c.juzgado_cuenta_id IS NOT NULL
GROUP BY c.juzgado_cuenta_id
ORDER BY cantidad DESC
LIMIT 50;

-- ============================================
-- CONSULTA 8: Registros COMPLETOS - Todos los campos del JSON llenos
-- ============================================
SELECT 
    -- Campos del JSON
    c.id_causa AS rit,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    c.causa_nombre AS caratulado,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id AS juzgado_cuenta_id_agenda,
    
    -- IDs para relaciones
    c.id AS causa_id,
    a.id AS agenda_id
    
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    -- Todos los campos deben estar llenos
    c.id_causa IS NOT NULL AND c.id_causa != ''
    AND c.causa_nombre IS NOT NULL AND c.causa_nombre != ''
    AND c.materia_estrategia_id IS NOT NULL
    AND c.juzgado_cuenta_id IS NOT NULL
    AND a.nombre_cliente IS NOT NULL AND a.nombre_cliente != ''
    AND a.rut_cliente IS NOT NULL AND a.rut_cliente != ''
    AND a.abogado_id IS NOT NULL
ORDER BY c.id
LIMIT 100;

-- ============================================
-- CONSULTA 9: Ver estructura de datos - Ejemplos variados
-- ============================================
SELECT 
    c.id AS causa_id,
    c.id_causa AS rit,
    LEFT(c.id_causa, 20) AS rit_preview,
    c.causa_nombre AS caratulado,
    LEFT(c.causa_nombre, 50) AS caratulado_preview,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    LEFT(a.nombre_cliente, 30) AS cliente_preview,
    a.rut_cliente AS rut,
    a.abogado_id
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE c.id_causa IS NOT NULL 
   AND c.causa_nombre IS NOT NULL
ORDER BY RAND()
LIMIT 50;

-- ============================================
-- CONSULTA 10: Exportar datos para análisis (formato similar al JSON)
-- ============================================
SELECT 
    CONCAT('"rit": "', COALESCE(c.id_causa, ''), '"') AS rit_json,
    CONCAT('"competencia": "', COALESCE(CAST(c.materia_estrategia_id AS CHAR), ''), '"') AS competencia_json,
    CONCAT('"tribunal": "', COALESCE(CAST(c.juzgado_cuenta_id AS CHAR), ''), '"') AS tribunal_json,
    CONCAT('"caratulado": "', COALESCE(c.causa_nombre, ''), '"') AS caratulado_json,
    CONCAT('"cliente": "', COALESCE(a.nombre_cliente, ''), '"') AS cliente_json,
    CONCAT('"rut": "', COALESCE(a.rut_cliente, ''), '"') AS rut_json,
    CONCAT('"abogado_id": "', COALESCE(CAST(a.abogado_id AS CHAR), ''), '"') AS abogado_id_json,
    CONCAT('"juzgado_cuenta_id": "', COALESCE(CAST(a.cuenta_id AS CHAR), ''), '"') AS juzgado_cuenta_id_json
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    c.id_causa IS NOT NULL 
    AND c.causa_nombre IS NOT NULL
    AND a.nombre_cliente IS NOT NULL
LIMIT 100;


-- ============================================
-- BUSCAR REGISTROS CON LA MAYORÍA DE CAMPOS LLENOS
-- Basado en estadísticas: no todos tienen todos los campos
-- ============================================

-- ============================================
-- CONSULTA 1: Registros con RIT y caratulado (los más importantes)
-- ============================================
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
    a.cuenta_id AS juzgado_cuenta_id_agenda
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    -- RIT no vacío
    (c.id_causa IS NOT NULL AND c.id_causa != '')
    -- Y caratulado no vacío
    AND (c.causa_nombre IS NOT NULL AND c.causa_nombre != '')
ORDER BY c.id
LIMIT 100;

-- ============================================
-- CONSULTA 2: Registros con RIT, caratulado Y cliente
-- ============================================
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
    a.cuenta_id
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    (c.id_causa IS NOT NULL AND c.id_causa != '')
    AND (c.causa_nombre IS NOT NULL AND c.causa_nombre != '')
    AND (a.nombre_cliente IS NOT NULL AND a.nombre_cliente != '')
ORDER BY c.id
LIMIT 100;

-- ============================================
-- CONSULTA 3: Registros con RIT, caratulado, cliente Y RUT
-- ============================================
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
    a.cuenta_id
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    (c.id_causa IS NOT NULL AND c.id_causa != '')
    AND (c.causa_nombre IS NOT NULL AND c.causa_nombre != '')
    AND (a.nombre_cliente IS NOT NULL AND a.nombre_cliente != '')
    AND (a.rut_cliente IS NOT NULL AND a.rut_cliente != '')
ORDER BY c.id
LIMIT 100;

-- ============================================
-- CONSULTA 4: Registros con tribunal (juzgado_cuenta_id) lleno
-- ============================================
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
    a.cuenta_id
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    c.juzgado_cuenta_id IS NOT NULL
    AND (c.id_causa IS NOT NULL AND c.id_causa != '')
    AND (c.causa_nombre IS NOT NULL AND c.causa_nombre != '')
ORDER BY c.id
LIMIT 100;

-- ============================================
-- CONSULTA 5: Exportar datos - Formato para análisis
-- Solo campos que existen (sin filtros estrictos)
-- ============================================
SELECT 
    c.id_causa AS rit,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
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
    -- Al menos RIT o caratulado deben estar
    ((c.id_causa IS NOT NULL AND c.id_causa != '')
     OR (c.causa_nombre IS NOT NULL AND c.causa_nombre != ''))
ORDER BY c.id
LIMIT 500;

-- ============================================
-- CONSULTA 6: Ver ejemplos de registros con diferentes combinaciones
-- ============================================
SELECT 
    CASE 
        WHEN c.id_causa IS NOT NULL AND c.id_causa != '' THEN 'Sí' 
        ELSE 'No' 
    END AS tiene_rit,
    CASE 
        WHEN c.causa_nombre IS NOT NULL AND c.causa_nombre != '' THEN 'Sí' 
        ELSE 'No' 
    END AS tiene_caratulado,
    CASE 
        WHEN c.juzgado_cuenta_id IS NOT NULL THEN 'Sí' 
        ELSE 'No' 
    END AS tiene_tribunal,
    CASE 
        WHEN a.nombre_cliente IS NOT NULL AND a.nombre_cliente != '' THEN 'Sí' 
        ELSE 'No' 
    END AS tiene_cliente,
    CASE 
        WHEN a.rut_cliente IS NOT NULL AND a.rut_cliente != '' THEN 'Sí' 
        ELSE 'No' 
    END AS tiene_rut,
    COUNT(*) AS cantidad
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
GROUP BY 
    tiene_rit,
    tiene_caratulado,
    tiene_tribunal,
    tiene_cliente,
    tiene_rut
ORDER BY cantidad DESC;

-- ============================================
-- CONSULTA 7: Registros con mejor calidad de datos
-- Prioridad: RIT + caratulado + cliente + RUT
-- ============================================
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
    -- Calcular "score" de completitud
    (CASE WHEN c.id_causa IS NOT NULL AND c.id_causa != '' THEN 1 ELSE 0 END +
     CASE WHEN c.causa_nombre IS NOT NULL AND c.causa_nombre != '' THEN 1 ELSE 0 END +
     CASE WHEN c.juzgado_cuenta_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN a.nombre_cliente IS NOT NULL AND a.nombre_cliente != '' THEN 1 ELSE 0 END +
     CASE WHEN a.rut_cliente IS NOT NULL AND a.rut_cliente != '' THEN 1 ELSE 0 END) AS completitud_score
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    -- Al menos RIT o caratulado
    ((c.id_causa IS NOT NULL AND c.id_causa != '')
     OR (c.causa_nombre IS NOT NULL AND c.causa_nombre != ''))
ORDER BY completitud_score DESC, c.id
LIMIT 200;


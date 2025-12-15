-- ============================================
-- BUSCAR CAUSAS CIVILES (competencia = 3)
-- Filtradas según pjud_config.json
-- ============================================

USE codi_ejamtest;

-- ============================================
-- BÚSQUEDA 1: Causas Civiles por RIT
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    c.estado,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.email_cliente,
    a.telefono_cliente,
    a.abogado_id,
    a.cuenta_id
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.materia_estrategia_id = 3
  AND (
    c.id_causa = '16707-2019'
    OR c.id_causa LIKE '%16707-2019%'
    OR c.id_causa LIKE '%C-16707-2019%'
  )
ORDER BY c.id DESC
LIMIT 50;

-- ============================================
-- BÚSQUEDA 2: Causas Civiles por RUT
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
    a.email_cliente,
    a.telefono_cliente,
    a.abogado_id
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.materia_estrategia_id = 3
  AND (
    a.rut_cliente LIKE '%84629618%'
    OR a.rut_cliente LIKE '%8462961-8%'
    OR a.rut_cliente LIKE '%8.462.961-8%'
  )
ORDER BY c.id DESC
LIMIT 50;

-- ============================================
-- BÚSQUEDA 3: Causas Civiles por Nombre Cliente
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
    a.email_cliente,
    a.telefono_cliente,
    a.abogado_id
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.materia_estrategia_id = 3
  AND (
    a.nombre_cliente LIKE '%Carlos%Domingo%Gutierrez%Ramos%'
    OR a.nombre_cliente LIKE '%Carlos%Gutierrez%Ramos%'
    OR a.nombre_cliente LIKE '%Carlos%Gutierrez%'
  )
ORDER BY c.id DESC
LIMIT 50;

-- ============================================
-- BÚSQUEDA 4: Causas Civiles por Caratulado
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
    a.abogado_id
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.materia_estrategia_id = 3
  AND (
    c.causa_nombre LIKE '%27%Juzgado%Civil%de%Santiago%'
    OR c.causa_nombre LIKE '%Juzgado%Civil%Santiago%'
    OR c.causa_nombre LIKE '%Santiago%'
  )
ORDER BY c.id DESC
LIMIT 50;

-- ============================================
-- BÚSQUEDA 5: Causas Civiles por Tribunal
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
    a.abogado_id
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.materia_estrategia_id = 3
  AND c.juzgado_cuenta_id = 276
ORDER BY c.id DESC
LIMIT 50;

-- ============================================
-- BÚSQUEDA 6: BÚSQUEDA COMBINADA (Todos los criterios)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    c.estado,
    a.id AS agenda_id_completo,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.email_cliente,
    a.telefono_cliente,
    a.abogado_id,
    a.cuenta_id,
    a.campania,
    a.fecha_carga,
    a.status_id,
    a.monto
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.materia_estrategia_id = 3
  AND (
    -- Por RIT
    c.id_causa = '16707-2019'
    OR c.id_causa LIKE '%16707-2019%'
    OR c.id_causa LIKE '%C-16707-2019%'
    OR c.id_causa LIKE '%16707%2019%'
    -- Por RUT
    OR a.rut_cliente LIKE '%84629618%'
    OR a.rut_cliente LIKE '%8462961-8%'
    OR a.rut_cliente LIKE '%8.462.961-8%'
    -- Por nombre
    OR a.nombre_cliente LIKE '%Carlos%Domingo%Gutierrez%Ramos%'
    OR a.nombre_cliente LIKE '%Carlos%Gutierrez%Ramos%'
    -- Por caratulado
    OR c.causa_nombre LIKE '%27%Juzgado%Civil%de%Santiago%'
    OR c.causa_nombre LIKE '%Juzgado%Civil%Santiago%'
    -- Por tribunal
    OR c.juzgado_cuenta_id = 276
  )
ORDER BY c.id DESC
LIMIT 50;

-- ============================================
-- RESUMEN: Contar causas civiles con datos
-- ============================================
SELECT 
    COUNT(*) AS total_causas_civiles,
    COUNT(CASE WHEN c.id_causa IS NOT NULL AND c.id_causa != '' THEN 1 END) AS con_rit,
    COUNT(CASE WHEN c.causa_nombre IS NOT NULL AND c.causa_nombre != '' THEN 1 END) AS con_caratulado,
    COUNT(CASE WHEN c.juzgado_cuenta_id IS NOT NULL THEN 1 END) AS con_tribunal,
    COUNT(CASE WHEN a.nombre_cliente IS NOT NULL AND a.nombre_cliente != '' THEN 1 END) AS con_cliente,
    COUNT(CASE WHEN a.rut_cliente IS NOT NULL AND a.rut_cliente != '' THEN 1 END) AS con_rut
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.materia_estrategia_id = 3;



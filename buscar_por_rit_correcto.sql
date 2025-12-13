-- ============================================
-- BUSCAR CAUSAS POR RIT (Todas las que tienen RIT son civiles)
-- ============================================

USE codi_ejamtest;

-- ============================================
-- BÚSQUEDA 1: Buscar RIT específico (16707-2019)
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
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.id_causa = '16707-2019'
   OR c.id_causa LIKE '%16707-2019%'
   OR c.id_causa LIKE '%C-16707-2019%'
   OR c.id_causa LIKE '%16707%2019%'
ORDER BY c.id DESC
LIMIT 20;

-- ============================================
-- BÚSQUEDA 2: Buscar por parte del RIT (solo 16707)
-- ============================================
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
WHERE c.id_causa LIKE '%16707%'
ORDER BY c.id DESC
LIMIT 20;

-- ============================================
-- BÚSQUEDA 3: Buscar por RUT (todas las causas con RIT son civiles)
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
WHERE c.id_causa IS NOT NULL
  AND c.id_causa != ''
  AND (
    a.rut_cliente LIKE '%84629618%'
    OR a.rut_cliente LIKE '%8462961-8%'
    OR a.rut_cliente LIKE '%8.462.961-8%'
  )
ORDER BY c.id DESC
LIMIT 20;

-- ============================================
-- BÚSQUEDA 4: Buscar por nombre (todas las causas con RIT son civiles)
-- ============================================
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
WHERE c.id_causa IS NOT NULL
  AND c.id_causa != ''
  AND (
    a.nombre_cliente LIKE '%Carlos%Domingo%Gutierrez%Ramos%'
    OR a.nombre_cliente LIKE '%Carlos%Gutierrez%Ramos%'
    OR a.nombre_cliente LIKE '%Carlos%Gutierrez%'
  )
ORDER BY c.id DESC
LIMIT 20;

-- ============================================
-- BÚSQUEDA 5: Buscar por tribunal 276 (todas las causas con RIT son civiles)
-- ============================================
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
WHERE c.id_causa IS NOT NULL
  AND c.id_causa != ''
  AND c.juzgado_cuenta_id = 276
ORDER BY c.id DESC
LIMIT 20;

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
WHERE c.id_causa IS NOT NULL
  AND c.id_causa != ''
  AND (
    c.id_causa = '16707-2019'
    OR c.id_causa LIKE '%16707-2019%'
    OR c.id_causa LIKE '%C-16707-2019%'
    OR c.id_causa LIKE '%16707%2019%'
    OR a.rut_cliente LIKE '%84629618%'
    OR a.rut_cliente LIKE '%8462961-8%'
    OR a.rut_cliente LIKE '%8.462.961-8%'
    OR a.nombre_cliente LIKE '%Carlos%Domingo%Gutierrez%Ramos%'
    OR a.nombre_cliente LIKE '%Carlos%Gutierrez%Ramos%'
    OR c.causa_nombre LIKE '%27%Juzgado%Civil%de%Santiago%'
    OR c.causa_nombre LIKE '%Juzgado%Civil%Santiago%'
    OR c.juzgado_cuenta_id = 276
  )
ORDER BY c.id DESC
LIMIT 50;


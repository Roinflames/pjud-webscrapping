-- ============================================
-- EXPLORAR DATOS - Búsquedas más amplias
-- ============================================

USE codi_ejamtest;

-- ============================================
-- EXPLORACIÓN 1: Buscar por partes del RIT
-- ============================================
SELECT 
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.materia_estrategia_id = 3
  AND c.id_causa LIKE '%16707%'
ORDER BY c.id DESC
LIMIT 20;

-- ============================================
-- EXPLORACIÓN 2: Buscar por partes del RUT
-- ============================================
SELECT 
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.materia_estrategia_id = 3
  AND a.rut_cliente LIKE '%846296%'
ORDER BY c.id DESC
LIMIT 20;

-- ============================================
-- EXPLORACIÓN 3: Buscar por partes del nombre
-- ============================================
SELECT 
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.materia_estrategia_id = 3
  AND (
    a.nombre_cliente LIKE '%Carlos%'
    OR a.nombre_cliente LIKE '%Gutierrez%'
    OR a.nombre_cliente LIKE '%Ramos%'
  )
ORDER BY c.id DESC
LIMIT 20;

-- ============================================
-- EXPLORACIÓN 4: Buscar por tribunal 276
-- ============================================
SELECT 
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.materia_estrategia_id = 3
  AND c.juzgado_cuenta_id = 276
ORDER BY c.id DESC
LIMIT 20;

-- ============================================
-- EXPLORACIÓN 5: Ver todas las causas civiles con RIT
-- ============================================
SELECT 
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.materia_estrategia_id = 3
  AND c.id_causa IS NOT NULL
  AND c.id_causa != ''
ORDER BY c.id DESC
LIMIT 50;

-- ============================================
-- EXPLORACIÓN 6: Buscar por caratulado (Santiago)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.materia_estrategia_id = 3
  AND c.causa_nombre LIKE '%Santiago%'
ORDER BY c.id DESC
LIMIT 20;



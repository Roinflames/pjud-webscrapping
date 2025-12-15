-- ============================================
-- BUSCAR CAUSAS CIVILES CON RIT Y TRIBUNAL
-- Para validar el scraping
-- ============================================

USE codi_ejamtest;

-- ============================================
-- BÚSQUEDA 1: Causas civiles con RIT y tribunal (para scraping)
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
WHERE c.materia_estrategia_id = 3
  AND c.id_causa IS NOT NULL
  AND c.id_causa != ''
  AND c.juzgado_cuenta_id IS NOT NULL
ORDER BY c.id DESC
LIMIT 50;

-- ============================================
-- BÚSQUEDA 2: Buscar RIT específico del config (16707-2019)
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
  AND c.id_causa LIKE '%16707%'
  AND c.juzgado_cuenta_id IS NOT NULL
ORDER BY c.id DESC
LIMIT 10;

-- ============================================
-- BÚSQUEDA 3: Verificar si el RIT tiene formato con tipo (C-16707-2019)
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
    c.id_causa LIKE 'C-%16707%'
    OR c.id_causa LIKE '%C-16707%'
    OR c.id_causa LIKE '%16707-2019%'
  )
  AND c.juzgado_cuenta_id IS NOT NULL
ORDER BY c.id DESC
LIMIT 10;

-- ============================================
-- BÚSQUEDA 4: Contar causas civiles con RIT y tribunal
-- ============================================
SELECT 
    COUNT(*) AS total_civiles_con_rit_y_tribunal,
    COUNT(DISTINCT c.juzgado_cuenta_id) AS tribunales_diferentes
FROM causa c
WHERE c.materia_estrategia_id = 3
  AND c.id_causa IS NOT NULL
  AND c.id_causa != ''
  AND c.juzgado_cuenta_id IS NOT NULL;

-- ============================================
-- BÚSQUEDA 5: Ejemplos de causas civiles listas para scraping
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
WHERE c.materia_estrategia_id = 3
  AND c.id_causa IS NOT NULL
  AND c.id_causa != ''
  AND c.causa_nombre IS NOT NULL
  AND c.causa_nombre != ''
  AND c.juzgado_cuenta_id IS NOT NULL
ORDER BY c.id DESC
LIMIT 20;



-- ============================================
-- VERIFICAR QUÉ SIGNIFICA CADA COMPETENCIA
-- ============================================

USE codi_ejamtest;

-- ============================================
-- VERIFICACIÓN 1: Ver todas las competencias diferentes
-- ============================================
SELECT 
    materia_estrategia_id AS competencia,
    COUNT(*) AS total_causas,
    COUNT(CASE WHEN id_causa IS NOT NULL AND id_causa != '' THEN 1 END) AS con_rit,
    COUNT(CASE WHEN causa_nombre IS NOT NULL AND causa_nombre != '' THEN 1 END) AS con_caratulado
FROM causa
GROUP BY materia_estrategia_id
ORDER BY materia_estrategia_id;

-- ============================================
-- VERIFICACIÓN 2: Ver ejemplos de cada competencia
-- ============================================
SELECT 
    materia_estrategia_id AS competencia,
    id_causa AS rit,
    causa_nombre AS caratulado,
    juzgado_cuenta_id AS tribunal
FROM causa
WHERE id_causa IS NOT NULL
  AND id_causa != ''
  AND causa_nombre IS NOT NULL
  AND causa_nombre != ''
GROUP BY materia_estrategia_id, id_causa, causa_nombre, juzgado_cuenta_id
ORDER BY materia_estrategia_id, id
LIMIT 50;

-- ============================================
-- VERIFICACIÓN 3: Ver competencia 3 específicamente
-- ============================================
SELECT 
    id AS causa_id,
    materia_estrategia_id AS competencia,
    id_causa AS rit,
    causa_nombre AS caratulado,
    juzgado_cuenta_id AS tribunal
FROM causa
WHERE materia_estrategia_id = 3
  AND id_causa IS NOT NULL
  AND id_causa != ''
ORDER BY id
LIMIT 20;

-- ============================================
-- VERIFICACIÓN 4: Ver competencia 1 (la que vimos en el ejemplo)
-- ============================================
SELECT 
    id AS causa_id,
    materia_estrategia_id AS competencia,
    id_causa AS rit,
    causa_nombre AS caratulado,
    juzgado_cuenta_id AS tribunal
FROM causa
WHERE materia_estrategia_id = 1
  AND id_causa IS NOT NULL
  AND id_causa != ''
ORDER BY id
LIMIT 20;

-- ============================================
-- VERIFICACIÓN 5: Buscar "Civil" en el caratulado por competencia
-- ============================================
SELECT 
    materia_estrategia_id AS competencia,
    COUNT(*) AS total_con_civil_en_caratulado
FROM causa
WHERE causa_nombre LIKE '%Civil%'
  AND causa_nombre IS NOT NULL
GROUP BY materia_estrategia_id
ORDER BY materia_estrategia_id;



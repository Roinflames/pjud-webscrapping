-- ============================================
-- PASO 1: Ver estructura REAL de la tabla CAUSA
-- ============================================
DESCRIBE causa;

-- ============================================
-- PASO 2: Ver algunos registros de CAUSA para entender los datos
-- ============================================
SELECT * FROM causa LIMIT 5;

-- ============================================
-- PASO 3: Buscar por id_causa (RIT completo)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.letra AS tipoCausa,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal
FROM causa c
WHERE c.id_causa = '16707-2019'
   OR c.id_causa LIKE '%16707-2019%'
   OR c.id_causa LIKE '%16707%';

-- ============================================
-- PASO 4: Buscar por caratulado
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.letra AS tipoCausa
FROM causa c
WHERE c.causa_nombre LIKE '%27 Juzgado Civil de Santiago%'
   OR c.causa_nombre LIKE '%Juzgado Civil%Santiago%'
   OR c.causa_nombre LIKE '%Santiago%';

-- ============================================
-- PASO 5: Buscar por tipoCausa (letra C)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.letra AS tipoCausa
FROM causa c
WHERE c.letra = 'C';


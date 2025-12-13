-- ============================================
-- BUSCAR DATOS DEL JSON - Basado en estructura real
-- ============================================

-- ============================================
-- CONSULTA 1: Buscar por RIT (16707-2019)
-- Puede estar en formato: "16707-2019", "C-16707-2019", etc.
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
    a.cuenta_id
    
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE c.id_causa = '16707-2019'
   OR c.id_causa = 'C-16707-2019'
   OR c.id_causa LIKE '%16707-2019%'
   OR c.id_causa LIKE '%16707%2019%';

-- ============================================
-- CONSULTA 2: Buscar por "Promotora CMR Falabella" en causa_nombre
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE c.causa_nombre LIKE '%PROMOTORA CMR FALABELLA%'
   OR c.causa_nombre LIKE '%CMR FALABELLA%'
   OR c.causa_nombre LIKE '%Promotora CMR%'
   OR c.causa_nombre LIKE '%CMR%Falabella%';

-- ============================================
-- CONSULTA 3: Buscar por caratulado "27 Juzgado Civil de Santiago"
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE c.causa_nombre LIKE '%27 Juzgado Civil de Santiago%'
   OR c.causa_nombre LIKE '%Juzgado Civil%Santiago%'
   OR c.causa_nombre LIKE '%27%Juzgado%';

-- ============================================
-- CONSULTA 4: Buscar por cliente (RUT o nombre)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE a.nombre_cliente LIKE '%Carlos Domingo Gutierrez Ramos%'
   OR a.nombre_cliente LIKE '%Domingo%Gutierrez%Ramos%'
   OR a.rut_cliente LIKE '%8462961%'
   OR a.rut_cliente LIKE '%8.462.961%';

-- ============================================
-- CONSULTA 5: Buscar por juzgado_cuenta_id = 276 (tribunal del JSON)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE c.juzgado_cuenta_id = 276;

-- ============================================
-- CONSULTA 6: Buscar por materia_estrategia_id = 3 (competencia)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE c.materia_estrategia_id = 3;

-- ============================================
-- CONSULTA 7: BÚSQUEDA COMPLETA - Todos los criterios
-- ============================================
SELECT 
    -- Datos del JSON
    c.id_causa AS rit_json,
    c.materia_estrategia_id AS competencia_json,
    c.juzgado_cuenta_id AS tribunal_json,
    c.causa_nombre AS caratulado_json,
    a.nombre_cliente AS cliente_json,
    a.rut_cliente AS rut_json,
    a.abogado_id AS abogado_id,
    a.cuenta_id AS juzgado_cuenta_id,
    
    -- IDs para relaciones
    c.id AS causa_id,
    a.id AS agenda_id
    
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    -- RIT: 16707-2019 (diferentes formatos posibles)
    (c.id_causa LIKE '%16707%2019%' OR c.id_causa LIKE '%16707-2019%')
    -- Competencia: 3
    AND c.materia_estrategia_id = 3
    -- Tribunal: 276
    AND c.juzgado_cuenta_id = 276
    -- Caratulado: contiene "Juzgado Civil" o "Santiago" o "CMR"
    AND (c.causa_nombre LIKE '%Juzgado Civil%' 
         OR c.causa_nombre LIKE '%Santiago%'
         OR c.causa_nombre LIKE '%CMR%')
    -- Cliente: Carlos Domingo Gutierrez Ramos
    AND a.nombre_cliente LIKE '%Carlos%Domingo%Gutierrez%Ramos%'
    -- RUT: 8.462.961-8
    AND a.rut_cliente LIKE '%8462961%';

-- ============================================
-- CONSULTA 8: Búsqueda más amplia (cualquier criterio)
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
    -- Buscar por RIT
    c.id_causa LIKE '%16707%'
    -- O por CMR Falabella
    OR c.causa_nombre LIKE '%CMR%Falabella%'
    -- O por Juzgado Civil Santiago
    OR c.causa_nombre LIKE '%Juzgado Civil%Santiago%'
    -- O por cliente
    OR a.nombre_cliente LIKE '%Carlos%Gutierrez%Ramos%'
    -- O por RUT
    OR a.rut_cliente LIKE '%8462961%'
    -- O por tribunal
    OR c.juzgado_cuenta_id = 276
    -- O por competencia
    OR c.materia_estrategia_id = 3;


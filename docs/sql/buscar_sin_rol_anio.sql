-- ============================================
-- CONSULTA CORREGIDA - Sin columnas rol y anio
-- ============================================

-- ============================================
-- CONSULTA 1: Buscar por RIT (id_causa)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.letra AS tipoCausa,
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
   OR c.id_causa LIKE '%16707-2019%'
   OR c.id_causa LIKE '%16707%';

-- ============================================
-- CONSULTA 2: Buscar por caratulado
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.letra AS tipoCausa,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE c.causa_nombre LIKE '%27 Juzgado Civil de Santiago%'
   OR c.causa_nombre LIKE '%Juzgado Civil%Santiago%';

-- ============================================
-- CONSULTA 3: Buscar por cliente (RUT o nombre)
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
-- CONSULTA 4: Buscar por tipoCausa (letra C)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.letra AS tipoCausa,
    c.causa_nombre AS caratulado,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE c.letra = 'C';

-- ============================================
-- CONSULTA 5: BUSCAR TODO - Combinando criterios
-- ============================================
SELECT 
    -- RIT
    c.id_causa AS rit_json,
    
    -- Competencia
    c.materia_estrategia_id AS competencia_json,
    
    -- Tribunal
    c.juzgado_cuenta_id AS tribunal_json,
    
    -- tipoCausa
    c.letra AS tipoCausa_json,
    
    -- Cliente
    a.nombre_cliente AS cliente_json,
    
    -- RUT
    a.rut_cliente AS rut_json,
    
    -- Caratulado
    c.causa_nombre AS caratulado_json,
    
    -- Abogado ID
    a.abogado_id AS abogado_id,
    
    -- Cuenta ID (juzgado)
    a.cuenta_id AS juzgado_cuenta_id,
    
    -- IDs para relaciones
    c.id AS causa_id,
    a.id AS agenda_id
    
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    -- RIT: 16707-2019
    (c.id_causa = '16707-2019' OR c.id_causa LIKE '%16707-2019%')
    -- tipoCausa: C
    AND c.letra = 'C'
    -- Caratulado: 27 Juzgado Civil de Santiago
    AND c.causa_nombre LIKE '%Juzgado Civil%Santiago%'
    -- Cliente: Carlos Domingo Gutierrez Ramos
    AND a.nombre_cliente LIKE '%Carlos Domingo Gutierrez Ramos%'
    -- RUT: 8.462.961-8
    AND a.rut_cliente LIKE '%8462961%';

-- ============================================
-- CONSULTA 6: Búsqueda más amplia (cualquier criterio)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.letra AS tipoCausa,
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
    -- O por caratulado
    OR c.causa_nombre LIKE '%Juzgado Civil%Santiago%'
    -- O por tipoCausa
    OR c.letra = 'C'
    -- O por cliente
    OR a.nombre_cliente LIKE '%Carlos%Gutierrez%Ramos%'
    -- O por RUT
    OR a.rut_cliente LIKE '%8462961%';


-- ============================================
-- BUSCAR DATOS DEL JSON pjud_config.json
-- ============================================

-- ============================================
-- CONSULTA 1: Buscar CAUSA por RIT (16707-2019)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit_completo,
    CONCAT(c.rol, '-', c.anio) AS rit_construido,
    c.rol,
    c.anio,
    c.letra AS tipoCausa,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia_posible,
    c.juzgado_cuenta_id,
    c.estado
FROM causa c
WHERE c.id_causa = '16707-2019'
   OR c.id_causa LIKE '%16707-2019%'
   OR (c.rol = '16707' AND c.anio = 2019)
   OR c.rol LIKE '%16707%';

-- ============================================
-- CONSULTA 2: Buscar CAUSA por tipoCausa (C) y caratulado
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.letra AS tipoCausa,
    c.causa_nombre AS caratulado,
    c.rol,
    c.anio
FROM causa c
WHERE c.letra = 'C'
   AND (c.causa_nombre LIKE '%27 Juzgado Civil de Santiago%'
        OR c.causa_nombre LIKE '%Juzgado Civil%Santiago%'
        OR c.causa_nombre LIKE '%Santiago%');

-- ============================================
-- CONSULTA 3: Buscar en AGENDA por cliente y RUT
-- ============================================
SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id,
    a.fecha_contrato
FROM agenda a
WHERE a.nombre_cliente LIKE '%Carlos Domingo Gutierrez Ramos%'
   OR a.nombre_cliente LIKE '%Domingo%Gutierrez%Ramos%'
   OR a.rut_cliente LIKE '%8462961%'
   OR a.rut_cliente LIKE '%8.462.961%';

-- ============================================
-- CONSULTA 4: CONSULTA COMPLETA - Relacionar CAUSA con AGENDA
-- ============================================
SELECT 
    -- Datos de CAUSA
    c.id AS causa_id,
    c.agenda_id,
    COALESCE(c.id_causa, CONCAT(c.rol, '-', c.anio)) AS rit,
    c.rol,
    c.anio,
    c.letra AS tipoCausa,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal_posible,
    
    -- Datos de AGENDA (cliente)
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id AS juzgado_cuenta_id
    
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    -- Buscar por RIT
    (c.id_causa = '16707-2019' 
     OR (c.rol = '16707' AND c.anio = 2019))
    -- O por caratulado
    OR c.causa_nombre LIKE '%27 Juzgado Civil de Santiago%'
    -- O por tipoCausa
    OR c.letra = 'C'
    -- O por cliente
    OR a.nombre_cliente LIKE '%Carlos Domingo Gutierrez Ramos%'
    -- O por RUT
    OR a.rut_cliente LIKE '%8462961%';

-- ============================================
-- CONSULTA 5: Buscar por todos los criterios del JSON
-- ============================================
SELECT 
    -- RIT
    COALESCE(c.id_causa, CONCAT(c.rol, '-', c.anio)) AS rit_json,
    
    -- Competencia (materia_estrategia_id)
    c.materia_estrategia_id AS competencia_json,
    
    -- Tribunal (juzgado_cuenta_id)
    c.juzgado_cuenta_id AS tribunal_json,
    
    -- tipoCausa
    c.letra AS tipoCausa_json,
    
    -- Cliente
    a.nombre_cliente AS cliente_json,
    
    -- RUT
    a.rut_cliente AS rut_json,
    
    -- Caratulado
    c.causa_nombre AS caratulado_json,
    
    -- Abogado (necesitamos buscar en otra tabla)
    a.abogado_id AS abogado_id,
    
    -- Juzgado (necesitamos buscar en otra tabla)
    a.cuenta_id AS juzgado_cuenta_id,
    
    -- Folio (puede estar en otra tabla relacionada)
    -- a.folio AS folio_json  -- Si existe este campo
    
    -- IDs para relaciones
    c.id AS causa_id,
    a.id AS agenda_id
    
FROM causa c
INNER JOIN agenda a ON c.agenda_id = a.id
WHERE 
    -- RIT: 16707-2019
    (c.id_causa = '16707-2019' OR (c.rol = '16707' AND c.anio = 2019))
    -- tipoCausa: C
    AND c.letra = 'C'
    -- Caratulado: 27 Juzgado Civil de Santiago
    AND c.causa_nombre LIKE '%Juzgado Civil%Santiago%'
    -- Cliente: Carlos Domingo Gutierrez Ramos
    AND a.nombre_cliente LIKE '%Carlos Domingo Gutierrez Ramos%'
    -- RUT: 8.462.961-8
    AND a.rut_cliente LIKE '%8462961%';

-- ============================================
-- CONSULTA 6: Ver estructura de CAUSA para confirmar campos
-- ============================================
DESCRIBE causa;

-- ============================================
-- CONSULTA 7: Ver algunos registros de CAUSA
-- ============================================
SELECT * FROM causa LIMIT 5;


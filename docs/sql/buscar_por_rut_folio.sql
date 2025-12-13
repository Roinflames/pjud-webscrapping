-- ============================================
-- CONSULTA 1: Buscar por RUT exacto
-- ============================================
SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id,
    a.fecha_contrato,
    a.observacion,
    a.folio
FROM agenda a
WHERE a.rut_cliente = '8.462.961-8'
   OR a.rut_cliente = '8462961-8'
   OR a.rut_cliente LIKE '%8462961%'
   OR a.rut_cliente LIKE '%8.462.961%';

-- ============================================
-- CONSULTA 2: Buscar por FOLIO
-- ============================================
SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.folio,
    a.abogado_id,
    a.cuenta_id
FROM agenda a
WHERE a.folio = '20212'
   OR a.folio LIKE '%20212%';

-- ============================================
-- CONSULTA 3: Buscar el nombre completo exacto
-- ============================================
SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.folio,
    a.abogado_id,
    a.cuenta_id,
    a.observacion
FROM agenda a
WHERE a.nombre_cliente = 'Carlos Domingo Gutierrez Ramos'
   OR a.nombre_cliente LIKE '%Carlos Domingo Gutierrez Ramos%'
   OR a.nombre_cliente LIKE '%Domingo%Gutierrez%Ramos%';

-- ============================================
-- CONSULTA 4: Ver TODOS los campos de AGENDA para un registro específico
-- ============================================
-- Reemplaza 10924 con el ID que quieras ver
SELECT * FROM agenda WHERE id = 10924;

-- ============================================
-- CONSULTA 5: Ver estructura completa de AGENDA
-- ============================================
DESCRIBE agenda;

-- ============================================
-- CONSULTA 6: Ver TODAS las tablas (IMPORTANTE - ejecuta esto)
-- ============================================
SHOW TABLES;


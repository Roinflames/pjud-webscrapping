-- ============================================
-- CONSULTA 1: Buscar por RUT (sin campo folio)
-- ============================================
SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id,
    a.fecha_contrato,
    a.observacion
FROM agenda a
WHERE a.rut_cliente LIKE '%8462961%'
   OR a.rut_cliente LIKE '%8.462.961%';

-- ============================================
-- CONSULTA 2: Ver TODOS los campos de AGENDA
-- ============================================
DESCRIBE agenda;

-- ============================================
-- CONSULTA 3: Ver un registro completo de AGENDA
-- ============================================
SELECT * FROM agenda WHERE rut_cliente LIKE '%8462961%' LIMIT 1;

-- ============================================
-- CONSULTA 4: Ver TODAS las tablas (MUY IMPORTANTE)
-- ============================================
SHOW TABLES;

-- ============================================
-- CONSULTA 5: Buscar tablas que puedan tener el FOLIO
-- ============================================
SHOW TABLES LIKE '%contrato%';
SHOW TABLES LIKE '%causa%';
SHOW TABLES LIKE '%folio%';
SHOW TABLES LIKE '%rol%';

-- ============================================
-- CONSULTA 6: Buscar por nombre completo del cliente
-- ============================================
SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id
FROM agenda a
WHERE a.nombre_cliente LIKE '%Carlos Domingo Gutierrez Ramos%'
   OR a.nombre_cliente LIKE '%Domingo%Gutierrez%Ramos%';


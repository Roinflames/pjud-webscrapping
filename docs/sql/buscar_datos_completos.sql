-- ============================================
-- PASO 1: Buscar en AGENDA por RUT
-- ============================================
SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id,
    a.fecha_contrato
FROM agenda a
WHERE a.rut_cliente LIKE '%8462961%'
   OR a.rut_cliente LIKE '%8.462.961%';

-- ============================================
-- PASO 2: Ver TODAS las tablas (MUY IMPORTANTE)
-- ============================================
SHOW TABLES;

-- ============================================
-- PASO 3: Buscar tablas que puedan tener FOLIO
-- ============================================
SHOW TABLES LIKE '%contrato%';
SHOW TABLES LIKE '%causa%';
SHOW TABLES LIKE '%rol%';

-- ============================================
-- PASO 4: Si existe tabla "contrato", buscar folio ahí
-- ============================================
-- Ejecuta esto SOLO si existe la tabla "contrato"
-- SELECT * FROM contrato WHERE folio = '20212' OR folio LIKE '%20212%';

-- ============================================
-- PASO 5: Si existe tabla "causa", buscar RIT ahí
-- ============================================
-- Ejecuta esto SOLO si existe la tabla "causa"
-- SELECT * FROM causa WHERE id_causa = '16707-2019' 
--    OR (rol = '16707' AND anio = 2019);

-- ============================================
-- PASO 6: Buscar el ABOGADO por ID
-- ============================================
-- Primero necesitas el abogado_id de la consulta del PASO 1
-- Luego ejecuta (reemplaza X con el abogado_id):
-- SELECT * FROM usuario WHERE id = X;
-- O si la tabla se llama diferente:
-- SHOW TABLES LIKE '%usuario%';
-- SHOW TABLES LIKE '%abogado%';

-- ============================================
-- PASO 7: Buscar la CUENTA (juzgado/compañía)
-- ============================================
-- Primero necesitas el cuenta_id de la consulta del PASO 1
-- Luego ejecuta (reemplaza X con el cuenta_id):
-- SELECT * FROM cuenta WHERE id = X;
-- O si la tabla se llama diferente:
-- SHOW TABLES LIKE '%cuenta%';
-- SHOW TABLES LIKE '%juzgado%';


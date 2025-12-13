-- ============================================
-- CONSULTA 1: Buscar en AGENDA por datos del JSON
-- ============================================
-- La tabla agenda tiene: nombre_cliente, rut_cliente, abogado_id
SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id,
    a.fecha_contrato,
    a.observacion
FROM agenda a
WHERE a.nombre_cliente LIKE '%Carlos Domingo Gutierrez Ramos%'
   OR a.nombre_cliente LIKE '%Carlos%Gutierrez%'
   OR a.rut_cliente LIKE '%8462961%'
   OR a.rut_cliente LIKE '%8.462.961%';

-- ============================================
-- CONSULTA 2: Ver TODAS las tablas (IMPORTANTE)
-- ============================================
-- Ejecuta esto y comparte TODOS los nombres de tablas
SHOW TABLES;

-- ============================================
-- CONSULTA 3: Ver estructura completa de AGENDA
-- ============================================
DESCRIBE agenda;

-- ============================================
-- CONSULTA 4: Ver algunos registros de AGENDA
-- ============================================
SELECT * FROM agenda LIMIT 5;


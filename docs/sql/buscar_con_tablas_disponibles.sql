-- ============================================
-- PROBLEMA: Solo hay 4 tablas importadas
-- Tablas disponibles: agenda, actuacion, actuacion_anexo_procesal, accion
-- ============================================

-- ============================================
-- PASO 1: Buscar en AGENDA por RUT del cliente
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
   OR a.rut_cliente LIKE '%8.462.961%'
   OR a.nombre_cliente LIKE '%Carlos Domingo Gutierrez%'
   OR a.nombre_cliente LIKE '%Domingo%Gutierrez%Ramos%';

-- ============================================
-- PASO 2: Ver estructura de ACTUACION
-- ============================================
DESCRIBE actuacion;

-- ============================================
-- PASO 3: Ver algunos registros de ACTUACION
-- ============================================
SELECT * FROM actuacion LIMIT 10;

-- ============================================
-- PASO 4: Ver cuántos registros hay en cada tabla
-- ============================================
SELECT 'agenda' AS tabla, COUNT(*) AS total FROM agenda
UNION ALL
SELECT 'actuacion' AS tabla, COUNT(*) AS total FROM actuacion
UNION ALL
SELECT 'actuacion_anexo_procesal' AS tabla, COUNT(*) AS total FROM actuacion_anexo_procesal
UNION ALL
SELECT 'accion' AS tabla, COUNT(*) AS total FROM accion;

-- ============================================
-- PASO 5: Buscar en ACTUACION (puede tener datos de causas)
-- ============================================
-- Primero necesitamos ver la estructura
-- Luego podemos buscar por nombre o ID

-- ============================================
-- PASO 6: Verificar si hay datos en AGENDA
-- ============================================
SELECT COUNT(*) AS total_registros FROM agenda;

-- Ver algunos ejemplos
SELECT 
    id,
    nombre_cliente,
    rut_cliente,
    abogado_id,
    cuenta_id
FROM agenda 
LIMIT 10;


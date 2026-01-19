-- ============================================
-- QUERIES RÁPIDAS - Copia y pega en phpMyAdmin
-- ============================================

USE codi_ejamtest;

-- TABLA 1: accion
SELECT * FROM accion WHERE nombre IS NOT NULL AND nombre != '' AND accion IS NOT NULL LIMIT 1;

-- TABLA 2: actuacion
SELECT * FROM actuacion WHERE nombre IS NOT NULL AND nombre != '' AND cuaderno_id IS NOT NULL LIMIT 1;

-- TABLA 3: actuacion_anexo_procesal
SELECT * FROM actuacion_anexo_procesal WHERE actuacion_id IS NOT NULL AND anexo_procesal_id IS NOT NULL LIMIT 1;

-- TABLA 4: agenda
SELECT * FROM agenda WHERE nombre_cliente IS NOT NULL AND nombre_cliente != '' AND rut_cliente IS NOT NULL AND rut_cliente != '' LIMIT 1;

-- TABLA 5: causa
SELECT * FROM causa WHERE id_causa IS NOT NULL AND id_causa != '' AND causa_nombre IS NOT NULL AND causa_nombre != '' LIMIT 1;



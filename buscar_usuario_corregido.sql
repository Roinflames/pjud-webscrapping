-- ============================================
-- BÚSQUEDA CORREGIDA DEL USUARIO
-- (Sin columna folio que no existe en agenda)
-- ============================================

USE codi_ejamtest;

-- BÚSQUEDA COMBINADA (Recomendada)
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
    a.cuenta_id,
    a.email_cliente,
    a.telefono_cliente,
    a.fecha_carga,
    a.fecha_asignado,
    a.status_id
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE (
    c.id_causa = '16707-2019' 
    OR c.id_causa LIKE '%16707-2019%'
    OR c.id_causa LIKE '%16707%2019%'
    OR a.nombre_cliente LIKE '%Carlos%Domingo%Gutierrez%Ramos%'
    OR a.rut_cliente LIKE '%84629618%'
    OR a.rut_cliente LIKE '%8.462.961-8%'
    OR c.causa_nombre LIKE '%27%Juzgado%Civil%de%Santiago%'
    OR (c.juzgado_cuenta_id = 276 AND c.materia_estrategia_id = 3)
)
ORDER BY c.id DESC
LIMIT 50;

-- ============================================
-- BÚSQUEDAS INDIVIDUALES (Si la anterior no encuentra)
-- ============================================

-- Por RIT
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal
FROM causa c
WHERE c.id_causa = '16707-2019' 
   OR c.id_causa LIKE '%16707-2019%'
   OR c.id_causa LIKE '%16707%2019%';

-- Por RUT
SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.email_cliente,
    a.telefono_cliente,
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado
FROM agenda a
LEFT JOIN causa c ON a.id = c.agenda_id
WHERE a.rut_cliente LIKE '%84629618%'
   OR a.rut_cliente LIKE '%8.462.961-8%';

-- Por Nombre
SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.email_cliente,
    a.telefono_cliente,
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado
FROM agenda a
LEFT JOIN causa c ON a.id = c.agenda_id
WHERE a.nombre_cliente LIKE '%Carlos%Domingo%Gutierrez%Ramos%'
   OR a.nombre_cliente LIKE '%Carlos%Gutierrez%';



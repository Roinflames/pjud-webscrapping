-- ============================================
-- BUSCAR USUARIO EN BASE DE DATOS
-- Generado automáticamente desde pjud_config.json
-- Fecha: 2025-12-13T03:54:07.684Z
-- ============================================

USE codi_ejamtest;

-- ============================================
-- BÚSQUEDA 1: Por RIT
-- ============================================

SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    c.estado,
    c.fecha_ultimo_ingreso
FROM causa c
WHERE c.id_causa = '16707-2019'
   OR c.id_causa LIKE '%16707-2019%'
   OR c.id_causa LIKE '%16707%2019%';


-- ============================================
-- BÚSQUEDA 2: Por RIT con datos de AGENDA
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
    a.cuenta_id,
    a.email_cliente,
    a.telefono_cliente,
    a.fecha_carga,
    a.fecha_asignado,
    a.status_id
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.id_causa = '16707-2019'
   OR c.id_causa LIKE '%16707-2019%'
   OR c.id_causa LIKE '%16707%2019%';


-- ============================================
-- BÚSQUEDA 3: Por nombre del cliente
-- ============================================

SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.email_cliente,
    a.telefono_cliente,
    a.abogado_id,
    a.cuenta_id,
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado
FROM agenda a
LEFT JOIN causa c ON a.id = c.agenda_id
WHERE a.nombre_cliente LIKE '%Carlos%Domingo%Gutierrez%Ramos%'
   OR a.nombre_cliente LIKE '%Carlos%Domingo%';


-- ============================================
-- BÚSQUEDA 4: Por RUT
-- ============================================

SELECT 
    a.id AS agenda_id,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.email_cliente,
    a.telefono_cliente,
    a.abogado_id,
    a.cuenta_id,
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal
FROM agenda a
LEFT JOIN causa c ON a.id = c.agenda_id
WHERE a.rut_cliente LIKE '%84629618%'
   OR a.rut_cliente LIKE '%8.462.961-8%';


-- ============================================
-- BÚSQUEDA 5: Por folio (NOTA: columna folio no existe en agenda)
-- Esta búsqueda se eliminó porque la tabla agenda no tiene columna folio
-- Si necesitas buscar por folio, verifica en qué tabla está almacenado
-- ============================================

-- SELECT 
--     a.id AS agenda_id,
--     a.nombre_cliente AS cliente,
--     a.rut_cliente AS rut,
--     a.email_cliente,
--     a.telefono_cliente,
--     a.abogado_id,
--     a.cuenta_id,
--     c.id AS causa_id,
--     c.id_causa AS rit,
--     c.causa_nombre AS caratulado
-- FROM agenda a
-- LEFT JOIN causa c ON a.id = c.agenda_id
-- WHERE a.folio = '20212'
--    OR a.folio LIKE '%20212%';


-- ============================================
-- BÚSQUEDA 6: Por caratulado
-- ============================================

SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.causa_nombre LIKE '%27%Juzgado%Civil%de%Santiago%';


-- ============================================
-- BÚSQUEDA 7: BÚSQUEDA COMBINADA (Todos los criterios)
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
    a.cuenta_id,
    a.email_cliente,
    a.telefono_cliente,
    a.fecha_carga,
    a.fecha_asignado,
    a.status_id
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE (
    c.id_causa = '16707-2019' OR c.id_causa LIKE '%16707-2019%'
    OR a.nombre_cliente LIKE '%Carlos%Domingo%Gutierrez%Ramos%'
    OR a.rut_cliente LIKE '%84629618%'
    OR c.causa_nombre LIKE '%27%Juzgado%Civil%de%Santiago%'
    OR (c.juzgado_cuenta_id = 276 AND c.materia_estrategia_id = 3)
)
ORDER BY c.id DESC;


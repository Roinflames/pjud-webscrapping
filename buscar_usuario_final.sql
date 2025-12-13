-- ============================================
-- BÚSQUEDA DEL USUARIO (pjud_config.json)
-- Basado en la estructura real de las tablas
-- ============================================

USE codi_ejamtest;

-- BÚSQUEDA PRINCIPAL: Por RIT, RUT, Nombre y Caratulado
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    c.estado,
    a.id AS agenda_id_completo,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.email_cliente,
    a.telefono_cliente,
    a.abogado_id,
    a.cuenta_id,
    a.campania,
    a.fecha_carga,
    a.status_id,
    a.monto
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE (
    -- Por RIT (puede estar con o sin tipo)
    c.id_causa = '16707-2019' 
    OR c.id_causa LIKE '%16707-2019%'
    OR c.id_causa LIKE '%C-16707-2019%'
    OR c.id_causa LIKE '%16707%2019%'
    -- Por RUT (sin puntos/guiones)
    OR a.rut_cliente LIKE '%84629618%'
    OR a.rut_cliente LIKE '%8462961-8%'
    OR a.rut_cliente LIKE '%8.462.961-8%'
    -- Por nombre del cliente
    OR a.nombre_cliente LIKE '%Carlos%Domingo%Gutierrez%Ramos%'
    OR a.nombre_cliente LIKE '%Carlos%Gutierrez%Ramos%'
    -- Por caratulado
    OR c.causa_nombre LIKE '%27%Juzgado%Civil%de%Santiago%'
    OR c.causa_nombre LIKE '%Juzgado%Civil%Santiago%'
    -- Por tribunal y competencia
    OR (c.juzgado_cuenta_id = 276 AND c.materia_estrategia_id = 3)
)
ORDER BY c.id DESC
LIMIT 50;


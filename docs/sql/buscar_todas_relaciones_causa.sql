-- ============================================
-- BUSCAR TODAS LAS TABLAS RELACIONADAS CON CAUSA
-- Y EXPORTAR TODOS LOS REGISTROS CON RIT
-- ============================================

-- ============================================
-- PASO 1: Encontrar todas las tablas con causa_id como foreign key
-- ============================================
SELECT 
    TABLE_NAME AS tabla,
    COLUMN_NAME AS columna,
    CONSTRAINT_NAME AS constraint_name,
    REFERENCED_TABLE_NAME AS tabla_referenciada,
    REFERENCED_COLUMN_NAME AS columna_referenciada
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'codi_ejamtest'
    AND (REFERENCED_TABLE_NAME = 'causa' 
         OR COLUMN_NAME LIKE '%causa_id%')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- ============================================
-- PASO 2: Ver todas las tablas que tienen columna causa_id
-- ============================================
SELECT DISTINCT
    TABLE_NAME AS tabla_con_causa_id
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'codi_ejamtest'
    AND COLUMN_NAME LIKE '%causa%'
ORDER BY TABLE_NAME;

-- ============================================
-- CONSULTA 1: TODOS los registros de CAUSA con RIT (id_causa)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    c.estado,
    c.anexo_id,
    c.fecha_ultimo_ingreso,
    c.causa_finalizada,
    c.fecha_finalizado
FROM causa c
WHERE c.id_causa IS NOT NULL 
   AND c.id_causa != ''
ORDER BY c.id;

-- ============================================
-- CONSULTA 2: CAUSA con AGENDA (cliente, RUT, abogado)
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
    a.telefono_cliente
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.id_causa IS NOT NULL 
   AND c.id_causa != ''
ORDER BY c.id;

-- ============================================
-- CONSULTA 3: CAUSA con CAUSA_OBSERVACION (si existe la tabla)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    co.id AS observacion_id,
    co.fecha_registro,
    co.observacion,
    co.usuario_registro_id,
    co.contrato_id
FROM causa c
LEFT JOIN causa_observacion co ON c.id = co.causa_id
WHERE c.id_causa IS NOT NULL 
   AND c.id_causa != ''
ORDER BY c.id, co.fecha_registro DESC;

-- ============================================
-- CONSULTA 4: CAUSA con CAUSA_OBSERVACION_ARCHIVO (si existe)
-- ============================================
SELECT 
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    coa.id AS archivo_id,
    coa.archivo,
    coa.fecha_registro
FROM causa c
LEFT JOIN causa_observacion_archivo coa ON c.id = coa.causa_id
WHERE c.id_causa IS NOT NULL 
   AND c.id_causa != ''
ORDER BY c.id;

-- ============================================
-- CONSULTA 5: TODAS las relaciones - Consulta completa
-- ============================================
SELECT 
    -- Datos de CAUSA
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    c.estado,
    c.causa_finalizada,
    
    -- Datos de AGENDA
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id,
    a.email_cliente,
    a.telefono_cliente,
    
    -- Contar observaciones
    (SELECT COUNT(*) FROM causa_observacion WHERE causa_id = c.id) AS total_observaciones,
    
    -- Contar archivos
    (SELECT COUNT(*) FROM causa_observacion_archivo WHERE causa_id = c.id) AS total_archivos
    
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.id_causa IS NOT NULL 
   AND c.id_causa != ''
ORDER BY c.id;

-- ============================================
-- CONSULTA 6: Exportar en formato simple - Solo RIT y datos básicos
-- ============================================
SELECT 
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.id_causa IS NOT NULL 
   AND c.id_causa != ''
ORDER BY c.id;

-- ============================================
-- CONSULTA 7: Ver estructura de tablas relacionadas
-- ============================================
-- Ejecuta esto para cada tabla relacionada:

-- DESCRIBE causa_observacion;
-- DESCRIBE causa_observacion_archivo;
-- DESCRIBE agenda;

-- ============================================
-- CONSULTA 8: Contar registros con RIT
-- ============================================
SELECT 
    COUNT(*) AS total_causas_con_rit,
    COUNT(DISTINCT c.agenda_id) AS agendas_diferentes,
    COUNT(DISTINCT c.materia_estrategia_id) AS competencias_diferentes,
    COUNT(DISTINCT c.juzgado_cuenta_id) AS tribunales_diferentes
FROM causa c
WHERE c.id_causa IS NOT NULL 
   AND c.id_causa != '';

-- ============================================
-- CONSULTA 9: Ver ejemplos de RITs diferentes
-- ============================================
SELECT DISTINCT
    c.id_causa AS rit,
    COUNT(*) AS cantidad
FROM causa c
WHERE c.id_causa IS NOT NULL 
   AND c.id_causa != ''
GROUP BY c.id_causa
ORDER BY cantidad DESC
LIMIT 100;

-- ============================================
-- CONSULTA 10: Exportar con paginación (10,000 por vez)
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
    a.cuenta_id
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.id_causa IS NOT NULL 
   AND c.id_causa != ''
ORDER BY c.id
LIMIT 10000 OFFSET 0;


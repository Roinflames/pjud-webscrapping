-- ============================================
-- CONSULTAS PARA OBTENER DATOS DE UNA CAUSA
-- Basado en pjud_config.json
-- ============================================

-- ============================================
-- CONSULTA 1: Buscar por Folio
-- ============================================
SELECT 
    -- Datos del contrato/cliente
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente,
    c.rut,
    
    -- Datos de la causa
    ca.id AS causa_id,
    COALESCE(ca.id_causa, CONCAT(ca.rol, '-', ca.anio)) AS rit,
    ca.rol,
    ca.anio,
    ca.letra AS tipoCausa,
    ca.causa_nombre AS caratulado,
    
    -- Datos del abogado
    u_abogado.id AS abogado_id,
    u_abogado.nombre AS abogado,
    
    -- Datos del juzgado
    j.id AS tribunal_id,
    j.nombre AS tribunal_nombre,
    
    -- Datos de la cuenta/compañía
    cuenta.id AS cuenta_id,
    cuenta.nombre AS juzgado_compania
    
FROM contrato c
INNER JOIN agenda a ON c.agenda_id = a.id
INNER JOIN causa ca ON ca.agenda_id = a.id
INNER JOIN usuario u_abogado ON a.abogado_id = u_abogado.id
INNER JOIN cuenta ON a.cuenta_id = cuenta.id
LEFT JOIN contrato_rol cr ON cr.contrato_id = c.id
LEFT JOIN juzgado j ON cr.juzgado_id = j.id
WHERE c.folio = '20212';

-- ============================================
-- CONSULTA 2: Buscar por RUT del Cliente
-- ============================================
SELECT 
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente,
    c.rut,
    COALESCE(ca.id_causa, CONCAT(ca.rol, '-', ca.anio)) AS rit,
    ca.causa_nombre AS caratulado,
    u_abogado.nombre AS abogado,
    j.nombre AS tribunal_nombre,
    cuenta.nombre AS juzgado_compania
FROM contrato c
INNER JOIN agenda a ON c.agenda_id = a.id
INNER JOIN causa ca ON ca.agenda_id = a.id
INNER JOIN usuario u_abogado ON a.abogado_id = u_abogado.id
INNER JOIN cuenta ON a.cuenta_id = cuenta.id
LEFT JOIN contrato_rol cr ON cr.contrato_id = c.id
LEFT JOIN juzgado j ON cr.juzgado_id = j.id
WHERE c.rut = '8.462.961-8';

-- ============================================
-- CONSULTA 3: Buscar por RIT (Rol Único)
-- ============================================
SELECT 
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente,
    c.rut,
    COALESCE(ca.id_causa, CONCAT(ca.rol, '-', ca.anio)) AS rit,
    ca.rol,
    ca.anio,
    ca.letra AS tipoCausa,
    ca.causa_nombre AS caratulado,
    u_abogado.nombre AS abogado,
    j.nombre AS tribunal_nombre,
    cuenta.nombre AS juzgado_compania
FROM contrato c
INNER JOIN agenda a ON c.agenda_id = a.id
INNER JOIN causa ca ON ca.agenda_id = a.id
INNER JOIN usuario u_abogado ON a.abogado_id = u_abogado.id
INNER JOIN cuenta ON a.cuenta_id = cuenta.id
LEFT JOIN contrato_rol cr ON cr.contrato_id = c.id
LEFT JOIN juzgado j ON cr.juzgado_id = j.id
WHERE ca.id_causa = '16707-2019'
   OR (ca.rol = '16707' AND ca.anio = 2019);

-- ============================================
-- CONSULTA 4: Buscar por Nombre del Cliente
-- ============================================
SELECT 
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente,
    c.rut,
    COALESCE(ca.id_causa, CONCAT(ca.rol, '-', ca.anio)) AS rit,
    ca.causa_nombre AS caratulado,
    u_abogado.nombre AS abogado,
    j.nombre AS tribunal_nombre,
    cuenta.nombre AS juzgado_compania
FROM contrato c
INNER JOIN agenda a ON c.agenda_id = a.id
INNER JOIN causa ca ON ca.agenda_id = a.id
INNER JOIN usuario u_abogado ON a.abogado_id = u_abogado.id
INNER JOIN cuenta ON a.cuenta_id = cuenta.id
LEFT JOIN contrato_rol cr ON cr.contrato_id = c.id
LEFT JOIN juzgado j ON cr.juzgado_id = j.id
WHERE c.nombre LIKE '%Carlos Domingo Gutierrez Ramos%';

-- ============================================
-- CONSULTA 5: Usando la Vista Consolidada
-- ============================================
SELECT 
    contrato_id,
    folio,
    cliente,
    rut,
    caratulado,
    rol AS rit,
    cerrador AS abogado,
    cuenta_nombre AS juzgado
FROM vw_causas_activas_final
WHERE folio = '20212'
   OR cliente LIKE '%Carlos Domingo Gutierrez Ramos%';

-- ============================================
-- CONSULTA 6: Obtener Todos los Campos del JSON
-- ============================================
SELECT 
    -- rit
    COALESCE(ca.id_causa, CONCAT(ca.rol, '-', ca.anio)) AS rit,
    
    -- competencia (no existe en BD, podría ser materia_id)
    me.materia_id AS competencia,
    
    -- corte (no existe directamente, usar juzgado_id)
    j.id AS corte,
    
    -- tribunal
    j.id AS tribunal,
    j.nombre AS tribunal_nombre,
    
    -- tipoCausa
    ca.letra AS tipoCausa,
    
    -- cliente
    c.nombre AS cliente,
    
    -- rut
    c.rut,
    
    -- caratulado
    ca.causa_nombre AS caratulado,
    
    -- abogado
    u_abogado.nombre AS abogado,
    
    -- juzgado (nombre del juzgado o cuenta)
    COALESCE(j.nombre, cuenta.nombre) AS juzgado,
    
    -- folio
    c.folio
    
FROM contrato c
INNER JOIN agenda a ON c.agenda_id = a.id
INNER JOIN causa ca ON ca.agenda_id = a.id
INNER JOIN usuario u_abogado ON a.abogado_id = u_abogado.id
INNER JOIN cuenta ON a.cuenta_id = cuenta.id
LEFT JOIN contrato_rol cr ON cr.contrato_id = c.id
LEFT JOIN juzgado j ON cr.juzgado_id = j.id
LEFT JOIN materia_estrategia me ON me.id = ca.materia_estrategia_id
WHERE c.folio = '20212'
   OR c.rut = '8.462.961-8'
   OR ca.id_causa = '16707-2019';

-- ============================================
-- CONSULTA 7: Buscar Juzgado por Nombre
-- ============================================
SELECT 
    j.id AS tribunal_id,
    j.nombre AS tribunal_nombre
FROM juzgado j
WHERE j.nombre LIKE '%Promotora CMR Falabella%'
   OR j.id = 276;

-- ============================================
-- CONSULTA 8: Buscar Abogado por Nombre
-- ============================================
SELECT 
    u.id AS abogado_id,
    u.nombre AS abogado,
    u.correo AS email
FROM usuario u
WHERE u.nombre LIKE '%Tatiana Gonzalez%';

-- ============================================
-- CONSULTA 9: Verificar Estructura de Tablas
-- ============================================
-- Ver campos de la tabla causa
DESCRIBE causa;

-- Ver campos de la tabla contrato
DESCRIBE contrato;

-- Ver campos de la tabla juzgado
DESCRIBE juzgado;

-- Ver campos de la tabla usuario
DESCRIBE usuario;

-- Ver campos de la tabla contrato_rol
DESCRIBE contrato_rol;


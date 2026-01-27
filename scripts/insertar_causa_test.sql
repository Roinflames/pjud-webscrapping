-- ============================================
-- INSERTAR CAUSA DE PRUEBA PARA TESTING
-- RIT: C-213-2023
-- Caratulado: COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI SCM/FISCO DE CHILE (CDE)
-- Tribunal: 1º Juzgado de Letras de Iquique
-- ============================================

USE codi_ejamtest;

-- Primero, buscar el tribunal_id para "1º Juzgado de Letras de Iquique"
-- Si no existe, necesitaremos crearlo o usar un ID existente
SELECT 
    j.id AS tribunal_id,
    j.nombre AS tribunal_nombre
FROM juzgado j
WHERE j.nombre LIKE '%Iquique%'
   OR j.nombre LIKE '%1%Juzgado%Letras%'
ORDER BY j.id
LIMIT 10;

-- Si no encontramos el tribunal, podemos buscar todos los juzgados de Iquique
SELECT 
    j.id AS tribunal_id,
    j.nombre AS tribunal_nombre
FROM juzgado j
WHERE j.nombre LIKE '%Iquique%'
ORDER BY j.id;

-- ============================================
-- INSERTAR CAUSA EN TABLA 'causa'
-- ============================================
-- NOTA: Ajusta los valores según la estructura real de tu tabla
-- Si la tabla tiene campos diferentes, modifica este INSERT

INSERT INTO causa (
    id_causa,           -- RIT completo
    causa_nombre,       -- Caratulado
    materia_estrategia_id,  -- Competencia (3 = Civil)
    juzgado_cuenta_id,  -- Tribunal (necesitamos buscar el ID)
    letra,              -- Tipo causa (C = Civil)
    rol,                -- Rol (213)
    anio,               -- Año (2023)
    estado              -- Estado (1 = activo)
) VALUES (
    'C-213-2023',       -- RIT completo
    'COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI SCM/FISCO DE CHILE (CDE)',  -- Caratulado
    3,                  -- Competencia: Civil
    NULL,               -- Tribunal: NULL por ahora, necesitamos buscar el ID
    'C',                -- Tipo: Civil
    '213',              -- Rol
    2023,               -- Año
    1                   -- Estado: activo
)
ON DUPLICATE KEY UPDATE
    causa_nombre = VALUES(causa_nombre),
    materia_estrategia_id = VALUES(materia_estrategia_id),
    juzgado_cuenta_id = VALUES(juzgado_cuenta_id),
    letra = VALUES(letra),
    rol = VALUES(rol),
    anio = VALUES(anio);

-- ============================================
-- ACTUALIZAR CON EL TRIBUNAL_ID CORRECTO
-- ============================================
-- Ejecuta esto después de encontrar el tribunal_id correcto
-- Reemplaza TRIBUNAL_ID_AQUI con el ID real encontrado arriba

-- UPDATE causa 
-- SET juzgado_cuenta_id = TRIBUNAL_ID_AQUI
-- WHERE id_causa = 'C-213-2023';

-- ============================================
-- VERIFICAR QUE SE INSERTÓ CORRECTAMENTE
-- ============================================
SELECT 
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal_id,
    c.letra AS tipo_causa,
    c.rol,
    c.anio,
    j.nombre AS tribunal_nombre
FROM causa c
LEFT JOIN juzgado j ON c.juzgado_cuenta_id = j.id
WHERE c.id_causa = 'C-213-2023';

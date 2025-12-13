-- ============================================
-- PASO 1: Ver qué tablas existen actualmente
-- ============================================
SHOW TABLES;

-- ============================================
-- PASO 2: Eliminar las tablas existentes (CUIDADO: Esto borra datos)
-- ============================================
-- Ejecuta esto SOLO si quieres empezar de cero
-- Descomenta las líneas que necesites

-- DROP TABLE IF EXISTS `actuacion_anexo_procesal`;
-- DROP TABLE IF EXISTS `actuacion`;
-- DROP TABLE IF EXISTS `agenda`;
-- DROP TABLE IF EXISTS `accion`;
-- DROP TABLE IF EXISTS `causa`;
-- DROP TABLE IF EXISTS `causa_observacion`;
-- DROP TABLE IF EXISTS `causa_observacion_archivo`;
-- ... (y todas las demás)

-- ============================================
-- PASO 3: Verificar si la tabla CAUSA ya existe
-- ============================================
SHOW TABLES LIKE 'causa';

-- Ver estructura de causa si existe
DESCRIBE causa;

-- ============================================
-- PASO 4: Opción más segura - Crear tablas solo si no existen
-- ============================================
-- El SQL debería usar "CREATE TABLE IF NOT EXISTS" 
-- pero los ALTER TABLE pueden fallar si la tabla ya tiene índices

-- ============================================
-- SOLUCIÓN RECOMENDADA: Importar solo las tablas que faltan
-- ============================================
-- En lugar de reimportar todo, podemos crear solo las tablas que faltan


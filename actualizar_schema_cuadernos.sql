-- ============================================
-- Actualización de Schema: Soporte para Cuadernos
-- Compatible con puerto 8000 y /demo
-- ============================================

USE codi_ejamtest;

-- Crear tabla de cuadernos
CREATE TABLE IF NOT EXISTS cuadernos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    causa_id INT(11) UNSIGNED NOT NULL,
    cuaderno_id VARCHAR(10) NOT NULL COMMENT '1=Principal, 2=Ejecutivo, etc.',
    nombre VARCHAR(100) NOT NULL COMMENT 'Nombre del cuaderno',
    total_movimientos INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    KEY idx_causa_id (causa_id),
    UNIQUE KEY uk_causa_cuaderno (causa_id, cuaderno_id),
    CONSTRAINT fk_cuadernos_causa FOREIGN KEY (causa_id) REFERENCES causas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Cuadernos de cada causa';

-- Verificar campos existentes en movimientos
SELECT 'Campos actuales en movimientos:' as mensaje;
SHOW COLUMNS FROM movimientos LIKE '%cuaderno%';
SHOW COLUMNS FROM movimientos LIKE '%pdf%';

-- Actualizar movimientos existentes con valores por defecto
UPDATE movimientos SET
    cuaderno = 'Principal',
    cuaderno_id = '1'
WHERE cuaderno IS NULL OR cuaderno = '';

-- Actualizar movimientos con PDFs de colores basándose en los existentes
UPDATE movimientos SET
    pdf_azul = pdf_principal
WHERE pdf_principal IS NOT NULL AND pdf_azul IS NULL;

UPDATE movimientos SET
    pdf_rojo = pdf_anexo
WHERE pdf_anexo IS NOT NULL AND pdf_rojo IS NULL;

-- Insertar cuadernos para las causas existentes
INSERT INTO cuadernos (causa_id, cuaderno_id, nombre, total_movimientos)
SELECT
    c.id,
    '1' as cuaderno_id,
    'Principal' as nombre,
    COUNT(m.id) as total_movimientos
FROM causas c
LEFT JOIN movimientos m ON c.id = m.causa_id
GROUP BY c.id
ON DUPLICATE KEY UPDATE total_movimientos = VALUES(total_movimientos);

-- Verificar resultados
SELECT 'Cuadernos creados:' as mensaje;
SELECT c.rit, cu.cuaderno_id, cu.nombre, cu.total_movimientos
FROM cuadernos cu
JOIN causas c ON cu.causa_id = c.id;

SELECT '\nMovimientos con cuadernos:' as mensaje;
SELECT
    m.rit,
    m.cuaderno,
    m.cuaderno_id,
    COUNT(*) as total
FROM movimientos m
GROUP BY m.rit, m.cuaderno_id;

SELECT '\nPDFs por color:' as mensaje;
SELECT
    rit,
    COUNT(CASE WHEN pdf_azul IS NOT NULL THEN 1 END) as pdfs_azules,
    COUNT(CASE WHEN pdf_rojo IS NOT NULL THEN 1 END) as pdfs_rojos
FROM movimientos
GROUP BY rit;

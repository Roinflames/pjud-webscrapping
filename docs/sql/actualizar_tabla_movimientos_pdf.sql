-- ============================================
-- Script para agregar campos de PDF base64 a la tabla movimientos
-- Permite almacenar PDFs directamente en la base de datos
-- ============================================

-- Agregar columnas para almacenar PDFs en base64
ALTER TABLE movimientos
    ADD COLUMN IF NOT EXISTS pdf_principal_base64 LONGTEXT COMMENT 'PDF principal (azul) en base64',
    ADD COLUMN IF NOT EXISTS pdf_anexo_base64 LONGTEXT COMMENT 'PDF anexo (rojo) en base64',
    ADD COLUMN IF NOT EXISTS pdf_principal_nombre VARCHAR(255) COMMENT 'Nombre del archivo PDF principal',
    ADD COLUMN IF NOT EXISTS pdf_anexo_nombre VARCHAR(255) COMMENT 'Nombre del archivo PDF anexo';

-- Índice para búsqueda de movimientos con PDF
CREATE INDEX IF NOT EXISTS idx_tiene_pdf ON movimientos(tiene_pdf);

-- ============================================
-- Crear tabla separada para PDFs (alternativa más eficiente)
-- Esto es opcional, pero recomendado para mejor rendimiento
-- ============================================

CREATE TABLE IF NOT EXISTS movimientos_pdf (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Relación con movimiento
    movimiento_id INT NOT NULL,
    rit VARCHAR(255) NOT NULL,
    indice INT NOT NULL,

    -- Tipo de PDF
    tipo ENUM('principal', 'anexo') NOT NULL COMMENT 'principal=azul, anexo=rojo',

    -- Datos del PDF
    nombre_archivo VARCHAR(255) NOT NULL,
    contenido_base64 LONGTEXT NOT NULL,
    tamano_bytes INT COMMENT 'Tamaño original del archivo en bytes',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Índices
    UNIQUE KEY uk_movimiento_tipo (movimiento_id, tipo),
    INDEX idx_rit (rit),
    INDEX idx_rit_indice (rit, indice),

    -- Foreign key (opcional, descomentar si la tabla movimientos existe)
    -- FOREIGN KEY (movimiento_id) REFERENCES movimientos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Vista para consultar movimientos con sus PDFs
-- ============================================

CREATE OR REPLACE VIEW v_movimientos_con_pdf AS
SELECT
    m.*,
    pp.contenido_base64 AS pdf_principal_base64,
    pp.nombre_archivo AS pdf_principal_nombre,
    pa.contenido_base64 AS pdf_anexo_base64,
    pa.nombre_archivo AS pdf_anexo_nombre
FROM movimientos m
LEFT JOIN movimientos_pdf pp ON m.id = pp.movimiento_id AND pp.tipo = 'principal'
LEFT JOIN movimientos_pdf pa ON m.id = pa.movimiento_id AND pa.tipo = 'anexo';

-- ============================================
-- Verificar cambios
-- ============================================

DESCRIBE movimientos;
DESCRIBE movimientos_pdf;

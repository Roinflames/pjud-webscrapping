-- ============================================
-- Script para crear tabla de movimientos
-- Compatible con los datos estructurados del scraping
-- ============================================

CREATE TABLE IF NOT EXISTS movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificación de la causa
    rit VARCHAR(255) NOT NULL,
    indice INT NOT NULL,
    
    -- Información de la causa
    fecha VARCHAR(255),
    caratulado TEXT,
    juzgado VARCHAR(255),
    folio VARCHAR(255),
    
    -- Información del movimiento
    tipo_movimiento VARCHAR(255),
    subtipo_movimiento VARCHAR(255),
    descripcion TEXT,
    
    -- Estado del documento PDF
    tiene_pdf BOOLEAN DEFAULT FALSE,
    
    -- Datos adicionales
    observaciones TEXT,
    raw_data JSON,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para búsquedas rápidas
    UNIQUE KEY uk_rit_indice (rit, indice),
    INDEX idx_rit (rit),
    INDEX idx_fecha (fecha),
    INDEX idx_tipo_movimiento (tipo_movimiento),
    INDEX idx_tiene_pdf (tiene_pdf),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Comentarios de campos
-- ============================================

ALTER TABLE movimientos 
    MODIFY COLUMN rit VARCHAR(255) COMMENT 'RIT de la causa (ej: C-3030-2017)',
    MODIFY COLUMN indice INT COMMENT 'Número de índice del movimiento (orden en la causa)',
    MODIFY COLUMN fecha VARCHAR(255) COMMENT 'Fecha del movimiento (formato: DD/MM/YYYY)',
    MODIFY COLUMN caratulado TEXT COMMENT 'Caratulado de la causa',
    MODIFY COLUMN juzgado VARCHAR(255) COMMENT 'Nombre del juzgado',
    MODIFY COLUMN folio VARCHAR(255) COMMENT 'Número de folio del movimiento',
    MODIFY COLUMN tipo_movimiento VARCHAR(255) COMMENT 'Tipo principal del movimiento',
    MODIFY COLUMN subtipo_movimiento VARCHAR(255) COMMENT 'Subtipo del movimiento',
    MODIFY COLUMN descripcion TEXT COMMENT 'Descripción detallada del movimiento',
    MODIFY COLUMN tiene_pdf BOOLEAN COMMENT 'Indica si el movimiento tiene PDF asociado',
    MODIFY COLUMN observaciones TEXT COMMENT 'Observaciones adicionales',
    MODIFY COLUMN raw_data JSON COMMENT 'Datos crudos del movimiento (para referencia)';

-- ============================================
-- Verificar que la tabla se creó correctamente
-- ============================================

SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME,
    UPDATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'movimientos';

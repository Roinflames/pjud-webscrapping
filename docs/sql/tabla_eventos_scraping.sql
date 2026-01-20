-- ============================================
-- TABLA DE EVENTOS PARA COMUNICACIÓN CON ERP
-- ============================================
-- Esta tabla permite que el ERP solicite scraping específico
-- mediante eventos que se procesan una vez al día o en tiempo real
-- ============================================

USE codi_ejamtest;

-- ============================================
-- TABLA: pjud_eventos_scraping
-- ============================================
CREATE TABLE IF NOT EXISTS pjud_eventos_scraping (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_tipo ENUM('SCRAPING_ESPECIFICO', 'SCRAPING_MASIVO', 'CONSULTA_ESTADO') DEFAULT 'SCRAPING_ESPECIFICO',
  
  -- Datos del RIT a procesar
  rit VARCHAR(50) NOT NULL,
  competencia_id INT NULL,
  corte_id INT NULL,
  tribunal_id INT NULL,
  tipo_causa VARCHAR(10) DEFAULT 'C',
  
  -- Filtros adicionales
  abogado_id INT NULL,
  causa_id INT NULL,
  agenda_id INT NULL,
  
  -- Estado del evento
  estado ENUM('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR', 'CANCELADO') DEFAULT 'PENDIENTE',
  
  -- Prioridad (1-10, mayor = más prioridad)
  prioridad INT DEFAULT 5,
  
  -- Metadatos del ERP
  erp_origen VARCHAR(100) NULL COMMENT 'Identificador del ERP que creó el evento',
  erp_usuario_id INT NULL COMMENT 'Usuario del ERP que solicitó',
  erp_metadata TEXT NULL COMMENT 'JSON con metadata adicional del ERP',
  
  -- Resultado
  resultado_rit VARCHAR(50) NULL COMMENT 'RIT procesado (puede diferir si fue normalizado)',
  resultado_movimientos INT NULL COMMENT 'Cantidad de movimientos encontrados',
  resultado_pdfs INT NULL COMMENT 'Cantidad de PDFs descargados',
  resultado_error TEXT NULL COMMENT 'Mensaje de error si falló',
  resultado_data JSON NULL COMMENT 'Datos adicionales del resultado en formato JSON',
  
  -- Timestamps
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_procesamiento DATETIME NULL,
  fecha_completado DATETIME NULL,
  
  -- Índices
  INDEX idx_estado (estado),
  INDEX idx_rit (rit),
  INDEX idx_abogado_id (abogado_id),
  INDEX idx_causa_id (causa_id),
  INDEX idx_agenda_id (agenda_id),
  INDEX idx_fecha_creacion (fecha_creacion),
  INDEX idx_prioridad (prioridad DESC, fecha_creacion ASC),
  INDEX idx_erp_origen (erp_origen),
  INDEX idx_evento_tipo (evento_tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VISTA: Eventos pendientes ordenados por prioridad
-- ============================================
CREATE OR REPLACE VIEW v_eventos_scraping_pendientes AS
SELECT 
  id,
  evento_tipo,
  rit,
  competencia_id,
  corte_id,
  tribunal_id,
  tipo_causa,
  abogado_id,
  causa_id,
  agenda_id,
  prioridad,
  erp_origen,
  erp_usuario_id,
  fecha_creacion
FROM pjud_eventos_scraping
WHERE estado = 'PENDIENTE'
ORDER BY prioridad DESC, fecha_creacion ASC;

-- ============================================
-- PROCEDIMIENTO: Crear evento de scraping específico
-- ============================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_crear_evento_scraping$$

CREATE PROCEDURE sp_crear_evento_scraping(
  IN p_rit VARCHAR(50),
  IN p_competencia_id INT,
  IN p_corte_id INT,
  IN p_tribunal_id INT,
  IN p_tipo_causa VARCHAR(10),
  IN p_abogado_id INT,
  IN p_causa_id INT,
  IN p_agenda_id INT,
  IN p_erp_origen VARCHAR(100),
  IN p_erp_usuario_id INT,
  IN p_prioridad INT,
  IN p_metadata TEXT
)
BEGIN
  INSERT INTO pjud_eventos_scraping (
    evento_tipo,
    rit,
    competencia_id,
    corte_id,
    tribunal_id,
    tipo_causa,
    abogado_id,
    causa_id,
    agenda_id,
    prioridad,
    erp_origen,
    erp_usuario_id,
    erp_metadata,
    estado
  ) VALUES (
    'SCRAPING_ESPECIFICO',
    p_rit,
    p_competencia_id,
    p_corte_id,
    p_tribunal_id,
    COALESCE(p_tipo_causa, 'C'),
    p_abogado_id,
    p_causa_id,
    p_agenda_id,
    COALESCE(p_prioridad, 5),
    p_erp_origen,
    p_erp_usuario_id,
    p_metadata,
    'PENDIENTE'
  );
  
  SELECT LAST_INSERT_ID() AS evento_id;
END$$

DELIMITER ;

-- ============================================
-- PROCEDIMIENTO: Obtener siguiente evento pendiente
-- ============================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_obtener_siguiente_evento$$

CREATE PROCEDURE sp_obtener_siguiente_evento()
BEGIN
  SELECT * FROM pjud_eventos_scraping
  WHERE estado = 'PENDIENTE'
  ORDER BY prioridad DESC, fecha_creacion ASC
  LIMIT 1;
END$$

DELIMITER ;

-- ============================================
-- PROCEDIMIENTO: Marcar evento como completado
-- ============================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_marcar_evento_completado(
  IN p_evento_id INT,
  IN p_resultado_rit VARCHAR(50),
  IN p_resultado_movimientos INT,
  IN p_resultado_pdfs INT,
  IN p_resultado_data JSON
)
BEGIN
  UPDATE pjud_eventos_scraping
  SET estado = 'COMPLETADO',
      resultado_rit = p_resultado_rit,
      resultado_movimientos = p_resultado_movimientos,
      resultado_pdfs = p_resultado_pdfs,
      resultado_data = p_resultado_data,
      fecha_completado = NOW()
  WHERE id = p_evento_id;
END$$

DELIMITER ;

-- ============================================
-- PROCEDIMIENTO: Marcar evento como error
-- ============================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_marcar_evento_error(
  IN p_evento_id INT,
  IN p_error_message TEXT
)
BEGIN
  UPDATE pjud_eventos_scraping
  SET estado = 'ERROR',
      resultado_error = p_error_message,
      fecha_completado = NOW()
  WHERE id = p_evento_id;
END$$

DELIMITER ;

-- ============================================
-- CONSULTAS ÚTILES
-- ============================================

-- Ver eventos pendientes
-- SELECT * FROM v_eventos_scraping_pendientes;

-- Ver eventos por estado
-- SELECT estado, COUNT(*) as total FROM pjud_eventos_scraping GROUP BY estado;

-- Ver eventos de un RIT específico
-- SELECT * FROM pjud_eventos_scraping WHERE rit = 'C-12345-2020' ORDER BY fecha_creacion DESC;

-- Ver eventos de un abogado
-- SELECT * FROM pjud_eventos_scraping WHERE abogado_id = 123 ORDER BY fecha_creacion DESC;

-- ============================================
-- NOTAS
-- ============================================
-- 1. El ERP puede crear eventos usando el procedimiento sp_crear_evento_scraping
-- 2. El worker procesa eventos una vez al día o en tiempo real
-- 3. Los eventos se procesan por prioridad (mayor primero) y luego por fecha
-- 4. El ERP puede consultar el estado del evento por ID
-- 5. Los resultados se guardan en resultado_data como JSON

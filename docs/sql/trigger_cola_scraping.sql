-- ============================================
-- SISTEMA DE COLA PARA SCRAPING AUTOMÁTICO
-- ============================================
-- Cuando se inserta un RIT en la tabla de cola, el sistema de scraping
-- lo detecta y ejecuta el scraping automáticamente
-- ============================================

USE codi_ejamtest;

-- ============================================
-- PASO 1: Crear tabla de cola para scraping
-- ============================================
CREATE TABLE IF NOT EXISTS pjud_cola_scraping (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rit VARCHAR(50) NOT NULL,
  competencia_id INT,
  corte_id INT,
  tribunal_id INT,
  tipo_causa VARCHAR(10) DEFAULT 'C',
  estado ENUM('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR') DEFAULT 'PENDIENTE',
  intentos INT DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_procesamiento DATETIME NULL,
  fecha_completado DATETIME NULL,
  error_message TEXT NULL,
  INDEX idx_estado (estado),
  INDEX idx_rit (rit),
  INDEX idx_fecha_creacion (fecha_creacion)
);

-- ============================================
-- PASO 2: Trigger que detecta cuando se inserta un RIT en la tabla principal
-- ============================================
-- Este trigger se activa cuando insertas un RIT en tu tabla principal (ej: 'causa')
-- y automáticamente lo agrega a la cola de scraping

DELIMITER $$

DROP TRIGGER IF EXISTS trigger_agregar_a_cola_scraping$$

CREATE TRIGGER trigger_agregar_a_cola_scraping
AFTER INSERT ON causa
FOR EACH ROW
BEGIN
  -- Solo agregar a la cola si el RIT no está ya pendiente o procesando
  IF NOT EXISTS (
    SELECT 1 FROM pjud_cola_scraping 
    WHERE rit = NEW.rit 
    AND estado IN ('PENDIENTE', 'PROCESANDO')
  ) THEN
    INSERT INTO pjud_cola_scraping (
      rit,
      competencia_id,
      corte_id,
      tribunal_id,
      tipo_causa,
      estado
    ) VALUES (
      NEW.rit,
      NEW.competencia_id,
      NEW.corte_id,
      NEW.tribunal_id,
      COALESCE(NEW.tipo_causa, 'C'),
      'PENDIENTE'
    );
  END IF;
END$$

DELIMITER ;

-- ============================================
-- PASO 3: Trigger alternativo - cuando se actualiza un RIT existente
-- ============================================
DELIMITER $$

DROP TRIGGER IF EXISTS trigger_actualizar_cola_scraping$$

CREATE TRIGGER trigger_actualizar_cola_scraping
AFTER UPDATE ON causa
FOR EACH ROW
BEGIN
  -- Si el RIT cambió o se actualizó información relevante, agregar a cola
  IF (OLD.rit != NEW.rit OR 
      OLD.competencia_id != NEW.competencia_id OR
      OLD.corte_id != NEW.corte_id OR
      OLD.tribunal_id != NEW.tribunal_id) THEN
    
    -- Agregar a cola si no está ya pendiente
    IF NOT EXISTS (
      SELECT 1 FROM pjud_cola_scraping 
      WHERE rit = NEW.rit 
      AND estado IN ('PENDIENTE', 'PROCESANDO')
    ) THEN
      INSERT INTO pjud_cola_scraping (
        rit,
        competencia_id,
        corte_id,
        tribunal_id,
        tipo_causa,
        estado
      ) VALUES (
        NEW.rit,
        NEW.competencia_id,
        NEW.corte_id,
        NEW.tribunal_id,
        COALESCE(NEW.tipo_causa, 'C'),
        'PENDIENTE'
      )
      ON DUPLICATE KEY UPDATE
        competencia_id = NEW.competencia_id,
        corte_id = NEW.corte_id,
        tribunal_id = NEW.tribunal_id,
        estado = 'PENDIENTE',
        intentos = 0,
        fecha_creacion = CURRENT_TIMESTAMP;
    END IF;
  END IF;
END$$

DELIMITER ;

-- ============================================
-- PASO 4: Procedimiento almacenado para marcar como procesando
-- ============================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_marcar_procesando$$

CREATE PROCEDURE sp_marcar_procesando(IN p_rit VARCHAR(50))
BEGIN
  UPDATE pjud_cola_scraping
  SET estado = 'PROCESANDO',
      fecha_procesamiento = NOW(),
      intentos = intentos + 1
  WHERE rit = p_rit
  AND estado = 'PENDIENTE'
  LIMIT 1;
  
  SELECT * FROM pjud_cola_scraping WHERE rit = p_rit;
END$$

DELIMITER ;

-- ============================================
-- PASO 5: Procedimiento almacenado para marcar como completado
-- ============================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_marcar_completado$$

CREATE PROCEDURE sp_marcar_completado(
  IN p_rit VARCHAR(50),
  IN p_exito BOOLEAN,
  IN p_error_message TEXT
)
BEGIN
  IF p_exito THEN
    UPDATE pjud_cola_scraping
    SET estado = 'COMPLETADO',
        fecha_completado = NOW(),
        error_message = NULL
    WHERE rit = p_rit;
  ELSE
    UPDATE pjud_cola_scraping
    SET estado = 'ERROR',
        fecha_completado = NOW(),
        error_message = p_error_message
    WHERE rit = p_rit;
  END IF;
END$$

DELIMITER ;

-- ============================================
-- PASO 6: Vista para obtener RITs pendientes
-- ============================================
CREATE OR REPLACE VIEW v_cola_scraping_pendientes AS
SELECT 
  id,
  rit,
  competencia_id,
  corte_id,
  tribunal_id,
  tipo_causa,
  intentos,
  fecha_creacion
FROM pjud_cola_scraping
WHERE estado = 'PENDIENTE'
ORDER BY fecha_creacion ASC;

-- ============================================
-- CONSULTAS ÚTILES
-- ============================================

-- Ver todos los RITs pendientes
-- SELECT * FROM v_cola_scraping_pendientes;

-- Ver estadísticas de la cola
-- SELECT 
--   estado,
--   COUNT(*) as total,
--   AVG(intentos) as promedio_intentos
-- FROM pjud_cola_scraping
-- GROUP BY estado;

-- Limpiar cola antigua (completados de hace más de 30 días)
-- DELETE FROM pjud_cola_scraping 
-- WHERE estado = 'COMPLETADO' 
-- AND fecha_completado < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Los triggers se ejecutan automáticamente cuando insertas/actualizas en 'causa'
-- 2. El script Node.js debe hacer polling a la tabla de cola
-- 3. El script debe marcar como 'PROCESANDO' antes de empezar
-- 4. El script debe marcar como 'COMPLETADO' o 'ERROR' al terminar
-- 5. Puedes insertar manualmente RITs a la cola si es necesario:
--    INSERT INTO pjud_cola_scraping (rit, competencia_id, corte_id, estado)
--    VALUES ('C-12345-2020', 3, 90, 'PENDIENTE');
-- ============================================



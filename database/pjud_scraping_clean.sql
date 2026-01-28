SET FOREIGN_KEY_CHECKS = 0;

DROP PROCEDURE IF EXISTS sp_debe_reintentar;
DROP PROCEDURE IF EXISTS sp_marcar_exito;
DROP PROCEDURE IF EXISTS sp_registrar_error;

DROP TABLE IF EXISTS causas;
DROP TABLE IF EXISTS ebooks;
DROP TABLE IF EXISTS errores_scraping;
DROP TABLE IF EXISTS etapas_juicio;
DROP TABLE IF EXISTS movimientos;
DROP TABLE IF EXISTS pdfs;
DROP TABLE IF EXISTS scraping_log;

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_debe_reintentar` (IN `p_rit` VARCHAR(50), IN `p_max_intentos` INT, OUT `p_debe_reintentar` TINYINT)   BEGIN
    DECLARE v_intentos INT DEFAULT 0;
    
    SELECT COALESCE(MAX(intentos), 0) INTO v_intentos
    FROM errores_scraping
    WHERE rit = p_rit AND resuelto = 0;
    
    SET p_debe_reintentar = IF(v_intentos < p_max_intentos, 1, 0);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_marcar_exito` (IN `p_rit` VARCHAR(50), IN `p_total_movimientos` INT, IN `p_total_pdfs` INT)   BEGIN
    
    UPDATE causas 
    SET fecha_ultimo_scraping = NOW(),
        scraping_exitoso = 1,
        total_movimientos = p_total_movimientos,
        total_pdfs = p_total_pdfs,
        error_scraping = NULL
    WHERE rit = p_rit;
    
    
    UPDATE errores_scraping
    SET resuelto = 1,
        fecha_resolucion = NOW(),
        notas_resolucion = 'Resuelto automáticamente - scraping exitoso'
    WHERE rit = p_rit AND resuelto = 0;
    
    
    INSERT INTO scraping_log (rit, tipo, mensaje)
    VALUES (p_rit, 'SUCCESS', CONCAT('Scraping completado: ', p_total_movimientos, ' movimientos, ', p_total_pdfs, ' PDFs'));
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_registrar_error` (IN `p_rit` VARCHAR(50), IN `p_tipo_error` VARCHAR(100), IN `p_mensaje` TEXT, IN `p_stack_trace` LONGTEXT)   BEGIN
    DECLARE v_causa_id INT;
    DECLARE v_error_id INT;
    
    
    SELECT id INTO v_causa_id FROM causas WHERE rit = p_rit LIMIT 1;
    
    
    SELECT id INTO v_error_id 
    FROM errores_scraping 
    WHERE rit = p_rit 
      AND tipo_error = p_tipo_error 
      AND resuelto = 0 
    LIMIT 1;
    
    IF v_error_id IS NOT NULL THEN
        
        UPDATE errores_scraping 
        SET intentos = intentos + 1,
            ultimo_intento = NOW(),
            mensaje_error = p_mensaje,
            stack_trace = p_stack_trace
        WHERE id = v_error_id;
    ELSE
        
        INSERT INTO errores_scraping (causa_id, rit, tipo_error, mensaje_error, stack_trace, ultimo_intento)
        VALUES (v_causa_id, p_rit, p_tipo_error, p_mensaje, p_stack_trace, NOW());
    END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------

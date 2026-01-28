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
CREATE TABLE `causas` (
  `id` int(11) UNSIGNED NOT NULL,
  `rit` varchar(50) NOT NULL COMMENT 'RIT de la causa (ej: C-3030-2017)',
  `tipo_causa` char(1) NOT NULL DEFAULT 'C' COMMENT 'Tipo: C=Civil, L=Laboral, R=Reforma',
  `rol` varchar(20) NOT NULL COMMENT 'Número de rol (ej: 3030)',
  `anio` smallint(4) UNSIGNED NOT NULL COMMENT 'Año de la causa',
  `competencia_id` varchar(10) DEFAULT NULL,
  `competencia_nombre` varchar(100) DEFAULT NULL,
  `corte_id` varchar(10) DEFAULT NULL,
  `corte_nombre` varchar(100) DEFAULT NULL,
  `tribunal_id` varchar(10) DEFAULT NULL,
  `tribunal_nombre` varchar(200) DEFAULT NULL,
  `caratulado` varchar(500) DEFAULT NULL COMMENT 'Caratulado de la causa',
  `fecha_ingreso` varchar(20) DEFAULT NULL COMMENT 'Fecha de ingreso al tribunal',
  `estado` enum('EN_TRAMITE','TERMINADA','SUSPENDIDA','SIN_INFORMACION') DEFAULT 'SIN_INFORMACION',
  `etapa` varchar(50) DEFAULT NULL COMMENT 'Etapa procesal actual',
  `estado_descripcion` varchar(500) DEFAULT NULL,
  `total_movimientos` int(11) DEFAULT 0,
  `total_pdfs` int(11) DEFAULT 0,
  `fecha_ultimo_scraping` datetime DEFAULT NULL,
  `scraping_exitoso` tinyint(1) DEFAULT 0,
  `error_scraping` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='Causas judiciales extraídas por scraping';
CREATE TABLE `ebooks` (
  `id` int(11) UNSIGNED NOT NULL,
  `causa_id` int(11) UNSIGNED NOT NULL,
  `rit` varchar(50) NOT NULL,
  `nombre_archivo` varchar(255) NOT NULL,
  `ruta_relativa` varchar(500) DEFAULT NULL,
  `tamano_bytes` int(11) UNSIGNED DEFAULT NULL,
  `base64_content` longtext DEFAULT NULL COMMENT 'Contenido del eBook en base64 (pdf_ebook)',
  `tamano_base64_bytes` int(11) UNSIGNED DEFAULT NULL COMMENT 'Tamaño del string base64',
  `descargado` tinyint(1) DEFAULT 0,
  `fecha_descarga` datetime DEFAULT NULL,
  `error_descarga` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='eBooks descargados del scraping';
CREATE TABLE `errores_scraping` (
  `id` int(11) UNSIGNED NOT NULL,
  `causa_id` int(11) UNSIGNED DEFAULT NULL,
  `rit` varchar(50) NOT NULL,
  `tipo_error` varchar(100) NOT NULL COMMENT 'Categoría del error',
  `mensaje_error` text NOT NULL,
  `stack_trace` longtext DEFAULT NULL,
  `intentos` int(11) DEFAULT 1,
  `ultimo_intento` datetime DEFAULT NULL,
  `resuelto` tinyint(1) DEFAULT 0,
  `fecha_resolucion` datetime DEFAULT NULL,
  `notas_resolucion` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='Errores de scraping para evitar reintentos infinitos';

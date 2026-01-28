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
CREATE TABLE `etapas_juicio` (
  `id` int(11) UNSIGNED NOT NULL,
  `codigo` varchar(50) NOT NULL COMMENT 'Código único de etapa',
  `nombre` varchar(100) NOT NULL COMMENT 'Nombre de la etapa',
  `descripcion` varchar(500) DEFAULT NULL,
  `orden` int(11) DEFAULT 0 COMMENT 'Orden en el flujo procesal',
  `es_terminal` tinyint(1) DEFAULT 0 COMMENT 'Si es etapa final'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='Catálogo de etapas procesales';

--
-- Volcado de datos para la tabla `etapas_juicio`
--

INSERT INTO `etapas_juicio` (`id`, `codigo`, `nombre`, `descripcion`, `orden`, `es_terminal`) VALUES
(1, 'INGRESO', 'Ingreso', 'Ingreso de la demanda al tribunal', 1, 0),
(2, 'INICIO_TRAMITACION', 'Inicio de Tramitación', 'Inicio formal del proceso', 2, 0),
(3, 'NOTIFICACION', 'Notificación', 'Notificación de demanda y proveído', 3, 0),
(4, 'EXCEPCIONES', 'Excepciones', 'Presentación de excepciones', 4, 0),
(5, 'CONTESTACION_EXCEPCIONES', 'Contestación Excepciones', 'Contestación a las excepciones', 5, 0),
(6, 'CONTESTACION', 'Contestación', 'Contestación de la demanda', 6, 0),
(7, 'REPLICA', 'Réplica', 'Réplica del demandante', 7, 0),
(8, 'DUPLICA', 'Dúplica', 'Dúplica del demandado', 8, 0),
(9, 'CONCILIACION', 'Conciliación', 'Audiencia de conciliación', 9, 0),
(10, 'PROBATORIO', 'Probatorio', 'Período probatorio', 10, 0),
(11, 'AUDIENCIA', 'Audiencia', 'Audiencias del proceso', 11, 0),
(12, 'DISCUSION', 'Discusión', 'Alegatos y discusión', 12, 0),
(13, 'CITACION_SENTENCIA', 'Citación a Sentencia', 'Citación para oír sentencia', 13, 0),
(14, 'SENTENCIA', 'Sentencia', 'Dictación de sentencia', 14, 0),
(15, 'RECURSOS', 'Recursos', 'Recursos procesales', 15, 0),
(16, 'CUMPLIMIENTO', 'Cumplimiento', 'Etapa de cumplimiento', 16, 0),
(17, 'TERMINADA', 'Terminada', 'Causa terminada', 99, 1),
(18, 'SUSPENDIDA', 'Suspendida', 'Causa suspendida', 98, 1),
(19, 'ARCHIVADA', 'Archivada', 'Causa archivada', 97, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos`
--
CREATE TABLE `movimientos` (
  `id` int(11) UNSIGNED NOT NULL,
  `causa_id` int(11) UNSIGNED NOT NULL COMMENT 'FK a causas.id',
  `rit` varchar(50) NOT NULL COMMENT 'RIT de la causa (desnormalizado para queries)',
  `indice` int(11) NOT NULL COMMENT 'Número de índice del movimiento',
  `etapa` varchar(100) DEFAULT NULL COMMENT 'Etapa del juicio',
  `etapa_codigo` varchar(50) DEFAULT NULL COMMENT 'Código de etapa normalizado',
  `tramite` varchar(200) DEFAULT NULL COMMENT 'Tipo de trámite',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción del movimiento',
  `fecha` varchar(20) DEFAULT NULL COMMENT 'Fecha del movimiento',
  `fecha_parsed` date DEFAULT NULL COMMENT 'Fecha parseada para ordenamiento',
  `foja` varchar(50) DEFAULT NULL COMMENT 'Número de foja',
  `folio` varchar(50) DEFAULT NULL COMMENT 'Número de folio',
  `tiene_pdf` tinyint(1) DEFAULT 0,
  `pdf_principal` varchar(255) DEFAULT NULL COMMENT 'Nombre archivo PDF principal (azul)',
  `pdf_anexo` varchar(255) DEFAULT NULL COMMENT 'Nombre archivo PDF anexo (rojo)',
  `pdf_descargado` tinyint(1) DEFAULT 0,
  `raw_data` longtext DEFAULT NULL COMMENT 'Datos crudos en formato JSON',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `id_cuaderno` varchar(50) DEFAULT '1',
  `cuaderno_nombre` varchar(255) DEFAULT 'Principal',
  `id_pagina` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='Movimientos de las causas judiciales';
CREATE TABLE `pdfs` (
  `id` int(11) UNSIGNED NOT NULL,
  `causa_id` int(11) UNSIGNED NOT NULL,
  `movimiento_id` int(11) UNSIGNED DEFAULT NULL,
  `rit` varchar(50) NOT NULL,
  `tipo` enum('PRINCIPAL','ANEXO','EBOOK') NOT NULL DEFAULT 'PRINCIPAL',
  `nombre_archivo` varchar(255) NOT NULL,
  `ruta_relativa` varchar(500) DEFAULT NULL,
  `tamano_bytes` int(11) UNSIGNED DEFAULT NULL,
  `hash_md5` varchar(32) DEFAULT NULL,
  `base64_content` longtext DEFAULT NULL COMMENT 'Contenido del PDF en base64',
  `tamano_base64_bytes` int(11) UNSIGNED DEFAULT NULL COMMENT 'Tamaño del string base64',
  `descargado` tinyint(1) DEFAULT 0,
  `fecha_descarga` datetime DEFAULT NULL,
  `error_descarga` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='PDFs descargados del scraping';
CREATE TABLE `scraping_log` (
  `id` int(11) UNSIGNED NOT NULL,
  `causa_id` int(11) UNSIGNED DEFAULT NULL,
  `rit` varchar(50) DEFAULT NULL,
  `tipo` enum('INFO','WARNING','ERROR','SUCCESS') DEFAULT 'INFO',
  `mensaje` text NOT NULL,
  `detalle` longtext DEFAULT NULL COMMENT 'Detalles adicionales en JSON',
  `duracion_ms` int(11) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='Log de operaciones de scraping';


SET FOREIGN_KEY_CHECKS = 1;

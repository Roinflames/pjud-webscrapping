-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 23-01-2026 a las 15:42:35
-- Versión del servidor: 10.4.28-MariaDB
-- Versión de PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `pjud_scraping`
--

DROP PROCEDURE IF EXISTS sp_debe_reintentar;
DROP PROCEDURE IF EXISTS sp_marcar_exito;
DROP PROCEDURE IF EXISTS sp_registrar_error;
DELIMITER $$
--
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS causas, ebooks, errores_scraping, etapas_juicio, movimientos, pdfs, scraping_log;
DROP VIEW IF EXISTS v_causas_resumen, v_movimientos_por_etapa;
SET FOREIGN_KEY_CHECKS = 1;
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

--
-- Estructura de tabla para la tabla `causas`
--

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

--
-- Volcado de datos para la tabla `causas`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ebooks`
--

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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `errores_scraping`
--

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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `etapas_juicio`
--

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

--
-- Volcado de datos para la tabla `movimientos`
--


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pdfs`
--

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

--
-- Volcado de datos para la tabla `pdfs`
--

CREATE TABLE `v_causas_resumen` (
`id` int(11) unsigned
,`rit` varchar(50)
,`tipo_causa` char(1)
,`caratulado` varchar(500)
,`tribunal_nombre` varchar(200)
,`corte_nombre` varchar(100)
,`estado` enum('EN_TRAMITE','TERMINADA','SUSPENDIDA','SIN_INFORMACION')
,`etapa` varchar(50)
,`total_movimientos` int(11)
,`total_pdfs` int(11)
,`fecha_ultimo_scraping` datetime
,`scraping_exitoso` tinyint(1)
,`pdfs_descargados` bigint(21)
,`errores_pendientes` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_movimientos_por_etapa`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_movimientos_por_etapa` (
`rit` varchar(50)
,`caratulado` varchar(500)
,`etapa_codigo` varchar(50)
,`etapa_nombre` varchar(100)
,`total_movimientos` bigint(21)
,`con_pdf` decimal(25,0)
,`pdf_descargados` decimal(25,0)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `v_causas_resumen`
--
DROP TABLE IF EXISTS `v_causas_resumen`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_causas_resumen`  AS SELECT `c`.`id` AS `id`, `c`.`rit` AS `rit`, `c`.`tipo_causa` AS `tipo_causa`, `c`.`caratulado` AS `caratulado`, `c`.`tribunal_nombre` AS `tribunal_nombre`, `c`.`corte_nombre` AS `corte_nombre`, `c`.`estado` AS `estado`, `c`.`etapa` AS `etapa`, `c`.`total_movimientos` AS `total_movimientos`, `c`.`total_pdfs` AS `total_pdfs`, `c`.`fecha_ultimo_scraping` AS `fecha_ultimo_scraping`, `c`.`scraping_exitoso` AS `scraping_exitoso`, (select count(0) from `movimientos` `m` where `m`.`causa_id` = `c`.`id` and `m`.`pdf_descargado` = 1) AS `pdfs_descargados`, (select count(0) from `errores_scraping` `e` where `e`.`rit` = `c`.`rit` and `e`.`resuelto` = 0) AS `errores_pendientes` FROM `causas` AS `c` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_movimientos_por_etapa`
--
DROP TABLE IF EXISTS `v_movimientos_por_etapa`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_movimientos_por_etapa`  AS SELECT `c`.`rit` AS `rit`, `c`.`caratulado` AS `caratulado`, coalesce(`m`.`etapa_codigo`,'SIN_ETAPA') AS `etapa_codigo`, coalesce(`e`.`nombre`,`m`.`etapa`) AS `etapa_nombre`, count(0) AS `total_movimientos`, sum(`m`.`tiene_pdf`) AS `con_pdf`, sum(`m`.`pdf_descargado`) AS `pdf_descargados` FROM ((`causas` `c` join `movimientos` `m` on(`m`.`causa_id` = `c`.`id`)) left join `etapas_juicio` `e` on(`e`.`codigo` = `m`.`etapa_codigo`)) GROUP BY `c`.`rit`, `c`.`caratulado`, `m`.`etapa_codigo`, `e`.`nombre`, `m`.`etapa` ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `causas`
--
ALTER TABLE `causas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_rit` (`rit`),
  ADD KEY `idx_tipo_causa` (`tipo_causa`),
  ADD KEY `idx_tribunal_id` (`tribunal_id`),
  ADD KEY `idx_corte_id` (`corte_id`),
  ADD KEY `idx_estado` (`estado`),
  ADD KEY `idx_fecha_scraping` (`fecha_ultimo_scraping`);

--
-- Indices de la tabla `ebooks`
--
ALTER TABLE `ebooks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_causa_ebook` (`causa_id`),
  ADD KEY `idx_rit` (`rit`);

--
-- Indices de la tabla `errores_scraping`
--
ALTER TABLE `errores_scraping`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_rit` (`rit`),
  ADD KEY `idx_tipo_error` (`tipo_error`),
  ADD KEY `idx_resuelto` (`resuelto`),
  ADD KEY `idx_intentos` (`intentos`);

--
-- Indices de la tabla `etapas_juicio`
--
ALTER TABLE `etapas_juicio`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_codigo` (`codigo`),
  ADD KEY `idx_orden` (`orden`);

--
-- Indices de la tabla `movimientos`
--
ALTER TABLE `movimientos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_causa_indice` (`causa_id`,`indice`),
  ADD KEY `idx_rit` (`rit`),
  ADD KEY `idx_etapa` (`etapa`),
  ADD KEY `idx_etapa_codigo` (`etapa_codigo`),
  ADD KEY `idx_fecha_parsed` (`fecha_parsed`),
  ADD KEY `idx_tiene_pdf` (`tiene_pdf`),
  ADD KEY `idx_pdf_descargado` (`pdf_descargado`);

--
-- Indices de la tabla `pdfs`
--
ALTER TABLE `pdfs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_causa_id` (`causa_id`),
  ADD KEY `idx_movimiento_id` (`movimiento_id`),
  ADD KEY `idx_rit` (`rit`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_descargado` (`descargado`);

--
-- Indices de la tabla `scraping_log`
--
ALTER TABLE `scraping_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_causa_id` (`causa_id`),
  ADD KEY `idx_rit` (`rit`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `causas`
--
ALTER TABLE `causas`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `ebooks`
--
ALTER TABLE `ebooks`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `errores_scraping`
--
ALTER TABLE `errores_scraping`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `etapas_juicio`
--
ALTER TABLE `etapas_juicio`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `movimientos`
--
ALTER TABLE `movimientos`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=198;

--
-- AUTO_INCREMENT de la tabla `pdfs`
--
ALTER TABLE `pdfs`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=148;

--
-- AUTO_INCREMENT de la tabla `scraping_log`
--
ALTER TABLE `scraping_log`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `ebooks`
--
ALTER TABLE `ebooks`
  ADD CONSTRAINT `fk_ebooks_causa` FOREIGN KEY (`causa_id`) REFERENCES `causas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `movimientos`
--
ALTER TABLE `movimientos`
  ADD CONSTRAINT `fk_movimientos_causa` FOREIGN KEY (`causa_id`) REFERENCES `causas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `pdfs`
--
ALTER TABLE `pdfs`
  ADD CONSTRAINT `fk_pdfs_causa` FOREIGN KEY (`causa_id`) REFERENCES `causas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pdfs_movimiento` FOREIGN KEY (`movimiento_id`) REFERENCES `movimientos` (`id`) ON DELETE SET NULL;
COMMIT;
-- Estructura de tabla para la tabla `scraping_log`
--

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

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_causas_resumen`
-- (Véase abajo para la vista actual)

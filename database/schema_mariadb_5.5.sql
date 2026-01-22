-- ============================================
-- SCHEMA PJUD WEB SCRAPING
-- Compatible con MariaDB 5.5.68 / CentOS 7.9
-- ============================================
-- NOTA: MariaDB 5.5 no soporta JSON nativo, usamos LONGTEXT
-- NOTA: No usar utf8mb4, usar utf8 estándar

SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- TABLA: causas
-- Información principal de cada causa judicial
-- ============================================
DROP TABLE IF EXISTS `causas`;
CREATE TABLE `causas` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `rit` VARCHAR(50) NOT NULL COMMENT 'RIT de la causa (ej: C-3030-2017)',
    `tipo_causa` CHAR(1) NOT NULL DEFAULT 'C' COMMENT 'Tipo: C=Civil, L=Laboral, R=Reforma',
    `rol` VARCHAR(20) NOT NULL COMMENT 'Número de rol (ej: 3030)',
    `anio` SMALLINT(4) UNSIGNED NOT NULL COMMENT 'Año de la causa',
    
    -- Información del tribunal
    `competencia_id` VARCHAR(10) DEFAULT NULL,
    `competencia_nombre` VARCHAR(100) DEFAULT NULL,
    `corte_id` VARCHAR(10) DEFAULT NULL,
    `corte_nombre` VARCHAR(100) DEFAULT NULL,
    `tribunal_id` VARCHAR(10) DEFAULT NULL,
    `tribunal_nombre` VARCHAR(200) DEFAULT NULL,
    
    -- Información de la causa
    `caratulado` VARCHAR(500) DEFAULT NULL COMMENT 'Caratulado de la causa',
    `fecha_ingreso` VARCHAR(20) DEFAULT NULL COMMENT 'Fecha de ingreso al tribunal',
    
    -- Estado actual
    `estado` ENUM('EN_TRAMITE','TERMINADA','SUSPENDIDA','SIN_INFORMACION') DEFAULT 'SIN_INFORMACION',
    `etapa` VARCHAR(50) DEFAULT NULL COMMENT 'Etapa procesal actual',
    `estado_descripcion` VARCHAR(500) DEFAULT NULL,
    
    -- Metadatos del scraping
    `total_movimientos` INT(11) DEFAULT 0,
    `total_pdfs` INT(11) DEFAULT 0,
    `fecha_ultimo_scraping` DATETIME DEFAULT NULL,
    `scraping_exitoso` TINYINT(1) DEFAULT 0,
    `error_scraping` TEXT DEFAULT NULL,
    
    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_rit` (`rit`),
    KEY `idx_tipo_causa` (`tipo_causa`),
    KEY `idx_tribunal_id` (`tribunal_id`),
    KEY `idx_corte_id` (`corte_id`),
    KEY `idx_estado` (`estado`),
    KEY `idx_fecha_scraping` (`fecha_ultimo_scraping`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Causas judiciales extraídas por scraping';

-- ============================================
-- TABLA: movimientos
-- Movimientos/actuaciones de cada causa
-- ============================================
DROP TABLE IF EXISTS `movimientos`;
CREATE TABLE `movimientos` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `causa_id` INT(11) UNSIGNED NOT NULL COMMENT 'FK a causas.id',
    `rit` VARCHAR(50) NOT NULL COMMENT 'RIT de la causa (desnormalizado para queries)',
    `indice` INT(11) NOT NULL COMMENT 'Número de índice del movimiento',
    
    -- Etapa procesal
    `etapa` VARCHAR(100) DEFAULT NULL COMMENT 'Etapa del juicio',
    `etapa_codigo` VARCHAR(50) DEFAULT NULL COMMENT 'Código de etapa normalizado',
    
    -- Información del movimiento
    `tramite` VARCHAR(200) DEFAULT NULL COMMENT 'Tipo de trámite',
    `descripcion` TEXT DEFAULT NULL COMMENT 'Descripción del movimiento',
    `fecha` VARCHAR(20) DEFAULT NULL COMMENT 'Fecha del movimiento',
    `fecha_parsed` DATE DEFAULT NULL COMMENT 'Fecha parseada para ordenamiento',
    `foja` VARCHAR(50) DEFAULT NULL COMMENT 'Número de foja',
    `folio` VARCHAR(50) DEFAULT NULL COMMENT 'Número de folio',
    
    -- PDFs asociados
    `tiene_pdf` TINYINT(1) DEFAULT 0,
    `pdf_principal` VARCHAR(255) DEFAULT NULL COMMENT 'Nombre archivo PDF principal (azul)',
    `pdf_anexo` VARCHAR(255) DEFAULT NULL COMMENT 'Nombre archivo PDF anexo (rojo)',
    `pdf_descargado` TINYINT(1) DEFAULT 0,
    
    -- Datos adicionales (JSON como TEXT para MariaDB 5.5)
    `raw_data` LONGTEXT DEFAULT NULL COMMENT 'Datos crudos en formato JSON',
    
    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_causa_indice` (`causa_id`, `indice`),
    KEY `idx_rit` (`rit`),
    KEY `idx_etapa` (`etapa`),
    KEY `idx_etapa_codigo` (`etapa_codigo`),
    KEY `idx_fecha_parsed` (`fecha_parsed`),
    KEY `idx_tiene_pdf` (`tiene_pdf`),
    KEY `idx_pdf_descargado` (`pdf_descargado`),
    CONSTRAINT `fk_movimientos_causa` FOREIGN KEY (`causa_id`) REFERENCES `causas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Movimientos de las causas judiciales';

-- ============================================
-- TABLA: etapas_juicio
-- Catálogo de etapas procesales
-- ============================================
DROP TABLE IF EXISTS `etapas_juicio`;
CREATE TABLE `etapas_juicio` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL COMMENT 'Código único de etapa',
    `nombre` VARCHAR(100) NOT NULL COMMENT 'Nombre de la etapa',
    `descripcion` VARCHAR(500) DEFAULT NULL,
    `orden` INT(11) DEFAULT 0 COMMENT 'Orden en el flujo procesal',
    `es_terminal` TINYINT(1) DEFAULT 0 COMMENT 'Si es etapa final',
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_codigo` (`codigo`),
    KEY `idx_orden` (`orden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Catálogo de etapas procesales';

-- Insertar etapas conocidas
INSERT INTO `etapas_juicio` (`codigo`, `nombre`, `descripcion`, `orden`, `es_terminal`) VALUES
('INGRESO', 'Ingreso', 'Ingreso de la demanda al tribunal', 1, 0),
('INICIO_TRAMITACION', 'Inicio de Tramitación', 'Inicio formal del proceso', 2, 0),
('NOTIFICACION', 'Notificación', 'Notificación de demanda y proveído', 3, 0),
('EXCEPCIONES', 'Excepciones', 'Presentación de excepciones', 4, 0),
('CONTESTACION_EXCEPCIONES', 'Contestación Excepciones', 'Contestación a las excepciones', 5, 0),
('CONTESTACION', 'Contestación', 'Contestación de la demanda', 6, 0),
('REPLICA', 'Réplica', 'Réplica del demandante', 7, 0),
('DUPLICA', 'Dúplica', 'Dúplica del demandado', 8, 0),
('CONCILIACION', 'Conciliación', 'Audiencia de conciliación', 9, 0),
('PROBATORIO', 'Probatorio', 'Período probatorio', 10, 0),
('AUDIENCIA', 'Audiencia', 'Audiencias del proceso', 11, 0),
('DISCUSION', 'Discusión', 'Alegatos y discusión', 12, 0),
('CITACION_SENTENCIA', 'Citación a Sentencia', 'Citación para oír sentencia', 13, 0),
('SENTENCIA', 'Sentencia', 'Dictación de sentencia', 14, 0),
('RECURSOS', 'Recursos', 'Recursos procesales', 15, 0),
('CUMPLIMIENTO', 'Cumplimiento', 'Etapa de cumplimiento', 16, 0),
('TERMINADA', 'Terminada', 'Causa terminada', 99, 1),
('SUSPENDIDA', 'Suspendida', 'Causa suspendida', 98, 1),
('ARCHIVADA', 'Archivada', 'Causa archivada', 97, 1);

-- ============================================
-- TABLA: pdfs
-- Registro de PDFs descargados
-- ============================================
DROP TABLE IF EXISTS `pdfs`;
CREATE TABLE `pdfs` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `causa_id` INT(11) UNSIGNED NOT NULL,
    `movimiento_id` INT(11) UNSIGNED DEFAULT NULL,
    `rit` VARCHAR(50) NOT NULL,
    
    `tipo` ENUM('PRINCIPAL','ANEXO','EBOOK') NOT NULL DEFAULT 'PRINCIPAL',
    `nombre_archivo` VARCHAR(255) NOT NULL,
    `ruta_relativa` VARCHAR(500) DEFAULT NULL,
    `tamano_bytes` INT(11) UNSIGNED DEFAULT NULL,
    `hash_md5` VARCHAR(32) DEFAULT NULL,
    
    `descargado` TINYINT(1) DEFAULT 0,
    `fecha_descarga` DATETIME DEFAULT NULL,
    `error_descarga` VARCHAR(500) DEFAULT NULL,
    
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_causa_id` (`causa_id`),
    KEY `idx_movimiento_id` (`movimiento_id`),
    KEY `idx_rit` (`rit`),
    KEY `idx_tipo` (`tipo`),
    KEY `idx_descargado` (`descargado`),
    CONSTRAINT `fk_pdfs_causa` FOREIGN KEY (`causa_id`) REFERENCES `causas` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pdfs_movimiento` FOREIGN KEY (`movimiento_id`) REFERENCES `movimientos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='PDFs descargados del scraping';

-- ============================================
-- TABLA: ebooks
-- Registro de eBooks descargados
-- ============================================
DROP TABLE IF EXISTS `ebooks`;
CREATE TABLE `ebooks` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `causa_id` INT(11) UNSIGNED NOT NULL,
    `rit` VARCHAR(50) NOT NULL,
    
    `nombre_archivo` VARCHAR(255) NOT NULL,
    `ruta_relativa` VARCHAR(500) DEFAULT NULL,
    `tamano_bytes` INT(11) UNSIGNED DEFAULT NULL,
    
    `descargado` TINYINT(1) DEFAULT 0,
    `fecha_descarga` DATETIME DEFAULT NULL,
    `error_descarga` VARCHAR(500) DEFAULT NULL,
    
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_causa_ebook` (`causa_id`),
    KEY `idx_rit` (`rit`),
    CONSTRAINT `fk_ebooks_causa` FOREIGN KEY (`causa_id`) REFERENCES `causas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='eBooks descargados del scraping';

-- ============================================
-- TABLA: scraping_log
-- Log de ejecuciones de scraping
-- ============================================
DROP TABLE IF EXISTS `scraping_log`;
CREATE TABLE `scraping_log` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `causa_id` INT(11) UNSIGNED DEFAULT NULL,
    `rit` VARCHAR(50) DEFAULT NULL,
    
    `tipo` ENUM('INFO','WARNING','ERROR','SUCCESS') DEFAULT 'INFO',
    `mensaje` TEXT NOT NULL,
    `detalle` LONGTEXT DEFAULT NULL COMMENT 'Detalles adicionales en JSON',
    
    `duracion_ms` INT(11) UNSIGNED DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_causa_id` (`causa_id`),
    KEY `idx_rit` (`rit`),
    KEY `idx_tipo` (`tipo`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Log de operaciones de scraping';

-- ============================================
-- TABLA: errores_scraping
-- Registro detallado de errores para evitar loops
-- ============================================
DROP TABLE IF EXISTS `errores_scraping`;
CREATE TABLE `errores_scraping` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `causa_id` INT(11) UNSIGNED DEFAULT NULL,
    `rit` VARCHAR(50) NOT NULL,
    
    `tipo_error` VARCHAR(100) NOT NULL COMMENT 'Categoría del error',
    `mensaje_error` TEXT NOT NULL,
    `stack_trace` LONGTEXT DEFAULT NULL,
    
    `intentos` INT(11) DEFAULT 1,
    `ultimo_intento` DATETIME DEFAULT NULL,
    `resuelto` TINYINT(1) DEFAULT 0,
    `fecha_resolucion` DATETIME DEFAULT NULL,
    `notas_resolucion` TEXT DEFAULT NULL,
    
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_rit` (`rit`),
    KEY `idx_tipo_error` (`tipo_error`),
    KEY `idx_resuelto` (`resuelto`),
    KEY `idx_intentos` (`intentos`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Errores de scraping para evitar reintentos infinitos';

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Resumen de causas con estadísticas
CREATE OR REPLACE VIEW `v_causas_resumen` AS
SELECT 
    c.id,
    c.rit,
    c.tipo_causa,
    c.caratulado,
    c.tribunal_nombre,
    c.corte_nombre,
    c.estado,
    c.etapa,
    c.total_movimientos,
    c.total_pdfs,
    c.fecha_ultimo_scraping,
    c.scraping_exitoso,
    (SELECT COUNT(*) FROM movimientos m WHERE m.causa_id = c.id AND m.pdf_descargado = 1) as pdfs_descargados,
    (SELECT COUNT(*) FROM errores_scraping e WHERE e.rit = c.rit AND e.resuelto = 0) as errores_pendientes
FROM causas c;

-- Vista: Movimientos por etapa
CREATE OR REPLACE VIEW `v_movimientos_por_etapa` AS
SELECT 
    c.rit,
    c.caratulado,
    COALESCE(m.etapa_codigo, 'SIN_ETAPA') as etapa_codigo,
    COALESCE(e.nombre, m.etapa) as etapa_nombre,
    COUNT(*) as total_movimientos,
    SUM(m.tiene_pdf) as con_pdf,
    SUM(m.pdf_descargado) as pdf_descargados
FROM causas c
JOIN movimientos m ON m.causa_id = c.id
LEFT JOIN etapas_juicio e ON e.codigo = m.etapa_codigo
GROUP BY c.rit, c.caratulado, m.etapa_codigo, e.nombre, m.etapa;

-- ============================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================

DELIMITER //

-- Procedimiento: Registrar error de scraping
CREATE PROCEDURE `sp_registrar_error`(
    IN p_rit VARCHAR(50),
    IN p_tipo_error VARCHAR(100),
    IN p_mensaje TEXT,
    IN p_stack_trace LONGTEXT
)
BEGIN
    DECLARE v_causa_id INT;
    DECLARE v_error_id INT;
    
    -- Obtener causa_id si existe
    SELECT id INTO v_causa_id FROM causas WHERE rit = p_rit LIMIT 1;
    
    -- Verificar si ya existe un error similar no resuelto
    SELECT id INTO v_error_id 
    FROM errores_scraping 
    WHERE rit = p_rit 
      AND tipo_error = p_tipo_error 
      AND resuelto = 0 
    LIMIT 1;
    
    IF v_error_id IS NOT NULL THEN
        -- Actualizar error existente
        UPDATE errores_scraping 
        SET intentos = intentos + 1,
            ultimo_intento = NOW(),
            mensaje_error = p_mensaje,
            stack_trace = p_stack_trace
        WHERE id = v_error_id;
    ELSE
        -- Insertar nuevo error
        INSERT INTO errores_scraping (causa_id, rit, tipo_error, mensaje_error, stack_trace, ultimo_intento)
        VALUES (v_causa_id, p_rit, p_tipo_error, p_mensaje, p_stack_trace, NOW());
    END IF;
END //

-- Procedimiento: Verificar si debe reintentar scraping
CREATE PROCEDURE `sp_debe_reintentar`(
    IN p_rit VARCHAR(50),
    IN p_max_intentos INT,
    OUT p_debe_reintentar TINYINT
)
BEGIN
    DECLARE v_intentos INT DEFAULT 0;
    
    SELECT COALESCE(MAX(intentos), 0) INTO v_intentos
    FROM errores_scraping
    WHERE rit = p_rit AND resuelto = 0;
    
    SET p_debe_reintentar = IF(v_intentos < p_max_intentos, 1, 0);
END //

-- Procedimiento: Marcar causa como procesada exitosamente
CREATE PROCEDURE `sp_marcar_exito`(
    IN p_rit VARCHAR(50),
    IN p_total_movimientos INT,
    IN p_total_pdfs INT
)
BEGIN
    -- Actualizar causa
    UPDATE causas 
    SET fecha_ultimo_scraping = NOW(),
        scraping_exitoso = 1,
        total_movimientos = p_total_movimientos,
        total_pdfs = p_total_pdfs,
        error_scraping = NULL
    WHERE rit = p_rit;
    
    -- Marcar errores como resueltos
    UPDATE errores_scraping
    SET resuelto = 1,
        fecha_resolucion = NOW(),
        notas_resolucion = 'Resuelto automáticamente - scraping exitoso'
    WHERE rit = p_rit AND resuelto = 0;
    
    -- Log de éxito
    INSERT INTO scraping_log (rit, tipo, mensaje)
    VALUES (p_rit, 'SUCCESS', CONCAT('Scraping completado: ', p_total_movimientos, ' movimientos, ', p_total_pdfs, ' PDFs'));
END //

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- DATOS DE PRUEBA: 5 CAUSAS TEST
-- ============================================
INSERT INTO `causas` (`rit`, `tipo_causa`, `rol`, `anio`, `competencia_id`, `competencia_nombre`, `corte_id`, `corte_nombre`, `tribunal_id`, `tribunal_nombre`, `caratulado`) VALUES
('C-3030-2017', 'C', '3030', 2017, '3', 'Civil', '30', 'C.A. de Valparaíso', '61', '3º Juzgado Civil de Viña del Mar', 'CCAF LOS ANDES/SÁNCHEZ'),
('C-27311-2019', 'C', '27311', 2019, '3', 'Civil', '11', 'C.A. de Iquique', '11', '3º Juzgado de Letras de Iquique', 'BANCO CHILE/ROMERO'),
('C-571-2019', 'C', '571', 2019, '3', 'Civil', '40', 'C.A. de Talca', '124', '3º Juzgado de Letras de Talca', 'CAJA DE COMPENSACION DE ASIGNACION FAMILIAR'),
('C-9473-2019', 'C', '9473', 2019, '3', 'Civil', '20', 'C.A. de Copiapó', '31', '1º Juzgado de Letras de Copiapó', 'BANCO FALABELLA/AROS'),
('C-16322-2017', 'C', '16322', 2017, '3', 'Civil', '20', 'C.A. de Copiapó', '36', '1º Juzgado de Letras de Vallenar', 'BANCO DE CRÉDITO E INVERSIONES');

SELECT '✅ Schema creado exitosamente para MariaDB 5.5.68' as mensaje;
SELECT CONCAT('📊 Causas de prueba insertadas: ', COUNT(*)) as mensaje FROM causas;

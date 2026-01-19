-- ============================================
-- EJEMPLOS DE TRIGGERS PARA pjud_movimientos_intermedia
-- ============================================
-- Estos triggers se ejecutan automáticamente después de INSERT en la tabla intermedia
-- ============================================

USE codi_ejamtest;

-- ============================================
-- EJEMPLO 1: Copiar datos a una tabla final después de INSERT
-- ============================================
-- Este trigger copia automáticamente los datos insertados en la tabla intermedia
-- hacia una tabla final (por ejemplo, pjud_movimientos_final)

-- Primero, crear la tabla final si no existe (ejemplo)
CREATE TABLE IF NOT EXISTS pjud_movimientos_final (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rit VARCHAR(50),
  competencia_id INT,
  corte_id INT,
  tribunal_id INT,
  folio VARCHAR(20),
  doc_principal_nombre VARCHAR(255),
  doc_anexo_nombre VARCHAR(255),
  anexo_texto TEXT,
  etapa VARCHAR(100),
  tramite VARCHAR(100),
  desc_tramite TEXT,
  fec_tramite DATE,
  foja VARCHAR(20),
  georref VARCHAR(100),
  pdf_demanda_nombre VARCHAR(255),
  pdf_ebook_nombre VARCHAR(255),
  fecha_consulta_actual DATETIME,
  fecha_consulta_anterior DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rit (rit),
  INDEX idx_fec_tramite (fec_tramite)
);

-- Trigger que copia automáticamente después de INSERT
DELIMITER $$

DROP TRIGGER IF EXISTS after_insert_movimiento_intermedia$$

CREATE TRIGGER after_insert_movimiento_intermedia
AFTER INSERT ON pjud_movimientos_intermedia
FOR EACH ROW
BEGIN
  -- Copiar el movimiento a la tabla final
  INSERT INTO pjud_movimientos_final (
    rit, competencia_id, corte_id, tribunal_id, folio,
    doc_principal_nombre, doc_anexo_nombre, anexo_texto,
    etapa, tramite, desc_tramite, fec_tramite, foja, georref,
    pdf_demanda_nombre, pdf_ebook_nombre,
    fecha_consulta_actual, fecha_consulta_anterior
  ) VALUES (
    NEW.rit, NEW.competencia_id, NEW.corte_id, NEW.tribunal_id, NEW.folio,
    NEW.doc_principal_nombre, NEW.doc_anexo_nombre, NEW.anexo_texto,
    NEW.etapa, NEW.tramite, NEW.desc_tramite, NEW.fec_tramite, NEW.foja, NEW.georref,
    NEW.pdf_demanda_nombre, NEW.pdf_ebook_nombre,
    NEW.fecha_consulta_actual, NEW.fecha_consulta_anterior
  );
END$$

DELIMITER ;

-- ============================================
-- EJEMPLO 2: Actualizar una tabla de estadísticas
-- ============================================
-- Este trigger actualiza un contador de movimientos por RIT

-- Crear tabla de estadísticas si no existe
CREATE TABLE IF NOT EXISTS pjud_estadisticas_rit (
  rit VARCHAR(50) PRIMARY KEY,
  total_movimientos INT DEFAULT 0,
  ultimo_movimiento_fecha DATETIME,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Trigger que actualiza estadísticas
DELIMITER $$

DROP TRIGGER IF EXISTS actualizar_estadisticas_rit$$

CREATE TRIGGER actualizar_estadisticas_rit
AFTER INSERT ON pjud_movimientos_intermedia
FOR EACH ROW
BEGIN
  INSERT INTO pjud_estadisticas_rit (rit, total_movimientos, ultimo_movimiento_fecha)
  VALUES (NEW.rit, 1, NEW.fecha_consulta_actual)
  ON DUPLICATE KEY UPDATE
    total_movimientos = total_movimientos + 1,
    ultimo_movimiento_fecha = NEW.fecha_consulta_actual;
END$$

DELIMITER ;

-- ============================================
-- EJEMPLO 3: Validar y registrar movimientos importantes
-- ============================================
-- Este trigger detecta movimientos importantes (como "Demanda", "Sentencia", etc.)
-- y los registra en una tabla de eventos importantes

-- Crear tabla de eventos importantes
CREATE TABLE IF NOT EXISTS pjud_eventos_importantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rit VARCHAR(50),
  movimiento_id INT,
  tipo_evento VARCHAR(50), -- 'DEMANDA', 'SENTENCIA', 'TERMINADA', etc.
  desc_tramite TEXT,
  fec_tramite DATE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rit (rit),
  INDEX idx_tipo_evento (tipo_evento)
);

-- Trigger que detecta eventos importantes
DELIMITER $$

DROP TRIGGER IF EXISTS detectar_eventos_importantes$$

CREATE TRIGGER detectar_eventos_importantes
AFTER INSERT ON pjud_movimientos_intermedia
FOR EACH ROW
BEGIN
  DECLARE tipo_evento VARCHAR(50) DEFAULT NULL;
  
  -- Detectar tipo de evento basado en desc_tramite
  IF NEW.desc_tramite IS NOT NULL THEN
    IF LOWER(NEW.desc_tramite) LIKE '%demanda%' THEN
      SET tipo_evento = 'DEMANDA';
    ELSEIF LOWER(NEW.desc_tramite) LIKE '%sentencia%' THEN
      SET tipo_evento = 'SENTENCIA';
    ELSEIF LOWER(NEW.desc_tramite) LIKE '%terminada%' OR LOWER(NEW.desc_tramite) LIKE '%archivo%' THEN
      SET tipo_evento = 'TERMINADA';
    ELSEIF LOWER(NEW.desc_tramite) LIKE '%audiencia%' THEN
      SET tipo_evento = 'AUDIENCIA';
    END IF;
  END IF;
  
  -- Si se detectó un evento importante, registrarlo
  IF tipo_evento IS NOT NULL THEN
    INSERT INTO pjud_eventos_importantes (
      rit, movimiento_id, tipo_evento, desc_tramite, fec_tramite
    ) VALUES (
      NEW.rit, NEW.id, tipo_evento, NEW.desc_tramite, NEW.fec_tramite
    );
  END IF;
END$$

DELIMITER ;

-- ============================================
-- EJEMPLO 4: Log de cambios (auditoría)
-- ============================================
-- Este trigger registra todos los INSERT en una tabla de auditoría

-- Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS pjud_auditoria_movimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movimiento_id INT,
  accion VARCHAR(10) DEFAULT 'INSERT',
  rit VARCHAR(50),
  datos_anteriores JSON,
  datos_nuevos JSON,
  usuario VARCHAR(100) DEFAULT 'SCRAPING',
  fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_movimiento_id (movimiento_id),
  INDEX idx_rit (rit),
  INDEX idx_fecha_accion (fecha_accion)
);

-- Trigger de auditoría
DELIMITER $$

DROP TRIGGER IF EXISTS auditoria_insert_movimiento$$

CREATE TRIGGER auditoria_insert_movimiento
AFTER INSERT ON pjud_movimientos_intermedia
FOR EACH ROW
BEGIN
  INSERT INTO pjud_auditoria_movimientos (
    movimiento_id,
    accion,
    rit,
    datos_nuevos,
    usuario
  ) VALUES (
    NEW.id,
    'INSERT',
    NEW.rit,
    JSON_OBJECT(
      'competencia_id', NEW.competencia_id,
      'corte_id', NEW.corte_id,
      'tribunal_id', NEW.tribunal_id,
      'folio', NEW.folio,
      'etapa', NEW.etapa,
      'tramite', NEW.tramite,
      'desc_tramite', NEW.desc_tramite,
      'fec_tramite', NEW.fec_tramite
    ),
    'SCRAPING'
  );
END$$

DELIMITER ;

-- ============================================
-- EJEMPLO 5: Sincronizar con tabla de causas principal
-- ============================================
-- Este trigger actualiza o crea un registro en la tabla principal de causas
-- cuando se inserta un movimiento nuevo

-- Asumiendo que existe una tabla 'causa' con estructura similar
-- (ajusta según tu estructura real)

DELIMITER $$

DROP TRIGGER IF EXISTS sincronizar_causa_principal$$

CREATE TRIGGER sincronizar_causa_principal
AFTER INSERT ON pjud_movimientos_intermedia
FOR EACH ROW
BEGIN
  -- Actualizar o crear registro en tabla principal de causas
  -- NOTA: Ajusta los nombres de columnas según tu tabla 'causa' real
  INSERT INTO causa (
    rit,
    competencia_id,
    corte_id,
    tribunal_id,
    ultimo_movimiento_fecha,
    ultimo_movimiento_desc,
    fecha_ultima_consulta
  )
  VALUES (
    NEW.rit,
    NEW.competencia_id,
    NEW.corte_id,
    NEW.tribunal_id,
    NEW.fec_tramite,
    NEW.desc_tramite,
    NEW.fecha_consulta_actual
  )
  ON DUPLICATE KEY UPDATE
    ultimo_movimiento_fecha = NEW.fec_tramite,
    ultimo_movimiento_desc = NEW.desc_tramite,
    fecha_ultima_consulta = NEW.fecha_consulta_actual,
    updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;

-- ============================================
-- VERIFICAR TRIGGERS CREADOS
-- ============================================
-- Ejecuta esto para ver todos los triggers activos:

-- SHOW TRIGGERS FROM codi_ejamtest;

-- ============================================
-- ELIMINAR TRIGGERS (si necesitas desactivarlos)
-- ============================================
-- DROP TRIGGER IF EXISTS after_insert_movimiento_intermedia;
-- DROP TRIGGER IF EXISTS actualizar_estadisticas_rit;
-- DROP TRIGGER IF EXISTS detectar_eventos_importantes;
-- DROP TRIGGER IF EXISTS auditoria_insert_movimiento;
-- DROP TRIGGER IF EXISTS sincronizar_causa_principal;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Los triggers se ejecutan AUTOMÁTICAMENTE después de cada INSERT
-- 2. Si un trigger falla, TODO el INSERT falla (transacción)
-- 3. Los triggers pueden afectar el rendimiento si hacen operaciones pesadas
-- 4. Usa índices en las tablas que los triggers modifican
-- 5. Prueba los triggers con datos de prueba antes de usarlos en producción
-- ============================================



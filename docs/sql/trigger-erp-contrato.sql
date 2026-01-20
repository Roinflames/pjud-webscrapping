-- ============================================
-- TRIGGER PARA DETECTAR NUEVOS CONTRATOS EN ERP
-- ============================================
-- Este trigger se ejecuta cuando se inserta un nuevo contrato
-- en la base de datos del ERP y crea un evento de scraping
-- en la tabla pjud_eventos_scraping
-- ============================================
-- NOTA: Este trigger requiere que ambas bases de datos estén
-- en el mismo servidor MariaDB/MySQL o que uses FEDERATED engine
-- ============================================

-- Reemplaza estos valores con los de tu configuración:
-- @ERP_DATABASE: Nombre de la base de datos del ERP
-- @PJUD_DATABASE: Nombre de tu base de datos PJUD (ej: codi_ejamtest)

DELIMITER $$

-- ============================================
-- TRIGGER: Después de INSERT en tabla contrato
-- ============================================
DROP TRIGGER IF EXISTS trg_contrato_insert_scraping$$

CREATE TRIGGER trg_contrato_insert_scraping
AFTER INSERT ON contrato
FOR EACH ROW
BEGIN
  DECLARE v_rit VARCHAR(50);
  DECLARE v_competencia_id INT DEFAULT 3;
  DECLARE v_corte_id INT DEFAULT 90;
  DECLARE v_tribunal_id INT;
  DECLARE v_tipo_causa VARCHAR(10) DEFAULT 'C';
  DECLARE v_abogado_id INT;
  DECLARE v_causa_id INT;

  -- Extraer RIT desde el nuevo contrato
  SET v_rit = COALESCE(NEW.id_causa, NEW.rit, 
    CONCAT(IFNULL(NEW.rol, ''), '-', IFNULL(NEW.anio, '')));

  -- Si no hay RIT válido, salir
  IF v_rit IS NULL OR v_rit = '' OR v_rit = '-' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'No se pudo extraer RIT válido del contrato';
  END IF;

  -- Obtener configuración desde el contrato
  SET v_tribunal_id = COALESCE(NEW.tribunal_id, NEW.juzgado_id);
  SET v_competencia_id = COALESCE(NEW.competencia_id, NEW.materia_estrategia_id, 3);
  SET v_corte_id = COALESCE(NEW.corte_id, 90);
  SET v_tipo_causa = COALESCE(NEW.tipo_causa, NEW.letra, 'C');
  SET v_abogado_id = COALESCE(NEW.abogado_id, NEW.usuario_id);
  SET v_causa_id = COALESCE(NEW.causa_id, NEW.id_causa);

  -- Insertar evento de scraping en la base de datos PJUD
  -- NOTA: Esto solo funciona si ambas BD están en el mismo servidor
  -- Si están en servidores diferentes, usa el listener-erp.js en su lugar
  INSERT INTO codi_ejamtest.pjud_eventos_scraping (
    evento_tipo,
    rit,
    competencia_id,
    corte_id,
    tribunal_id,
    tipo_causa,
    abogado_id,
    causa_id,
    prioridad,
    erp_origen,
    erp_metadata,
    estado
  ) VALUES (
    'SCRAPING_ESPECIFICO',
    v_rit,
    v_competencia_id,
    v_corte_id,
    v_tribunal_id,
    v_tipo_causa,
    v_abogado_id,
    v_causa_id,
    5,
    'ERP_TRIGGER',
    JSON_OBJECT('contrato_id', NEW.id, 'fecha_insercion', NOW()),
    'PENDIENTE'
  );

END$$

DELIMITER ;

-- ============================================
-- VERIFICAR TRIGGER
-- ============================================
-- Para verificar que el trigger se creó correctamente:
-- SHOW TRIGGERS WHERE `Table` = 'contrato';

-- ============================================
-- ELIMINAR TRIGGER (si es necesario)
-- ============================================
-- DROP TRIGGER IF EXISTS trg_contrato_insert_scraping;

-- ============================================
-- NOTAS
-- ============================================
-- 1. Este trigger solo funciona si ambas bases de datos están
--    en el mismo servidor MariaDB/MySQL
-- 
-- 2. Si las bases de datos están en servidores diferentes,
--    usa el listener-erp.js que hace polling en la tabla del ERP
--
-- 3. Ajusta los nombres de columnas según tu esquema de contrato
--
-- 4. Asegúrate de que el usuario de la BD tenga permisos para
--    insertar en codi_ejamtest.pjud_eventos_scraping

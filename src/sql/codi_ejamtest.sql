-- phpMyAdmin SQL Dump
-- version 4.4.15.10
-- https://www.phpmyadmin.net
--
-- Servidor: localhost
-- Tiempo de generación: 09-12-2025 a las 02:21:06
-- Versión del servidor: 5.5.68-MariaDB
-- Versión de PHP: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `codi_ejamtest`
--
CREATE DATABASE IF NOT EXISTS `codi_ejamtest` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `codi_ejamtest`;

DELIMITER $$
--
-- Procedimientos
--
DROP PROCEDURE IF EXISTS `fsp_Contratos_Sel`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_Contratos_Sel`()
BEGIN
select 
min(id) as contrato_id_Min,
max(id) as contrato_id_Max
from contrato;
END$$

DROP PROCEDURE IF EXISTS `fsp_Cuotas_a_Vencer_Sel`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_Cuotas_a_Vencer_Sel`(IN `fecha` DATE, IN `fecha_hoy` DATE)
BEGIN
select 
contrato.id as contrato_id,
cuota.id as cuota_id,
contrato.nombre,
contrato.email,
cuota.fecha_pago,
cuota.monto-
			case 
				when ISNULL(cuota.pagado)=1 then 0 
                else cuota.pagado
            end 
            as deuda,
f_html_cliente(3,contrato.nombre,cuota.monto-
			case 
				when ISNULL(cuota.pagado)=1 then 0 
                else cuota.pagado
            end ,cuota.fecha_pago,'00:00',cuota.fecha_pago) as template
 from cuota,contrato
 where cuota.contrato_id=contrato.id
 and cuota.anular IS NULL
 and cuota.monto-
			case 
				when ISNULL(cuota.pagado)=1 then 0 
                else cuota.pagado
            end >0
and  cuota.fecha_pago=DATE_ADD(fecha, INTERVAL 2 DAY)
and cuota.id not in 
			( select cuota_id from mails_enviados 
						where tipo_envio_id=3
                        and mails_enviados.cuota_id=cuota.id
                        and cast(fecha_enviado as date)=fecha_hoy
			);
END$$

DROP PROCEDURE IF EXISTS `fsp_Estado_de_Cuenta_Sel`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_Estado_de_Cuenta_Sel`(IN `contrato_id` INT, IN `fecha` DATE)
BEGIN
select 
contrato.id as contrato_id,
cuota.id as cuota_id,
contrato.nombre,
contrato.email,
cuota.numero,
cuota.fecha_pago as Vence,
cuota.monto,
case 
when ISNULL(cuota.pagado)=1 then 0 
else cuota.pagado
end 
as pagado,
f_html_cliente(2,contrato.nombre,-999,cuota.fecha_pago) as template
from cuota,contrato
where cuota.contrato_id=contrato.id
and contrato.id=contrato_id
and contrato.id not in 
(select contrato_id from mails_enviados where mails_enviados.contrato_id=contrato_id and cast(fecha_enviado as date)=fecha and tipo_envio_id=2)
order by cuota.numero;
END$$

DROP PROCEDURE IF EXISTS `fsp_Last_Envios_Sel`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_Last_Envios_Sel`(
)
BEGIN
DECLARE v_envio_1 int;
DECLARE v_envio_2 int;
DECLARE v_envio_3 int;
SET v_envio_1 = (select max(id) from mails_enviados where tipo_envio_id=1);
SET v_envio_2 = (select max(id) from mails_enviados where tipo_envio_id=2);
SET v_envio_3 = (select max(id) from mails_enviados where tipo_envio_id=3);
select  

	IFNULL(v_envio_1,0) AS anvio1,
    IFNULL(v_envio_2,0) AS anvio2,
    IFNULL(v_envio_3,0) AS anvio3;
END$$

DROP PROCEDURE IF EXISTS `fsp_l_Buscar_Contratos_Cliente_Sel`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_l_Buscar_Contratos_Cliente_Sel`(IN `p_rut` VARCHAR(255))
    NO SQL
BEGIN

CREATE TEMPORARY TABLE temp_DEUDA AS

select 

UPPER('Civil') AS tipo_contrato,
contrato.rut as rut ,
contrato.id as contrato_id,
contrato.nombre,

min(cuota.fecha_pago) as Vto,
sum(cuota.monto-
			case 
				when ISNULL(cuota.pagado)=1 then 0 
                else cuota.pagado
            end )
            as deuda,
sum(
			case 
				when DATE(cuota.fecha_pago)>CURDATE() then 
					case 
						when ISNULL(cuota.pagado)=1 then cuota.monto-0 
						else cuota.monto-cuota.pagado
					end 
				
                else 0
            end )
            as aldia,
            
            sum(
			case 
				when DATE(cuota.fecha_pago)<=CURDATE() then 
					case 
						when ISNULL(cuota.pagado)=1 then cuota.monto-0 
						else cuota.monto-cuota.pagado
					end 
				
                else 0
            end )
            as vencida

 from cuota,contrato
 
 where contrato.rut=p_rut
 and cuota.contrato_id=contrato.id
 
 
 and cuota.monto-
			case 
				when ISNULL(cuota.pagado)=1 then 0 
                else cuota.pagado
            end >0
            
group by tipo_contrato,contrato.rut,contrato.id,contrato.nombre;


select 

*,
case 
	when vencida=0 then 'FECHA VENCIMIENTO'
    else 'ESTAS ATRASADO DESDE EL'
end as leyenda_vto,
case 
	when vencida=0 then aldia
    else vencida
    end as primer_monto

 from temp_DEUDA
 
 order by contrato_id;


DROP TEMPORARY TABLE temp_DEUDA;


 
END$$

DROP PROCEDURE IF EXISTS `fsp_l_Buscar_Contrato_Cuotas_Impagas_Sel`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_l_Buscar_Contrato_Cuotas_Impagas_Sel`(IN `p_contrato_id` INT)
    NO SQL
BEGIN

select 


contrato.id as contrato_id,
contrato.nombre,

DATE_FORMAT(fecha_pago, '%Y/%m/%d') as Vto,
cuota.monto-
			case 
				when ISNULL(cuota.pagado)=1 then 0 
                else cuota.pagado
            end 
            as monto

 from cuota,contrato
 
 where cuota.contrato_id=contrato.id
 and cuota.contrato_id=p_contrato_id 
 
 
 and cuota.monto-
			case 
				when ISNULL(cuota.pagado)=1 then 0 
                else cuota.pagado
            end >0
            
order by cuota.contrato_id,cuota.fecha_pago;


END$$

DROP PROCEDURE IF EXISTS `fsp_l_Buscar_Rut_Sel`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_l_Buscar_Rut_Sel`(IN `p_rut` VARCHAR(255))
    NO SQL
BEGIN 
select 
	contrato.id as contrato_id, 
	contrato - nombre, 
	contrato.rut as rut 
from 
	contrato 
where 
	contrato.rut = p_rut; 
END$$

DROP PROCEDURE IF EXISTS `fsp_l_gateway_aplicar_pago`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_l_gateway_aplicar_pago`(IN `p_id_pago` INT, IN `p_contrato_id` INT, IN `p_pago` INT)
BEGIN




DECLARE done INT DEFAULT 0;


DECLARE v_generadorid int;
DECLARE v_Saldo int DEFAULT p_pago;
DECLARE v_Deuda int;

DECLARE v_imputado int;

DECLARE v_ncomprobante varchar(255);
DECLARE v_comprobante varchar(255);

-- Busca datos del pago 

DECLARE Cursor9 CURSOR FOR  select id,
	

		(monto - 
					case 
						when ISNULL(cuota.pagado)=1 then 0 
                        else cuota.pagado
					 end ) AS Deuda
        FROM cuota
        WHERE contrato_id=p_contrato_id
        and (monto - 
					case 
						when ISNULL(cuota.pagado)=1 then 0 
                        else cuota.pagado
					 end ) >0
                     
        -- ORDER BY id;
        ORDER BY fecha_pago;
     
    
 DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

 Open Cursor9 ;
	label: LOOP
  

	FETCH Cursor9 INTO v_generadorid,v_Deuda;

	IF v_Saldo IS NULL OR v_Saldo <= 0 THEN
            LEAVE label;
        END IF;	
        
        
        IF v_Saldo >= v_Deuda THEN
            -- Pago completo de la cuota
            
			set v_imputado=v_Deuda;

            update cuota 
            
            set pagado=
					case 
						when ISNULL(cuota.pagado)=1 then v_Deuda 
                        else cuota.pagado+v_Deuda
					 end

            WHERE id = v_generadorid;

            SET v_Saldo = v_Saldo - v_Deuda;
            
            -- Actualiza Contrato proximo_vencimiento	
            
            update contrato 

			set proximo_vencimiento=

						(select fecha_pago from cuota where contrato_id=p_contrato_id and numero=( select numero+1 from cuota where id=v_generadorid))
    
				where id=p_contrato_id;
          
  
		ELSE
        
            -- Pago parcial cuota
            
            set v_imputado=v_Saldo;
            
            update cuota 
            
            set pagado=
					case 
						when ISNULL(cuota.pagado)=1 then v_Saldo
                        else cuota.pagado+v_Saldo
					 end
                     
            WHERE id = v_generadorid;

            SET v_Saldo = 0;
            
   
		
        END IF;
	
		-- Inserta en Tabla Pago
        
        select ext_ref_pago into v_ncomprobante from gateway_pagos_solicitados_header where id=p_id_pago;
        
        -- SELECT CONCAT(CAST(p_contrato_id AS CHAR(100)), '_', v_ncomprobante,'pdf')  into v_comprobante;
        
        INSERT INTO pago
				(
				pago_tipo_id,
				pago_canal_id,
				usuario_registro_id,
				monto,
				boleta,
				observacion,
				fecha_pago,
				hora_pago,
				fecha_registro,
				cuenta_corriente_id,
				fecha_ingreso,
				ncomprobante,
				comprobante,
				usuario_anulacion_id,
				anulado,
				fecha_anulacion,
                contrato_id)
				VALUES

				(

				 4,     -- 	pago_tipo_id,
				 5,     -- 	pago_canal_id,
				 1,     -- 	usuario_registro_id,
				 v_imputado,    -- 	monto,
				 null,    -- 	boleta,
				 'Recepcionado por pago en linea',-- 	observacion,
				 NOW(),-- 	fecha_pago,
				 CURTIME(),-- 	hora_pago,
				 NOW(),-- 	fecha_registro,
				 4,     -- 	cuenta_corriente_id,
				 NOW(),-- 	fecha_ingreso,
				 v_ncomprobante,-- 	ncomprobante,
				 'nodisponible.png',-- 	comprobante,
				 null,-- 	usuario_anulacion_id,
				 null, -- 	anulado,
				 null, -- 	fecha_anulacion
				p_contrato_id
				);
                
                
                -- Inserta en Tabla pago_cuotas
                
                INSERT INTO pago_cuotas
				(
					pago_id, 
                    cuota_id, 
                    monto
				)
                
                values 
                
                (
                
					LAST_INSERT_ID(),
                    v_generadorid,
                    v_imputado
                    
                
                );
		

	

    -- Fetch the next row
    FETCH Cursor9 INTO v_generadorid,v_Deuda;
    

		

 IF done = 1 THEN 
	LEAVE label;
  END IF;
      
      END LOOP;
      CLOSE Cursor9;
    






END$$

DROP PROCEDURE IF EXISTS `fsp_l_gateway_aplicar_pago_todos`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_l_gateway_aplicar_pago_todos`(IN p_id_pago INT)
BEGIN
    DECLARE v_contrato_id INT;
    DECLARE v_pago DECIMAL(10,2);
    DECLARE v_apagar DECIMAL(10,2);
    DECLARE v_id_cuota INT;
    DECLARE done_cuotas INT DEFAULT 0;


    DECLARE cur_cuotas CURSOR FOR SELECT id, apagar FROM Estas_Cuotas;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done_cuotas = 1;


    SELECT contrato_id, monto_solicitud
    INTO v_contrato_id, v_pago
    FROM gateway_pagos_solicitados_detail
    WHERE id = p_id_pago;

    CREATE TEMPORARY TABLE IF NOT EXISTS Estas_Cuotas AS
        SELECT id, (monto - IFNULL(pagado, 0)) AS apagar
        FROM (
            SELECT *,
                   (@running_total := @running_total + (monto - IFNULL(pagado, 0))) AS cumulative_unpaid
            FROM cuota, (SELECT @running_total := 0) AS vars
            WHERE contrato_id = v_contrato_id
              AND (monto - IFNULL(pagado, 0)) > 0
            ORDER BY fecha_pago ASC
        ) AS cuotas_con_acumulado
        WHERE cumulative_unpaid - (monto - IFNULL(pagado, 0)) < v_pago;

    OPEN cur_cuotas;

    read_cuotas: LOOP
        FETCH cur_cuotas INTO v_id_cuota, v_apagar;
        IF done_cuotas THEN
            LEAVE read_cuotas;
        END IF;

      
        CALL fsp_l_gateway_aplicar_pago(p_id_pago, v_contrato_id, v_apagar);

    END LOOP;

    CLOSE cur_cuotas;
    DROP TEMPORARY TABLE IF EXISTS Estas_Cuotas;
END$$

DROP PROCEDURE IF EXISTS `fsp_l_gateway_genera_pago_ext_Up`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_l_gateway_genera_pago_ext_Up`(p_id int,p_gateway_id int,p_id_estado int,p_ext_ref_pago varchar(100))
BEGIN

/* Estados
 1 = solicitado 
 2 = enviado al gateway 1 KHIPU 2 TRANSBANK
 3 = procesado bien por el gateway
 4 = procesado mal por el gateway
*/

UPDATE gateway_pagos_solicitados_header

set 
gateway_id=p_gateway_id,
id_estado=p_id_estado,
ext_ref_pago=p_ext_ref_pago

WHERE id=p_id;

 
END$$

DROP PROCEDURE IF EXISTS `fsp_l_gateway_pagos_solicitados_header_Estado_Up`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_l_gateway_pagos_solicitados_header_Estado_Up`(IN `p_id` INT, IN `p_id_estado` INT)
    NO SQL
BEGIN




UPDATE gateway_pagos_solicitados_header

set id_estado=p_id_estado

WHERE id=p_id

and case 
		when p_id_estado=2 then 1
        else 
        id_estado
	end ;
 
END$$

DROP PROCEDURE IF EXISTS `fsp_l_gateway_pagos_solicitados_header_Sel`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_l_gateway_pagos_solicitados_header_Sel`(IN `p_id_pago` INT)
    NO SQL
BEGIN


select 
gateway_pagos_solicitados_header.rut,
(select email from contrato where contrato.rut =gateway_pagos_solicitados_header.rut limit 1) as email,
gateway_pagos_solicitados_header.monto_total_solicitud

from gateway_pagos_solicitados_header


where gateway_pagos_solicitados_header.id=p_id_pago;




call fsp_l_gateway_pagos_solicitados_header_Estado_Up(p_id_pago,2);


 
END$$

DROP PROCEDURE IF EXISTS `fsp_Mails_Enviados_Ins_Upd`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_Mails_Enviados_Ins_Upd`(IN `tipo_envio_id` INT, IN `fecha_enviado` DATETIME, IN `contrato_id` INT, IN `pago_cuota_id` INT, IN `pago_id` INT, IN `cuota_id` INT, IN `estado` INT)
BEGIN

insert INTo mails_enviados(tipo_envio_id, fecha_enviado, contrato_id, pago_cuota_id, pago_id, cuota_id, estado)
values(tipo_envio_id, fecha_enviado, contrato_id, pago_cuota_id, pago_id, cuota_id, estado);
END$$

DROP PROCEDURE IF EXISTS `fsp_Pagos_Recibidos_Sel`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_Pagos_Recibidos_Sel`(IN `fecha` DATE)
BEGIN
select
pago.contrato_id,
pago.id as pago_id,
-999 as cuota_id,
-999  as pago_cuotas_id,
contrato.nombre,
contrato.email,
pago.fecha_pago,
pago.hora_pago,
pago.fecha_registro,
pago.fecha_ingreso,
pago.monto,
pago.comprobante ,
f_html_cliente(1,contrato.nombre,pago.monto,pago.fecha_pago,pago.hora_pago,pago.fecha_registro) as template
from pago,contrato
where  pago.contrato_id=contrato.id
and cast(pago.fecha_registro as date)<=cast(fecha as date)
and pago.anulado IS NULL 
and pago.id not in 
(select pago_id from mails_enviados where estado=1)
and cast(pago.fecha_registro as date)>'2024-08-15'
order by pago.id;
END$$

DROP PROCEDURE IF EXISTS `fsp_Testigo_Enviados`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `fsp_Testigo_Enviados`(
p_tipo_envio_id INT,
p_ultimo_id_enviado int
)
BEGIN
DECLARE v_enviados int;
SET  v_enviados=(select count(id)  from mails_enviados where tipo_envio_id=p_tipo_envio_id and id>p_ultimo_id_enviado);
select 'Se han enviado '+CONVERT(v_enviados,char)+' mails' as mensaje;
END$$

DROP PROCEDURE IF EXISTS `lsp_gateway_pagos_solicitados_detail_Ins`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `lsp_gateway_pagos_solicitados_detail_Ins`(IN `p_gateway_pagos_solicitado_id` INT, IN `p_contrato_id` INT, IN `p_monto_solicitud` INT, IN `p_observaciones` VARCHAR(100))
    NO SQL
BEGIN


insert INTo gateway_pagos_solicitados_detail

(
	gateway_pagos_solicitado_id, 
	contrato_id,
	monto_solicitud, 
	observaciones

)

values

(

	p_gateway_pagos_solicitado_id, 
	p_contrato_id,
	p_monto_solicitud, 
	p_observaciones

	
);


 
 
END$$

DROP PROCEDURE IF EXISTS `lsp_gateway_pagos_solicitados_Header_Ins`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `lsp_gateway_pagos_solicitados_Header_Ins`(OUT `p_generadorid` INT, IN `p_gateway_id` INT, IN `p_rut` VARCHAR(255), IN `p_fecha_solicitud` DATETIME, IN `p_monto_total_solicitud` FLOAT, IN `p_id_ejecutado` INT, IN `p_id_estado` INT, IN `p_observaciones` VARCHAR(100))
    NO SQL
BEGIN


insert INTo gateway_pagos_solicitados_header

(
	gateway_id, 
	rut, 
	fecha_solicitud,
	monto_total_solicitud,
	id_ejecutado, 
	id_estado,
	observaciones,
    ext_ref_pago
)

values

(

	-999, 
	p_rut, 
	p_fecha_solicitud,
	p_monto_total_solicitud,
	p_id_ejecutado, 
	p_id_estado,
	p_observaciones,
    '-999'
	
);

SET p_generadorid= LAST_INSERT_ID();
 
 
END$$

DROP PROCEDURE IF EXISTS `lsp_gateway_pagos_solicitados_Ins`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `lsp_gateway_pagos_solicitados_Ins`(IN `p_gateway_id` INT, IN `p_rut` VARCHAR(255), IN `p_contrato_id` INT, IN `p_fecha_solicitud` DATETIME, IN `p_monto_solicitud` FLOAT, IN `p_id_ejecutado` INT, IN `p_id_estado` INT, IN `p_observaciones` VARCHAR(100))
    NO SQL
BEGIN


insert INTo mails_enviados

(
	gateway_id, 
	rut, 
	contrato_id,
	fecha_solicitud,
	monto_solicitud,
	id_ejecutado, 
	id_estado,
	observaciones
)

values

(
	p_gateway_id, 
	p_rut, 
	p_contrato_id,
	p_fecha_solicitud,
	p_monto_solicitud,
	p_id_ejecutado, 
	p_id_estado,
	p_observaciones);
 
 
END$$

--
-- Funciones
--
DROP FUNCTION IF EXISTS `f_html_cliente`$$
CREATE DEFINER=`root`@`localhost` FUNCTION `f_html_cliente`(`id_template` INT, `nombre` VARCHAR(45), `MONTO` INT, `fecha_pago` DATE, `hora_pago` TIME, `fecha_ingreso` DATE) RETURNS text CHARSET latin1
    READS SQL DATA
    DETERMINISTIC
BEGIN

DECLARE html_cliente text ;
DECLARE texto  varchar(50);
DECLARE hora  varchar(50);
set texto=convert(DATE_FORMAT(fecha_pago,'%d/%m/%Y'),CHAR);
set hora=convert(DATE_FORMAT(hora_pago, '%H:%i'),CHAR);
set hora=concat(hora,' hrs.');

set texto=concat(texto,' ',hora);

SELECT  html_template INTO html_cliente FROM html_tempaltes WHERE ID = id_template;
SET html_cliente=REPLACE(html_cliente,'@nombre',nombre);
SET html_cliente=REPLACE(html_cliente,'@monto',FORMAT(monto,0, 'de_DE'));

SET html_cliente=REPLACE(html_cliente,'@fechapago',texto);
SET html_cliente=REPLACE(html_cliente,'@fechaingreso',DATE_FORMAT(fecha_ingreso,'%d/%m/%Y'));
RETURN html_cliente ;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `accion`
--

DROP TABLE IF EXISTS `accion`;
CREATE TABLE IF NOT EXISTS `accion` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `actuacion`
--

DROP TABLE IF EXISTS `actuacion`;
CREATE TABLE IF NOT EXISTS `actuacion` (
  `id` int(11) NOT NULL,
  `cuaderno_id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `actuacion_anexo_procesal`
--

DROP TABLE IF EXISTS `actuacion_anexo_procesal`;
CREATE TABLE IF NOT EXISTS `actuacion_anexo_procesal` (
  `id` int(11) NOT NULL,
  `actuacion_id` int(11) NOT NULL,
  `anexo_procesal_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `agenda`
--

DROP TABLE IF EXISTS `agenda`;
CREATE TABLE IF NOT EXISTS `agenda` (
  `id` int(11) NOT NULL,
  `cuenta_id` int(11) DEFAULT NULL,
  `gestionar_id` int(11) DEFAULT NULL,
  `agendador_id` int(11) DEFAULT NULL,
  `sucursal_id` int(11) DEFAULT NULL,
  `campania` varchar(255) CHARACTER SET utf8 COLLATE utf8_spanish_ci NOT NULL,
  `nombre_cliente` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_cliente` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono_cliente` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ciudad_cliente` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_carga` datetime DEFAULT NULL,
  `fecha_asignado` datetime DEFAULT NULL,
  `status_id` int(11) DEFAULT NULL,
  `detalle_cliente` longtext COLLATE utf8mb4_unicode_ci,
  `abogado_id` int(11) DEFAULT NULL,
  `monto` decimal(10,0) DEFAULT NULL,
  `reunion_id` int(11) DEFAULT NULL,
  `observacion` longtext COLLATE utf8mb4_unicode_ci,
  `rut_cliente` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono_recado_cliente` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_contrato` datetime DEFAULT NULL,
  `lead` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `form_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agenda_contacto_id` int(11) DEFAULT NULL,
  `pago_actual` decimal(10,0) DEFAULT NULL,
  `sub_status_id` int(11) DEFAULT NULL,
  `canal_id` int(11) DEFAULT NULL,
  `fecha_seguimiento` datetime DEFAULT NULL,
  `obs_formulario` longtext COLLATE utf8mb4_unicode_ci,
  `id_ghl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `agenda_contacto`
--

DROP TABLE IF EXISTS `agenda_contacto`;
CREATE TABLE IF NOT EXISTS `agenda_contacto` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `agenda_observacion`
--

DROP TABLE IF EXISTS `agenda_observacion`;
CREATE TABLE IF NOT EXISTS `agenda_observacion` (
  `id` int(11) NOT NULL,
  `agenda_id` int(11) NOT NULL,
  `usuario_registro_id` int(11) NOT NULL,
  `status_id` int(11) DEFAULT NULL,
  `fecha_registro` datetime NOT NULL,
  `observacion` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `sub_status_id` int(11) DEFAULT NULL,
  `abogado_destino_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `agenda_status`
--

DROP TABLE IF EXISTS `agenda_status`;
CREATE TABLE IF NOT EXISTS `agenda_status` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `perfil` int(11) NOT NULL,
  `orden` int(11) DEFAULT NULL,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vermas` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `agenda_sub_status`
--

DROP TABLE IF EXISTS `agenda_sub_status`;
CREATE TABLE IF NOT EXISTS `agenda_sub_status` (
  `id` int(11) NOT NULL,
  `agenda_status_id` int(11) DEFAULT NULL,
  `nombre` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `anexo_procesal`
--

DROP TABLE IF EXISTS `anexo_procesal`;
CREATE TABLE IF NOT EXISTS `anexo_procesal` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `canal`
--

DROP TABLE IF EXISTS `canal`;
CREATE TABLE IF NOT EXISTS `canal` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `usuario_registro_id` int(11) NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cartera`
--

DROP TABLE IF EXISTS `cartera`;
CREATE TABLE IF NOT EXISTS `cartera` (
  `id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `nombre` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` tinyint(1) NOT NULL,
  `orden` int(11) NOT NULL,
  `utilizado` tinyint(1) NOT NULL,
  `asignado` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `causa`
--

DROP TABLE IF EXISTS `causa`;
CREATE TABLE IF NOT EXISTS `causa` (
  `id` int(11) NOT NULL,
  `agenda_id` int(11) NOT NULL,
  `materia_estrategia_id` int(11) NOT NULL,
  `juzgado_cuenta_id` int(11) DEFAULT NULL,
  `id_causa` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `causa_nombre` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` tinyint(1) DEFAULT NULL,
  `anexo_id` int(11) DEFAULT NULL,
  `fecha_ultimo_ingreso` datetime DEFAULT NULL,
  `causa_finalizada` tinyint(1) DEFAULT '0',
  `fecha_finalizado` datetime DEFAULT NULL,
  `letra` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `anio` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `causa_observacion`
--

DROP TABLE IF EXISTS `causa_observacion`;
CREATE TABLE IF NOT EXISTS `causa_observacion` (
  `id` int(11) NOT NULL,
  `causa_id` int(11) NOT NULL,
  `usuario_registro_id` int(11) NOT NULL,
  `contrato_id` int(11) NOT NULL,
  `fecha_registro` datetime NOT NULL,
  `observacion` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalle_cuaderno_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `causa_observacion_archivo`
--

DROP TABLE IF EXISTS `causa_observacion_archivo`;
CREATE TABLE IF NOT EXISTS `causa_observacion_archivo` (
  `id` int(11) NOT NULL,
  `causa_observacion_id` int(11) NOT NULL,
  `nombre_archivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_original` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ciudad`
--

DROP TABLE IF EXISTS `ciudad`;
CREATE TABLE IF NOT EXISTS `ciudad` (
  `id` int(11) NOT NULL,
  `region_id` int(11) NOT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cliente_potencial`
--

DROP TABLE IF EXISTS `cliente_potencial`;
CREATE TABLE IF NOT EXISTS `cliente_potencial` (
  `id` int(11) NOT NULL,
  `form_id` double DEFAULT NULL,
  `leadgen_id` double DEFAULT NULL,
  `page_id` double DEFAULT NULL,
  `created_time` double DEFAULT NULL,
  `campos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cobranza`
--

DROP TABLE IF EXISTS `cobranza`;
CREATE TABLE IF NOT EXISTS `cobranza` (
  `id` int(11) NOT NULL,
  `funcion_id` int(11) DEFAULT NULL,
  `respuesta_id` int(11) DEFAULT NULL,
  `cuota_id` int(11) DEFAULT NULL,
  `fecha_hora` datetime NOT NULL,
  `fecha_compromiso` datetime DEFAULT NULL,
  `observacion` longtext COLLATE utf8mb4_unicode_ci,
  `is_nulo` tinyint(1) DEFAULT NULL,
  `usuario_registro_id` int(11) NOT NULL,
  `fecha` date DEFAULT NULL,
  `contrato_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cobranza_funcion`
--

DROP TABLE IF EXISTS `cobranza_funcion`;
CREATE TABLE IF NOT EXISTS `cobranza_funcion` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cobranza_respuesta`
--

DROP TABLE IF EXISTS `cobranza_respuesta`;
CREATE TABLE IF NOT EXISTS `cobranza_respuesta` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_fecha_compromiso` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comuna`
--

DROP TABLE IF EXISTS `comuna`;
CREATE TABLE IF NOT EXISTS `comuna` (
  `id` int(11) NOT NULL,
  `ciudad_id` int(11) NOT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion`
--

DROP TABLE IF EXISTS `configuracion`;
CREATE TABLE IF NOT EXISTS `configuracion` (
  `id` int(11) NOT NULL,
  `dia_fondo_fijo` int(11) NOT NULL,
  `host` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verify_token` longtext COLLATE utf8mb4_unicode_ci,
  `access_token` longtext COLLATE utf8mb4_unicode_ci,
  `lotes` int(11) DEFAULT NULL,
  `valor_multa` int(11) DEFAULT NULL,
  `toku_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `toku_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_dias_comision` int(11) NOT NULL,
  `deuda_minima` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contrato`
--

DROP TABLE IF EXISTS `contrato`;
CREATE TABLE IF NOT EXISTS `contrato` (
  `id` int(11) NOT NULL,
  `estado_civil_id` int(11) DEFAULT NULL,
  `situacion_laboral_id` int(11) DEFAULT NULL,
  `estrategia_juridica_id` int(11) DEFAULT NULL,
  `escritura_id` int(11) DEFAULT NULL,
  `agenda_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ciudad` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rut` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comuna` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `titulo_contrato` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `monto_nivel_deuda` decimal(10,0) DEFAULT NULL,
  `monto_contrato` decimal(10,0) DEFAULT NULL,
  `cuotas` int(11) DEFAULT NULL,
  `valor_cuota` decimal(10,0) DEFAULT NULL,
  `interes` decimal(5,2) DEFAULT NULL,
  `dia_pago` int(11) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT NULL,
  `sucursal_id` int(11) DEFAULT NULL,
  `tramitador_id` int(11) DEFAULT NULL,
  `cliente_id` int(11) DEFAULT NULL,
  `clave_unica` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono_recado` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_primer_pago` datetime DEFAULT NULL,
  `pais_id` int(11) DEFAULT NULL,
  `vehiculo_id` int(11) DEFAULT NULL,
  `vivienda_id` int(11) DEFAULT NULL,
  `reunion_id` int(11) DEFAULT NULL,
  `pdf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_abono` tinyint(1) DEFAULT NULL,
  `primera_cuota` double DEFAULT NULL,
  `fecha_primera_cuota` date DEFAULT NULL,
  `observacion` longtext COLLATE utf8mb4_unicode_ci,
  `fecha_ultimo_pago` date DEFAULT NULL,
  `is_finalizado` tinyint(1) DEFAULT NULL,
  `lote` int(11) DEFAULT NULL,
  `pdf_termino` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_termino` datetime DEFAULT NULL,
  `vigencia` int(11) DEFAULT NULL,
  `fecha_desiste` datetime DEFAULT NULL,
  `fecha_pdf_anexo` datetime DEFAULT NULL,
  `fecha_compromiso` date DEFAULT NULL,
  `ultima_funcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q_mov` int(11) DEFAULT NULL,
  `folio` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_lote_id` int(11) DEFAULT NULL,
  `ccomuna_id` int(11) DEFAULT NULL,
  `cciudad_id` int(11) DEFAULT NULL,
  `cregion_id` int(11) DEFAULT NULL,
  `sexo` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_anexo` tinyint(1) DEFAULT NULL,
  `proximo_vencimiento` date DEFAULT NULL,
  `fecha_ultima_gestion` date DEFAULT NULL,
  `pago_actual` decimal(10,0) DEFAULT NULL,
  `is_total` tinyint(1) DEFAULT NULL,
  `cartera_orden` int(11) NOT NULL,
  `cartera_id` int(11) DEFAULT NULL,
  `is_incorporacion` tinyint(1) DEFAULT NULL,
  `grupo_id` int(11) DEFAULT NULL,
  `estado_encuesta_id` int(11) DEFAULT NULL,
  `observacion_encuesta` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_encuesta` datetime DEFAULT NULL,
  `qty_encuesta` int(11) DEFAULT '0',
  `qty_gestion_encuesta` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contrato_anexo`
--

DROP TABLE IF EXISTS `contrato_anexo`;
CREATE TABLE IF NOT EXISTS `contrato_anexo` (
  `id` int(11) NOT NULL,
  `contrato_id` int(11) NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `pdf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_desiste` tinyint(1) NOT NULL,
  `folio` int(11) DEFAULT NULL,
  `monto_contrato` double DEFAULT NULL,
  `is_abono` tinyint(1) DEFAULT NULL,
  `abono` double DEFAULT NULL,
  `is_total` tinyint(1) DEFAULT NULL,
  `n_cuotas` int(11) DEFAULT NULL,
  `valor_cuota` double DEFAULT NULL,
  `dias_pago` int(11) DEFAULT NULL,
  `fecha_primer_pago` date DEFAULT NULL,
  `vigencia` int(11) DEFAULT NULL,
  `observacion` longtext COLLATE utf8mb4_unicode_ci,
  `tipo_anexo` smallint(6) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT NULL,
  `usuario_registro_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contrato_archivos`
--

DROP TABLE IF EXISTS `contrato_archivos`;
CREATE TABLE IF NOT EXISTS `contrato_archivos` (
  `id` int(11) NOT NULL,
  `usuario_registro_id` int(11) NOT NULL,
  `contrato_id` int(11) NOT NULL,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_subida` datetime NOT NULL,
  `causa_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contrato_audios`
--

DROP TABLE IF EXISTS `contrato_audios`;
CREATE TABLE IF NOT EXISTS `contrato_audios` (
  `id` int(11) NOT NULL,
  `contrato_id` int(11) NOT NULL,
  `usuario_registro_id` int(11) NOT NULL,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contrato_casetracking`
--

DROP TABLE IF EXISTS `contrato_casetracking`;
CREATE TABLE IF NOT EXISTS `contrato_casetracking` (
  `id` int(11) NOT NULL,
  `contrato_id` int(11) NOT NULL,
  `nombre_archivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `materia_id` int(11) DEFAULT NULL,
  `usuario_carga` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_subida` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contrato_mee`
--

DROP TABLE IF EXISTS `contrato_mee`;
CREATE TABLE IF NOT EXISTS `contrato_mee` (
  `id` int(11) NOT NULL,
  `contrato_id` int(11) NOT NULL,
  `mee_id` int(11) DEFAULT NULL,
  `mees` longtext COLLATE utf8mb4_unicode_ci COMMENT '(DC2Type:array)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contrato_observacion`
--

DROP TABLE IF EXISTS `contrato_observacion`;
CREATE TABLE IF NOT EXISTS `contrato_observacion` (
  `id` int(11) NOT NULL,
  `usuario_registro_id` int(11) NOT NULL,
  `contrato_id` int(11) NOT NULL,
  `fecha_registro` datetime NOT NULL,
  `observacion` longtext COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contrato_rol`
--

DROP TABLE IF EXISTS `contrato_rol`;
CREATE TABLE IF NOT EXISTS `contrato_rol` (
  `id` int(11) NOT NULL,
  `juzgado_id` int(11) DEFAULT NULL,
  `contrato_id` int(11) DEFAULT NULL,
  `nombre_rol` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `institucion_acreedora` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abogado_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contrato_vehiculo`
--

DROP TABLE IF EXISTS `contrato_vehiculo`;
CREATE TABLE IF NOT EXISTS `contrato_vehiculo` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contrato_vivienda`
--

DROP TABLE IF EXISTS `contrato_vivienda`;
CREATE TABLE IF NOT EXISTS `contrato_vivienda` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cuaderno`
--

DROP TABLE IF EXISTS `cuaderno`;
CREATE TABLE IF NOT EXISTS `cuaderno` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estrategia_juridica_id` int(11) DEFAULT NULL,
  `depende_cuaderno_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cuenta`
--

DROP TABLE IF EXISTS `cuenta`;
CREATE TABLE IF NOT EXISTS `cuenta` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `fecha_ultimamodificacion` datetime DEFAULT NULL,
  `page_id` double DEFAULT NULL,
  `vigencia_contratos` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cuenta_corriente`
--

DROP TABLE IF EXISTS `cuenta_corriente`;
CREATE TABLE IF NOT EXISTS `cuenta_corriente` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cuenta_materia`
--

DROP TABLE IF EXISTS `cuenta_materia`;
CREATE TABLE IF NOT EXISTS `cuenta_materia` (
  `id` int(11) NOT NULL,
  `cuenta_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `estado` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cuota`
--

DROP TABLE IF EXISTS `cuota`;
CREATE TABLE IF NOT EXISTS `cuota` (
  `id` int(11) NOT NULL,
  `usuario_anulacion_id` int(11) DEFAULT NULL,
  `numero` int(11) NOT NULL,
  `fecha_pago` date NOT NULL,
  `monto` int(11) NOT NULL,
  `pagado` int(11) DEFAULT NULL,
  `anular` tinyint(1) DEFAULT NULL,
  `fecha_anulacion` datetime DEFAULT NULL,
  `contrato_id` int(11) NOT NULL,
  `is_multa` tinyint(1) DEFAULT NULL,
  `anexo_id` int(11) DEFAULT NULL,
  `invoice_id` longtext COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_cuaderno`
--

DROP TABLE IF EXISTS `detalle_cuaderno`;
CREATE TABLE IF NOT EXISTS `detalle_cuaderno` (
  `id` int(11) NOT NULL,
  `cuaderno_id` int(11) NOT NULL,
  `actuacion_id` int(11) NOT NULL,
  `anexo_procesal_id` int(11) DEFAULT NULL,
  `causa_id` int(11) NOT NULL,
  `usuario_creacion_id` int(11) NOT NULL,
  `fecha_creacion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dias_pago`
--

DROP TABLE IF EXISTS `dias_pago`;
CREATE TABLE IF NOT EXISTS `dias_pago` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dias` int(11) NOT NULL,
  `orden` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresa`
--

DROP TABLE IF EXISTS `empresa`;
CREATE TABLE IF NOT EXISTS `empresa` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rut` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_ingreso` datetime NOT NULL,
  `fecha_ultimamodificacion` datetime DEFAULT NULL,
  `fecha_vigencia` datetime NOT NULL,
  `logo_alt` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `encuesta`
--

DROP TABLE IF EXISTS `encuesta`;
CREATE TABLE IF NOT EXISTS `encuesta` (
  `id` int(11) NOT NULL,
  `contrato_id` int(11) NOT NULL,
  `usuario_creacion_id` int(11) NOT NULL,
  `fecha_creacion` datetime DEFAULT NULL,
  `observacion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `funcion_encuesta_id` int(11) DEFAULT NULL,
  `funcion_respuesta_id` int(11) DEFAULT NULL,
  `estado_id` int(11) NOT NULL,
  `fecha_pendiente` datetime DEFAULT NULL,
  `fecha_cierre` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `encuesta_preguntas`
--

DROP TABLE IF EXISTS `encuesta_preguntas`;
CREATE TABLE IF NOT EXISTS `encuesta_preguntas` (
  `id` int(11) NOT NULL,
  `encuesta_id` int(11) NOT NULL,
  `pregunta` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nota` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `respuesta_abierta` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_pregunta` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `escritura`
--

DROP TABLE IF EXISTS `escritura`;
CREATE TABLE IF NOT EXISTS `escritura` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_civil`
--

DROP TABLE IF EXISTS `estado_civil`;
CREATE TABLE IF NOT EXISTS `estado_civil` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_encuesta`
--

DROP TABLE IF EXISTS `estado_encuesta`;
CREATE TABLE IF NOT EXISTS `estado_encuesta` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estrategia_juridica`
--

DROP TABLE IF EXISTS `estrategia_juridica`;
CREATE TABLE IF NOT EXISTS `estrategia_juridica` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `linea_tiempo_id` int(11) DEFAULT NULL,
  `precio` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estrategia_juridica_reporte`
--

DROP TABLE IF EXISTS `estrategia_juridica_reporte`;
CREATE TABLE IF NOT EXISTS `estrategia_juridica_reporte` (
  `id` int(11) NOT NULL,
  `estrategia_juridica_id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estrategia_juridica_reporte_archivos`
--

DROP TABLE IF EXISTS `estrategia_juridica_reporte_archivos`;
CREATE TABLE IF NOT EXISTS `estrategia_juridica_reporte_archivos` (
  `id` int(11) NOT NULL,
  `causa_id` int(11) NOT NULL,
  `estrategia_juridica_reporte_id` int(11) NOT NULL,
  `usuario_creacion_id` int(11) DEFAULT NULL,
  `archivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_yhora_carga` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `funcion_encuesta`
--

DROP TABLE IF EXISTS `funcion_encuesta`;
CREATE TABLE IF NOT EXISTS `funcion_encuesta` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `funcion_respuesta`
--

DROP TABLE IF EXISTS `funcion_respuesta`;
CREATE TABLE IF NOT EXISTS `funcion_respuesta` (
  `id` int(11) NOT NULL,
  `funcion_encuesta_id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gateway_pagos_solicitados_detail`
--

DROP TABLE IF EXISTS `gateway_pagos_solicitados_detail`;
CREATE TABLE IF NOT EXISTS `gateway_pagos_solicitados_detail` (
  `id` int(11) NOT NULL,
  `gateway_pagos_solicitado_id` int(11) DEFAULT NULL,
  `contrato_id` int(11) DEFAULT NULL,
  `monto_solicitud` float DEFAULT NULL,
  `observaciones` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gateway_pagos_solicitados_header`
--

DROP TABLE IF EXISTS `gateway_pagos_solicitados_header`;
CREATE TABLE IF NOT EXISTS `gateway_pagos_solicitados_header` (
  `id` int(11) NOT NULL,
  `gateway_id` int(11) DEFAULT NULL,
  `rut` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_solicitud` datetime DEFAULT NULL,
  `monto_total_solicitud` float DEFAULT NULL,
  `id_ejecutado` int(11) DEFAULT NULL,
  `id_estado` int(11) DEFAULT NULL,
  `observaciones` varchar(100) DEFAULT NULL,
  `ext_ref_pago` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gestionar`
--

DROP TABLE IF EXISTS `gestionar`;
CREATE TABLE IF NOT EXISTS `gestionar` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grupo`
--

DROP TABLE IF EXISTS `grupo`;
CREATE TABLE IF NOT EXISTS `grupo` (
  `id` int(11) NOT NULL,
  `utilizado` tinyint(1) NOT NULL,
  `asignado` tinyint(1) NOT NULL,
  `estado` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `html_tempaltes`
--

DROP TABLE IF EXISTS `html_tempaltes`;
CREATE TABLE IF NOT EXISTS `html_tempaltes` (
  `id` int(11) NOT NULL,
  `tipo` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `html_template` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `importacion`
--

DROP TABLE IF EXISTS `importacion`;
CREATE TABLE IF NOT EXISTS `importacion` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_carga` datetime NOT NULL,
  `url` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `cuenta_id` int(11) DEFAULT NULL,
  `usuario_carga_id` int(11) DEFAULT NULL,
  `estado` int(11) DEFAULT NULL,
  `tipo_importacion` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `importancia`
--

DROP TABLE IF EXISTS `importancia`;
CREATE TABLE IF NOT EXISTS `importancia` (
  `id` int(11) NOT NULL,
  `urgencia` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categorizacion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inf_agendados`
--

DROP TABLE IF EXISTS `inf_agendados`;
CREATE TABLE IF NOT EXISTS `inf_agendados` (
  `id` int(11) NOT NULL,
  `abogado_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `agendados` int(11) NOT NULL,
  `prospectos` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inf_comision_cobradores`
--

DROP TABLE IF EXISTS `inf_comision_cobradores`;
CREATE TABLE IF NOT EXISTS `inf_comision_cobradores` (
  `id` int(11) NOT NULL,
  `contrato_id` int(11) NOT NULL,
  `cobranza_id` int(11) NOT NULL,
  `pago_id` int(11) NOT NULL,
  `cuota_id` int(11) NOT NULL,
  `sesion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tiempo_gestion` double NOT NULL,
  `dias_mora` int(11) NOT NULL,
  `monto` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inf_seguimiento`
--

DROP TABLE IF EXISTS `inf_seguimiento`;
CREATE TABLE IF NOT EXISTS `inf_seguimiento` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fecha_carga` date NOT NULL,
  `sin_atencion` int(11) NOT NULL,
  `a24h` int(11) NOT NULL,
  `a48h` int(11) NOT NULL,
  `mas_de48h` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `juzgado`
--

DROP TABLE IF EXISTS `juzgado`;
CREATE TABLE IF NOT EXISTS `juzgado` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `juzgado_cuenta`
--

DROP TABLE IF EXISTS `juzgado_cuenta`;
CREATE TABLE IF NOT EXISTS `juzgado_cuenta` (
  `id` int(11) NOT NULL,
  `cuenta_id` int(11) NOT NULL,
  `juzgado_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `linea_tiempo`
--

DROP TABLE IF EXISTS `linea_tiempo`;
CREATE TABLE IF NOT EXISTS `linea_tiempo` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orden` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `linea_tiempo_etapas`
--

DROP TABLE IF EXISTS `linea_tiempo_etapas`;
CREATE TABLE IF NOT EXISTS `linea_tiempo_etapas` (
  `id` int(11) NOT NULL,
  `linea_tiempo_id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `linea_tiempo_terminada`
--

DROP TABLE IF EXISTS `linea_tiempo_terminada`;
CREATE TABLE IF NOT EXISTS `linea_tiempo_terminada` (
  `id` int(11) NOT NULL,
  `causa_id` int(11) NOT NULL,
  `linea_tiempo_etapas_id` int(11) NOT NULL,
  `estado` tinyint(1) NOT NULL,
  `usuario_registro_id` int(11) NOT NULL,
  `observacion` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logs`
--

DROP TABLE IF EXISTS `logs`;
CREATE TABLE IF NOT EXISTS `logs` (
  `id` int(11) NOT NULL,
  `log_id` int(11) DEFAULT NULL,
  `log_date` datetime DEFAULT NULL,
  `log_message` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lotes`
--

DROP TABLE IF EXISTS `lotes`;
CREATE TABLE IF NOT EXISTS `lotes` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` tinyint(1) NOT NULL,
  `orden` int(11) NOT NULL,
  `is_utilizado` tinyint(1) NOT NULL,
  `is_asignado` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mails_enviados`
--

DROP TABLE IF EXISTS `mails_enviados`;
CREATE TABLE IF NOT EXISTS `mails_enviados` (
  `id` int(11) NOT NULL,
  `tipo_envio_id` int(11) DEFAULT NULL,
  `fecha_enviado` datetime DEFAULT NULL,
  `contrato_id` int(11) DEFAULT NULL,
  `pago_cuota_id` int(11) DEFAULT NULL,
  `pago_id` int(11) DEFAULT NULL,
  `cuota_id` int(11) DEFAULT NULL,
  `estado` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materia`
--

DROP TABLE IF EXISTS `materia`;
CREATE TABLE IF NOT EXISTS `materia` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materia_estrategia`
--

DROP TABLE IF EXISTS `materia_estrategia`;
CREATE TABLE IF NOT EXISTS `materia_estrategia` (
  `id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `estrategia_juridica_id` int(11) NOT NULL,
  `estado` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mee`
--

DROP TABLE IF EXISTS `mee`;
CREATE TABLE IF NOT EXISTS `mee` (
  `id` int(11) NOT NULL,
  `materia_estrategia_id` int(11) NOT NULL,
  `escritura_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensaje`
--

DROP TABLE IF EXISTS `mensaje`;
CREATE TABLE IF NOT EXISTS `mensaje` (
  `id` int(11) NOT NULL,
  `mensaje_tipo_id` int(11) NOT NULL,
  `usuario_registro_id` int(11) DEFAULT NULL,
  `usuario_destino_id` int(11) NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `fecha_aviso` datetime NOT NULL,
  `leido` tinyint(1) NOT NULL,
  `observacion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensaje_tipo`
--

DROP TABLE IF EXISTS `mensaje_tipo`;
CREATE TABLE IF NOT EXISTS `mensaje_tipo` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `menu`
--

DROP TABLE IF EXISTS `menu`;
CREATE TABLE IF NOT EXISTS `menu` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `depende_de_id` int(11) DEFAULT NULL,
  `icono` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `menu_cabezera_id` int(11) DEFAULT NULL,
  `modulo_id` int(11) DEFAULT NULL,
  `orden` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `menu_cabezera`
--

DROP TABLE IF EXISTS `menu_cabezera`;
CREATE TABLE IF NOT EXISTS `menu_cabezera` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `migration_versions`
--

DROP TABLE IF EXISTS `migration_versions`;
CREATE TABLE IF NOT EXISTS `migration_versions` (
  `version` varchar(14) COLLATE utf8mb4_unicode_ci NOT NULL,
  `executed_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `modulo`
--

DROP TABLE IF EXISTS `modulo`;
CREATE TABLE IF NOT EXISTS `modulo` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruta` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_alt` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `modulo_per`
--

DROP TABLE IF EXISTS `modulo_per`;
CREATE TABLE IF NOT EXISTS `modulo_per` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `modulo_id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movatec_log`
--

DROP TABLE IF EXISTS `movatec_log`;
CREATE TABLE IF NOT EXISTS `movatec_log` (
  `id` int(11) NOT NULL,
  `agenda_id` int(11) DEFAULT NULL,
  `fecha_registro` datetime NOT NULL,
  `request` longtext COLLATE utf8mb4_unicode_ci,
  `response` longtext COLLATE utf8mb4_unicode_ci,
  `exito` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientospjud`
--

DROP TABLE IF EXISTS `movimientospjud`;
CREATE TABLE IF NOT EXISTS `movimientospjud` (
  `id` int(11) NOT NULL,
  `usuario_registro_id` int(11) NOT NULL,
  `fecha_carga` datetime NOT NULL,
  `archivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_pjud` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pago`
--

DROP TABLE IF EXISTS `pago`;
CREATE TABLE IF NOT EXISTS `pago` (
  `id` int(11) NOT NULL,
  `pago_tipo_id` int(11) NOT NULL,
  `pago_canal_id` int(11) NOT NULL,
  `usuario_registro_id` int(11) NOT NULL,
  `monto` int(11) NOT NULL,
  `boleta` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacion` longtext COLLATE utf8mb4_unicode_ci,
  `fecha_pago` datetime NOT NULL,
  `hora_pago` time NOT NULL,
  `fecha_registro` datetime NOT NULL,
  `cuenta_corriente_id` int(11) NOT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `ncomprobante` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comprobante` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_anulacion_id` int(11) DEFAULT NULL,
  `anulado` tinyint(1) DEFAULT NULL,
  `fecha_anulacion` datetime DEFAULT NULL,
  `contrato_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pago_canal`
--

DROP TABLE IF EXISTS `pago_canal`;
CREATE TABLE IF NOT EXISTS `pago_canal` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` tinyint(1) DEFAULT NULL,
  `orden` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pago_cuotas`
--

DROP TABLE IF EXISTS `pago_cuotas`;
CREATE TABLE IF NOT EXISTS `pago_cuotas` (
  `id` int(11) NOT NULL,
  `pago_id` int(11) NOT NULL,
  `cuota_id` int(11) NOT NULL,
  `monto` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pago_tipo`
--

DROP TABLE IF EXISTS `pago_tipo`;
CREATE TABLE IF NOT EXISTS `pago_tipo` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orden` int(11) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT NULL,
  `is_boucher` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pais`
--

DROP TABLE IF EXISTS `pais`;
CREATE TABLE IF NOT EXISTS `pais` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orden` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `privilegio`
--

DROP TABLE IF EXISTS `privilegio`;
CREATE TABLE IF NOT EXISTS `privilegio` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `accion_id` int(11) NOT NULL,
  `modulo_per_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `privilegio_tipousuario`
--

DROP TABLE IF EXISTS `privilegio_tipousuario`;
CREATE TABLE IF NOT EXISTS `privilegio_tipousuario` (
  `id` int(11) NOT NULL,
  `accion_id` int(11) NOT NULL,
  `tipousuario_id` int(11) NOT NULL,
  `modulo_per_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `region`
--

DROP TABLE IF EXISTS `region`;
CREATE TABLE IF NOT EXISTS `region` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reset_password_request`
--

DROP TABLE IF EXISTS `reset_password_request`;
CREATE TABLE IF NOT EXISTS `reset_password_request` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `selector` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hashed_token` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requested_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `expires_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reunion`
--

DROP TABLE IF EXISTS `reunion`;
CREATE TABLE IF NOT EXISTS `reunion` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `situacion_laboral`
--

DROP TABLE IF EXISTS `situacion_laboral`;
CREATE TABLE IF NOT EXISTS `situacion_laboral` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sucursal`
--

DROP TABLE IF EXISTS `sucursal`;
CREATE TABLE IF NOT EXISTS `sucursal` (
  `id` int(11) NOT NULL,
  `cuenta_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ticket`
--

DROP TABLE IF EXISTS `ticket`;
CREATE TABLE IF NOT EXISTS `ticket` (
  `id` int(11) NOT NULL,
  `contrato_id` int(11) NOT NULL,
  `origen_id` int(11) NOT NULL,
  `destino_id` int(11) DEFAULT NULL,
  `encargado_id` int(11) DEFAULT NULL,
  `motivo` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `respuesta` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `detalle_cierre` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nuevo` datetime NOT NULL,
  `fecha_asignado` datetime DEFAULT NULL,
  `fecha_respuesta` datetime DEFAULT NULL,
  `fecha_cierre` datetime DEFAULT NULL,
  `folio` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `estado_id` int(11) DEFAULT NULL,
  `folio_sac` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `importancia_id` int(11) DEFAULT NULL,
  `fecha_ultima_gestion` datetime DEFAULT NULL,
  `ticket_tipo_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ticket_estado`
--

DROP TABLE IF EXISTS `ticket_estado`;
CREATE TABLE IF NOT EXISTS `ticket_estado` (
  `id` int(11) NOT NULL,
  `nombre` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ticket_historial`
--

DROP TABLE IF EXISTS `ticket_historial`;
CREATE TABLE IF NOT EXISTS `ticket_historial` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `usuario_registro_id` int(11) NOT NULL,
  `observacion` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_id` int(11) DEFAULT NULL,
  `fecha` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ticket_tipo`
--

DROP TABLE IF EXISTS `ticket_tipo`;
CREATE TABLE IF NOT EXISTS `ticket_tipo` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `orden` int(11) NOT NULL,
  `color_badge` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

DROP TABLE IF EXISTS `usuario`;
CREATE TABLE IF NOT EXISTS `usuario` (
  `id` int(11) NOT NULL,
  `usuario_tipo_id` int(11) NOT NULL,
  `username` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` tinyint(1) NOT NULL,
  `fecha_activacion` datetime NOT NULL,
  `correo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` longtext COLLATE utf8mb4_unicode_ci,
  `empresa_actual` int(11) DEFAULT NULL,
  `categoria_id` int(11) DEFAULT NULL,
  `status_id` int(11) DEFAULT NULL,
  `fecha_no_disponible` datetime DEFAULT NULL,
  `whatsapp` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rut` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sexo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_documento_id` int(11) DEFAULT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_ant` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lunes` tinyint(1) DEFAULT NULL,
  `lunes_start` time DEFAULT NULL,
  `lunes_end` time DEFAULT NULL,
  `martes` tinyint(1) DEFAULT NULL,
  `martes_start` time DEFAULT NULL,
  `martes_end` time DEFAULT NULL,
  `miercoles` tinyint(1) DEFAULT NULL,
  `miercoles_start` time DEFAULT NULL,
  `miercoles_end` time DEFAULT NULL,
  `jueves` tinyint(1) DEFAULT NULL,
  `jueves_start` time DEFAULT NULL,
  `jueves_end` time DEFAULT NULL,
  `viernes` tinyint(1) DEFAULT NULL,
  `viernes_start` time DEFAULT NULL,
  `viernes_end` time DEFAULT NULL,
  `sabado` tinyint(1) DEFAULT NULL,
  `sabado_start` time DEFAULT NULL,
  `sabado_end` time DEFAULT NULL,
  `domingo` tinyint(1) DEFAULT NULL,
  `domingo_start` time DEFAULT NULL,
  `domingo_end` time DEFAULT NULL,
  `sobrecupo` int(11) DEFAULT NULL,
  `lotes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `toku_id` longtext COLLATE utf8mb4_unicode_ci,
  `fecha_nacimiento` date DEFAULT NULL,
  `fecha_aviso` date DEFAULT NULL,
  `estado_cartera` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_cartera`
--

DROP TABLE IF EXISTS `usuario_cartera`;
CREATE TABLE IF NOT EXISTS `usuario_cartera` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `cartera_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_categoria`
--

DROP TABLE IF EXISTS `usuario_categoria`;
CREATE TABLE IF NOT EXISTS `usuario_categoria` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `n_leads` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_cuenta`
--

DROP TABLE IF EXISTS `usuario_cuenta`;
CREATE TABLE IF NOT EXISTS `usuario_cuenta` (
  `id` int(11) NOT NULL,
  `cuenta_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_grupo`
--

DROP TABLE IF EXISTS `usuario_grupo`;
CREATE TABLE IF NOT EXISTS `usuario_grupo` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `grupo_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_lote`
--

DROP TABLE IF EXISTS `usuario_lote`;
CREATE TABLE IF NOT EXISTS `usuario_lote` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `lote_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_no_disponible`
--

DROP TABLE IF EXISTS `usuario_no_disponible`;
CREATE TABLE IF NOT EXISTS `usuario_no_disponible` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `anio` int(11) DEFAULT NULL,
  `mes` int(11) DEFAULT NULL,
  `dia` int(11) DEFAULT NULL,
  `concepto` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_status`
--

DROP TABLE IF EXISTS `usuario_status`;
CREATE TABLE IF NOT EXISTS `usuario_status` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_tipo`
--

DROP TABLE IF EXISTS `usuario_tipo`;
CREATE TABLE IF NOT EXISTS `usuario_tipo` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orden` int(11) DEFAULT NULL,
  `fijar` tinyint(1) NOT NULL,
  `nombre_interno` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `menu_cabezera_id` int(11) DEFAULT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `statues` longtext COLLATE utf8mb4_unicode_ci COMMENT '(DC2Type:array)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_tipo_documento`
--

DROP TABLE IF EXISTS `usuario_tipo_documento`;
CREATE TABLE IF NOT EXISTS `usuario_tipo_documento` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_usuariocategoria`
--

DROP TABLE IF EXISTS `usuario_usuariocategoria`;
CREATE TABLE IF NOT EXISTS `usuario_usuariocategoria` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `cuenta_id` int(11) DEFAULT NULL,
  `agenda_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vencimiento`
--

DROP TABLE IF EXISTS `vencimiento`;
CREATE TABLE IF NOT EXISTS `vencimiento` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `val_min` int(11) DEFAULT NULL,
  `val_max` int(11) DEFAULT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icono` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `monto_max` int(11) DEFAULT NULL,
  `solo_por_admin` tinyint(1) DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_contrato_anexo_max`
--
DROP VIEW IF EXISTS `vista_contrato_anexo_max`;
CREATE TABLE IF NOT EXISTS `vista_contrato_anexo_max` (
`contrato_id` int(11)
,`fecha_creacion` datetime
,`id` int(11)
,`folio` int(11)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_encuesta_qty`
--
DROP VIEW IF EXISTS `vista_encuesta_qty`;
CREATE TABLE IF NOT EXISTS `vista_encuesta_qty` (
`contrato_id` int(11)
,`qty_encuesta` decimal(23,0)
,`qty_gestion_encuesta` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_nota_max`
--
DROP VIEW IF EXISTS `vista_nota_max`;
CREATE TABLE IF NOT EXISTS `vista_nota_max` (
`contrato_id` int(11)
,`nota` varchar(255)
,`encuesta_id` int(11)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_usuario_calidad`
--
DROP VIEW IF EXISTS `vista_usuario_calidad`;
CREATE TABLE IF NOT EXISTS `vista_usuario_calidad` (
`grupo_id` int(11)
,`nombre` varchar(50)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_anexos_activos`
--
DROP VIEW IF EXISTS `vw_anexos_activos`;
CREATE TABLE IF NOT EXISTS `vw_anexos_activos` (
`contrato_id` int(11)
,`fecha_creacion_anexo` datetime
,`vigencia_anexo` int(11)
,`numero_anexo` int(11)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_causas_activas`
--
DROP VIEW IF EXISTS `vw_causas_activas`;
CREATE TABLE IF NOT EXISTS `vw_causas_activas` (
`contrato_id` int(11)
,`folio` varchar(255)
,`vigencia` int(11)
,`fecha_creacion` datetime
,`meses` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_causas_activas_final`
--
DROP VIEW IF EXISTS `vw_causas_activas_final`;
CREATE TABLE IF NOT EXISTS `vw_causas_activas_final` (
`cuenta_id` int(11)
,`compañia` varchar(255)
,`contrato_id` int(11)
,`agenda_id` int(11)
,`folio` varchar(255)
,`fecha_cto` datetime
,`cliente` varchar(255)
,`tramitador_id` int(11)
,`tramitador` varchar(50)
,`tramitador_nombre` varchar(50)
,`abogado_id` int(11)
,`cerrador` varchar(50)
,`IdCausa` int(11)
,`id_causa` int(11)
,`caratulado` varchar(255)
,`folio_activo` varchar(255)
,`vigencia_activo` int(11)
,`meses_activo` bigint(21)
,`fecha_creacion_anexo` datetime
,`vigencia_anexo` int(11)
,`morosos` varchar(255)
,`VipMayor2MM` varchar(255)
,`vip_mayor2_mm` varchar(255)
,`VipReferidos` varchar(255)
,`vip_referidos` varchar(255)
,`VipUnaCuota` varchar(255)
,`vip_una_cuota` varchar(255)
,`rol` varchar(255)
,`fecha_registro_observacion` datetime
,`activo` int(1)
,`moroso` int(1)
,`vip` int(1)
,`tieneRol` int(1)
,`tiene_rol` int(1)
,`causa_finalizada` tinyint(1)
,`cuenta_nombre` varchar(255)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_causas_finalizadas`
--
DROP VIEW IF EXISTS `vw_causas_finalizadas`;
CREATE TABLE IF NOT EXISTS `vw_causas_finalizadas` (
`causa_id` int(11)
,`rol` varchar(255)
,`causa_finalizada` tinyint(1)
,`fecha_registro` datetime
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_clientes_activos_final`
--
DROP VIEW IF EXISTS `vw_clientes_activos_final`;
CREATE TABLE IF NOT EXISTS `vw_clientes_activos_final` (
`cuenta_id` int(11)
,`compañia` varchar(255)
,`contrato_id` int(11)
,`agenda_id` int(11)
,`folio` varchar(255)
,`fecha_cto` datetime
,`cliente` varchar(255)
,`tramitador_id` int(11)
,`tramitador` varchar(50)
,`tramitador_nombre` varchar(50)
,`abogado_id` int(11)
,`cerrador` varchar(50)
,`IdCausa` int(11)
,`id_causa` int(11)
,`caratulado` varchar(255)
,`folio_activo` varchar(255)
,`vigencia_activo` int(11)
,`meses_activo` bigint(21)
,`fecha_creacion_anexo` datetime
,`vigencia_anexo` int(11)
,`morosos` varchar(255)
,`VipMayor2MM` varchar(255)
,`vip_mayor2_mm` varchar(255)
,`VipReferidos` varchar(255)
,`vip_referidos` varchar(255)
,`VipUnaCuota` varchar(255)
,`vip_una_cuota` varchar(255)
,`rol` varchar(255)
,`fecha_registro_observacion` datetime
,`activo` int(1)
,`moroso` int(1)
,`vip` int(1)
,`tieneRol` int(1)
,`tiene_rol` int(1)
,`causa_finalizada` tinyint(1)
,`cuenta_nombre` varchar(255)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_clientes_morosos`
--
DROP VIEW IF EXISTS `vw_clientes_morosos`;
CREATE TABLE IF NOT EXISTS `vw_clientes_morosos` (
`contrato_id` int(11)
,`folio` varchar(255)
,`materia` varchar(50)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_contrato`
--
DROP VIEW IF EXISTS `vw_contrato`;
CREATE TABLE IF NOT EXISTS `vw_contrato` (
`id` int(11)
,`estado_civil_id` int(11)
,`situacion_laboral_id` int(11)
,`estrategia_juridica_id` int(11)
,`escritura_id` int(11)
,`agenda_id` int(11)
,`nombre` varchar(255)
,`email` varchar(255)
,`telefono` varchar(255)
,`ciudad` varchar(255)
,`rut` varchar(255)
,`direccion` varchar(255)
,`comuna` varchar(255)
,`titulo_contrato` varchar(255)
,`monto_nivel_deuda` decimal(10,0)
,`monto_contrato` decimal(10,0)
,`cuotas` int(11)
,`valor_cuota` decimal(10,0)
,`interes` decimal(5,2)
,`dia_pago` int(11)
,`sucursal_id` int(11)
,`tramitador_id` int(11)
,`cliente_id` int(11)
,`clave_unica` varchar(255)
,`telefono_recado` varchar(255)
,`fecha_primer_pago` datetime
,`pais_id` int(11)
,`vehiculo_id` int(11)
,`vivienda_id` int(11)
,`reunion_id` int(11)
,`pdf` varchar(255)
,`is_abono` tinyint(1)
,`primera_cuota` double
,`fecha_primera_cuota` date
,`observacion` longtext
,`fecha_ultimo_pago` date
,`is_finalizado` tinyint(1)
,`lote` int(11)
,`pdf_termino` varchar(255)
,`fecha_termino` datetime
,`vigencia` int(11)
,`fecha_desiste` datetime
,`fecha_pdf_anexo` datetime
,`fecha_compromiso` date
,`ultima_funcion` varchar(255)
,`q_mov` int(11)
,`id_lote_id` int(11)
,`ccomuna_id` int(11)
,`cciudad_id` int(11)
,`cregion_id` int(11)
,`sexo` varchar(20)
,`is_anexo` tinyint(1)
,`proximo_vencimiento` date
,`fecha_ultima_gestion` date
,`pago_actual` decimal(10,0)
,`is_total` tinyint(1)
,`cartera_orden` int(11)
,`cartera_id` int(11)
,`is_incorporacion` tinyint(1)
,`grupo_id` int(11)
,`estado_encuesta_id` int(11)
,`observacion_encuesta` varchar(255)
,`fecha_creacion` datetime
,`folio` varchar(279)
,`folio_contrato` varchar(255)
,`fecha_encuesta` datetime
,`usuario_encuesta_id` int(11)
,`encuesta_funcion_respuesta` varchar(255)
,`encuesta_funcion_encuesta` varchar(255)
,`encuesta_observacion` varchar(255)
,`encuesta_fecha_cierre` datetime
,`encuesta_pregunta` varchar(255)
,`encuesta_respuesta_abierta` varchar(255)
,`encuesta_nota` varchar(255)
,`fecha_gestion` datetime
,`usuario_gestion_id` int(11)
,`gestion_funcion_respuesta` varchar(255)
,`gestion_funcion_encuesta` varchar(255)
,`gestion_observacion` varchar(255)
,`qty_encuesta` decimal(23,0)
,`qty_gestion_encuesta` bigint(21)
,`ultima_nota` varchar(255)
,`usuario_calidad` varchar(50)
,`fecha_pago` date
,`monto` int(11)
,`numero` int(11)
,`vip` int(1)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_cuota_pendiente`
--
DROP VIEW IF EXISTS `vw_cuota_pendiente`;
CREATE TABLE IF NOT EXISTS `vw_cuota_pendiente` (
`cuota_id` int(11)
,`numero` int(11)
,`fecha_pago` date
,`monto` int(11)
,`pagado` int(11)
,`anular` tinyint(1)
,`fecha_anulacion` datetime
,`is_multa` tinyint(1)
,`invoice_id` longtext
,`usuario_anulacion_id` int(11)
,`contrato_id` int(11)
,`anexo_id` int(11)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_encuestas`
--
DROP VIEW IF EXISTS `vw_encuestas`;
CREATE TABLE IF NOT EXISTS `vw_encuestas` (
`contrato_id` int(11)
,`nombre_funcion_encuesta` varchar(255)
,`nombre_funcion_respuesta` varchar(255)
,`fecha_creacion` datetime
,`usuario_creacion_id` int(11)
,`observacion` varchar(255)
,`nota` varchar(255)
,`fecha_cierre` datetime
,`pregunta` varchar(255)
,`respuesta_abierta` varchar(255)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_gestiones`
--
DROP VIEW IF EXISTS `vw_gestiones`;
CREATE TABLE IF NOT EXISTS `vw_gestiones` (
`contrato_id` int(11)
,`nombre_funcion_encuesta` varchar(255)
,`nombre_funcion_respuesta` varchar(255)
,`fecha_creacion` datetime
,`usuario_creacion_id` int(11)
,`observacion` varchar(255)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_max_fecha_anexo`
--
DROP VIEW IF EXISTS `vw_max_fecha_anexo`;
CREATE TABLE IF NOT EXISTS `vw_max_fecha_anexo` (
`contrato_id` int(11)
,`max_fecha` datetime
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_max_fecha_observacion_causa`
--
DROP VIEW IF EXISTS `vw_max_fecha_observacion_causa`;
CREATE TABLE IF NOT EXISTS `vw_max_fecha_observacion_causa` (
`causa_id` int(11)
,`max_fecha` datetime
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_resumen_causas`
--
DROP VIEW IF EXISTS `vw_resumen_causas`;
CREATE TABLE IF NOT EXISTS `vw_resumen_causas` (
`cuenta_id` int(11)
,`tramitador_id` int(11)
,`tramitador` varchar(50)
,`causas_activas` bigint(21)
,`causas_al_dia` decimal(23,0)
,`clientes_activos` bigint(21)
,`clientes_al_dia` bigint(21)
,`clientes_morosos` bigint(21)
,`clientes_activos_vip` bigint(21)
,`clientes_al_dia_vip` bigint(21)
,`causas_activas_con_rol` bigint(21)
,`causas_activas_sin_rol` bigint(21)
,`causas_activas_finalizadas` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_vip_mayor_2mm`
--
DROP VIEW IF EXISTS `vw_vip_mayor_2mm`;
CREATE TABLE IF NOT EXISTS `vw_vip_mayor_2mm` (
`contrato_id` int(11)
,`folio` varchar(255)
,`cuotas` int(11)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_vip_referidos`
--
DROP VIEW IF EXISTS `vw_vip_referidos`;
CREATE TABLE IF NOT EXISTS `vw_vip_referidos` (
`contrato_id` int(11)
,`folio` varchar(255)
,`cuotas` int(11)
,`referidos` int(11)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_vip_una_cuota`
--
DROP VIEW IF EXISTS `vw_vip_una_cuota`;
CREATE TABLE IF NOT EXISTS `vw_vip_una_cuota` (
`contrato_id` int(11)
,`folio` varchar(255)
,`cuotas` int(11)
,`numero` int(11)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `webhook`
--

DROP TABLE IF EXISTS `webhook`;
CREATE TABLE IF NOT EXISTS `webhook` (
  `id` int(11) NOT NULL,
  `verify_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_token` longtext COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_contrato_anexo_max`
--
DROP TABLE IF EXISTS `vista_contrato_anexo_max`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_contrato_anexo_max` AS select `contrato_anexo`.`contrato_id` AS `contrato_id`,max(`contrato_anexo`.`fecha_creacion`) AS `fecha_creacion`,max(`contrato_anexo`.`id`) AS `id`,max(`contrato_anexo`.`folio`) AS `folio` from `contrato_anexo` group by `contrato_anexo`.`contrato_id`;

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_encuesta_qty`
--
DROP TABLE IF EXISTS `vista_encuesta_qty`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_encuesta_qty` AS select `encuesta`.`contrato_id` AS `contrato_id`,sum((case when (`encuesta`.`funcion_respuesta_id` = 1) then 1 else 0 end)) AS `qty_encuesta`,count(0) AS `qty_gestion_encuesta` from `encuesta` where (`encuesta`.`estado_id` = 2) group by `encuesta`.`contrato_id`;

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_nota_max`
--
DROP TABLE IF EXISTS `vista_nota_max`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_nota_max` AS select `e`.`contrato_id` AS `contrato_id`,max(`p`.`nota`) AS `nota`,`e`.`id` AS `encuesta_id` from (`encuesta` `e` join `encuesta_preguntas` `p` on((`p`.`encuesta_id` = `e`.`id`))) where (`p`.`tipo_pregunta` = 1) group by `e`.`contrato_id`;

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_usuario_calidad`
--
DROP TABLE IF EXISTS `vista_usuario_calidad`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_usuario_calidad` AS select `g`.`id` AS `grupo_id`,`u`.`nombre` AS `nombre` from ((`grupo` `g` join `usuario_grupo` `ug` on((`ug`.`grupo_id` = `g`.`id`))) join `usuario` `u` on((`u`.`id` = `ug`.`usuario_id`)));

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_anexos_activos`
--
DROP TABLE IF EXISTS `vw_anexos_activos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_anexos_activos` AS select `ca`.`contrato_id` AS `contrato_id`,`ca`.`fecha_creacion` AS `fecha_creacion_anexo`,`ca`.`vigencia` AS `vigencia_anexo`,`ca`.`folio` AS `numero_anexo` from (`contrato_anexo` `ca` join `vw_max_fecha_anexo` `vmfa` on(((`ca`.`contrato_id` = `vmfa`.`contrato_id`) and (`ca`.`fecha_creacion` = `vmfa`.`max_fecha`)))) where ((ifnull(`ca`.`is_desiste`,0) <> 1) and (`ca`.`fecha_creacion` between ('2025-06-26' - interval `ca`.`vigencia` month) and '2025-06-26 23:59'));

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_causas_activas`
--
DROP TABLE IF EXISTS `vw_causas_activas`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_causas_activas` AS select `contrato`.`id` AS `contrato_id`,`contrato`.`folio` AS `folio`,`contrato`.`vigencia` AS `vigencia`,`contrato`.`fecha_creacion` AS `fecha_creacion`,timestampdiff(MONTH,`contrato`.`fecha_creacion`,now()) AS `meses` from `contrato` where (isnull(`contrato`.`fecha_desiste`) and (`contrato`.`fecha_creacion` between ('2025-06-26' - interval `contrato`.`vigencia` month) and '2025-06-26 23:59'));

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_causas_activas_final`
--
DROP TABLE IF EXISTS `vw_causas_activas_final`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_causas_activas_final` AS select `cuenta`.`id` AS `cuenta_id`,`cuenta`.`nombre` AS `compañia`,`contrato`.`id` AS `contrato_id`,`contrato`.`agenda_id` AS `agenda_id`,`contrato`.`folio` AS `folio`,`contrato`.`fecha_creacion` AS `fecha_cto`,`contrato`.`nombre` AS `cliente`,`contrato`.`tramitador_id` AS `tramitador_id`,`ut`.`nombre` AS `tramitador`,`ut`.`nombre` AS `tramitador_nombre`,`agenda`.`abogado_id` AS `abogado_id`,`uc`.`nombre` AS `cerrador`,`causa`.`id` AS `IdCausa`,`causa`.`id` AS `id_causa`,`causa`.`causa_nombre` AS `caratulado`,`ca`.`folio` AS `folio_activo`,`ca`.`vigencia` AS `vigencia_activo`,`ca`.`meses` AS `meses_activo`,`aa`.`fecha_creacion_anexo` AS `fecha_creacion_anexo`,`aa`.`vigencia_anexo` AS `vigencia_anexo`,`cm`.`folio` AS `morosos`,`vm`.`folio` AS `VipMayor2MM`,`vm`.`folio` AS `vip_mayor2_mm`,`vr`.`folio` AS `VipReferidos`,`vr`.`folio` AS `vip_referidos`,`vu`.`folio` AS `VipUnaCuota`,`vu`.`folio` AS `vip_una_cuota`,`cf`.`rol` AS `rol`,`cf`.`fecha_registro` AS `fecha_registro_observacion`,(case when (`ca`.`folio` is not null) then 1 when (`aa`.`vigencia_anexo` is not null) then 1 else 0 end) AS `activo`,(case when (`cm`.`folio` is not null) then 1 else 0 end) AS `moroso`,(case when (`vm`.`folio` is not null) then 1 when (`vr`.`folio` is not null) then 1 when (`vu`.`folio` is not null) then 1 else 0 end) AS `vip`,(case when isnull(`cf`.`rol`) then 0 when (`cf`.`rol` = '') then 0 else 1 end) AS `tieneRol`,(case when isnull(`cf`.`rol`) then 0 when (`cf`.`rol` = '') then 0 else 1 end) AS `tiene_rol`,`cf`.`causa_finalizada` AS `causa_finalizada`,`cuenta`.`nombre` AS `cuenta_nombre` from ((((((((((((`contrato` join `agenda` on((`contrato`.`agenda_id` = `agenda`.`id`))) join `cuenta` on((`agenda`.`cuenta_id` = `cuenta`.`id`))) join `usuario` `ut` on((`contrato`.`tramitador_id` = `ut`.`id`))) join `usuario` `uc` on((`agenda`.`abogado_id` = `uc`.`id`))) join `causa` on((`causa`.`agenda_id` = `agenda`.`id`))) left join `vw_causas_activas` `ca` on((`contrato`.`id` = `ca`.`contrato_id`))) left join `vw_anexos_activos` `aa` on((`contrato`.`id` = `aa`.`contrato_id`))) left join `vw_clientes_morosos` `cm` on((`cm`.`contrato_id` = `contrato`.`id`))) left join `vw_vip_mayor_2mm` `vm` on((`vm`.`contrato_id` = `contrato`.`id`))) left join `vw_vip_referidos` `vr` on((`vr`.`contrato_id` = `contrato`.`id`))) left join `vw_vip_una_cuota` `vu` on((`vu`.`contrato_id` = `contrato`.`id`))) left join `vw_causas_finalizadas` `cf` on((`cf`.`causa_id` = `causa`.`id`))) where (isnull(`contrato`.`fecha_desiste`) and (`causa`.`estado` = 1) and ((`ca`.`folio` is not null) or (`aa`.`vigencia_anexo` is not null)));

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_causas_finalizadas`
--
DROP TABLE IF EXISTS `vw_causas_finalizadas`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_causas_finalizadas` AS select `c`.`id` AS `causa_id`,`c`.`id_causa` AS `rol`,`c`.`causa_finalizada` AS `causa_finalizada`,max(`co`.`fecha_registro`) AS `fecha_registro` from (`causa` `c` join `causa_observacion` `co` on((`c`.`id` = `co`.`causa_id`))) where (`c`.`estado` = 1) group by `c`.`id`;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_clientes_activos_final`
--
DROP TABLE IF EXISTS `vw_clientes_activos_final`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_clientes_activos_final` AS select `cuenta`.`id` AS `cuenta_id`,`cuenta`.`nombre` AS `compañia`,`contrato`.`id` AS `contrato_id`,`contrato`.`agenda_id` AS `agenda_id`,`contrato`.`folio` AS `folio`,`contrato`.`fecha_creacion` AS `fecha_cto`,`contrato`.`nombre` AS `cliente`,`contrato`.`tramitador_id` AS `tramitador_id`,`ut`.`nombre` AS `tramitador`,`ut`.`nombre` AS `tramitador_nombre`,`agenda`.`abogado_id` AS `abogado_id`,`uc`.`nombre` AS `cerrador`,`causa`.`id` AS `IdCausa`,`causa`.`id` AS `id_causa`,`causa`.`causa_nombre` AS `caratulado`,`ca`.`folio` AS `folio_activo`,`ca`.`vigencia` AS `vigencia_activo`,`ca`.`meses` AS `meses_activo`,`aa`.`fecha_creacion_anexo` AS `fecha_creacion_anexo`,`aa`.`vigencia_anexo` AS `vigencia_anexo`,`cm`.`folio` AS `morosos`,`vm`.`folio` AS `VipMayor2MM`,`vm`.`folio` AS `vip_mayor2_mm`,`vr`.`folio` AS `VipReferidos`,`vr`.`folio` AS `vip_referidos`,`vu`.`folio` AS `VipUnaCuota`,`vu`.`folio` AS `vip_una_cuota`,`cf`.`rol` AS `rol`,`cf`.`fecha_registro` AS `fecha_registro_observacion`,(case when (`ca`.`folio` is not null) then 1 when (`aa`.`vigencia_anexo` is not null) then 1 else 0 end) AS `activo`,(case when (`cm`.`folio` is not null) then 1 else 0 end) AS `moroso`,(case when (`vm`.`folio` is not null) then 1 when (`vr`.`folio` is not null) then 1 when (`vu`.`folio` is not null) then 1 else 0 end) AS `vip`,(case when isnull(`cf`.`rol`) then 0 when (`cf`.`rol` = '') then 0 else 1 end) AS `tieneRol`,(case when isnull(`cf`.`rol`) then 0 when (`cf`.`rol` = '') then 0 else 1 end) AS `tiene_rol`,`cf`.`causa_finalizada` AS `causa_finalizada`,`cuenta`.`nombre` AS `cuenta_nombre` from ((((((((((((`contrato` join `agenda` on((`contrato`.`agenda_id` = `agenda`.`id`))) join `cuenta` on((`agenda`.`cuenta_id` = `cuenta`.`id`))) join `usuario` `ut` on((`contrato`.`tramitador_id` = `ut`.`id`))) join `usuario` `uc` on((`agenda`.`abogado_id` = `uc`.`id`))) join `causa` on((`causa`.`agenda_id` = `agenda`.`id`))) left join `vw_causas_activas` `ca` on((`contrato`.`id` = `ca`.`contrato_id`))) left join `vw_anexos_activos` `aa` on((`contrato`.`id` = `aa`.`contrato_id`))) left join `vw_clientes_morosos` `cm` on((`cm`.`contrato_id` = `contrato`.`id`))) left join `vw_vip_mayor_2mm` `vm` on((`vm`.`contrato_id` = `contrato`.`id`))) left join `vw_vip_referidos` `vr` on((`vr`.`contrato_id` = `contrato`.`id`))) left join `vw_vip_una_cuota` `vu` on((`vu`.`contrato_id` = `contrato`.`id`))) left join `vw_causas_finalizadas` `cf` on((`cf`.`causa_id` = `causa`.`id`))) where (isnull(`contrato`.`fecha_desiste`) and (`causa`.`estado` = 1) and ((`ca`.`folio` is not null) or (`aa`.`vigencia_anexo` is not null))) group by `contrato`.`id`;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_clientes_morosos`
--
DROP TABLE IF EXISTS `vw_clientes_morosos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_clientes_morosos` AS select `c1_`.`id` AS `contrato_id`,`c1_`.`folio` AS `folio`,`c5_`.`nombre` AS `materia` from (((((`cuota` `c0_` join `contrato` `c1_` on((`c0_`.`contrato_id` = `c1_`.`id`))) join `agenda` `a2_` on((`c1_`.`agenda_id` = `a2_`.`id`))) join `cuenta` `c3_` on((`a2_`.`cuenta_id` = `c3_`.`id`))) join `cuenta_materia` `c4_` on((`c4_`.`cuenta_id` = `c3_`.`id`))) join `materia` `c5_` on((`c5_`.`id` = `c4_`.`materia_id`))) where (((`c0_`.`monto` > `c0_`.`pagado`) or isnull(`c0_`.`pagado`)) and ((to_days(cast('2025-06-26' as date)) - to_days(`c0_`.`fecha_pago`)) >= 61) and (`c4_`.`estado` = 1) and ((`c0_`.`anular` = 0) or isnull(`c0_`.`anular`))) group by `c0_`.`contrato_id`;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_contrato`
--
DROP TABLE IF EXISTS `vw_contrato`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_contrato` AS select `c`.`id` AS `id`,`c`.`estado_civil_id` AS `estado_civil_id`,`c`.`situacion_laboral_id` AS `situacion_laboral_id`,`c`.`estrategia_juridica_id` AS `estrategia_juridica_id`,`c`.`escritura_id` AS `escritura_id`,`c`.`agenda_id` AS `agenda_id`,`c`.`nombre` AS `nombre`,`c`.`email` AS `email`,`c`.`telefono` AS `telefono`,`c`.`ciudad` AS `ciudad`,`c`.`rut` AS `rut`,`c`.`direccion` AS `direccion`,`c`.`comuna` AS `comuna`,`c`.`titulo_contrato` AS `titulo_contrato`,`c`.`monto_nivel_deuda` AS `monto_nivel_deuda`,`c`.`monto_contrato` AS `monto_contrato`,`c`.`cuotas` AS `cuotas`,`c`.`valor_cuota` AS `valor_cuota`,`c`.`interes` AS `interes`,`c`.`dia_pago` AS `dia_pago`,`c`.`sucursal_id` AS `sucursal_id`,`c`.`tramitador_id` AS `tramitador_id`,`c`.`cliente_id` AS `cliente_id`,`c`.`clave_unica` AS `clave_unica`,`c`.`telefono_recado` AS `telefono_recado`,`c`.`fecha_primer_pago` AS `fecha_primer_pago`,`c`.`pais_id` AS `pais_id`,`c`.`vehiculo_id` AS `vehiculo_id`,`c`.`vivienda_id` AS `vivienda_id`,`c`.`reunion_id` AS `reunion_id`,`c`.`pdf` AS `pdf`,`c`.`is_abono` AS `is_abono`,`c`.`primera_cuota` AS `primera_cuota`,`c`.`fecha_primera_cuota` AS `fecha_primera_cuota`,`c`.`observacion` AS `observacion`,`c`.`fecha_ultimo_pago` AS `fecha_ultimo_pago`,`c`.`is_finalizado` AS `is_finalizado`,`c`.`lote` AS `lote`,`c`.`pdf_termino` AS `pdf_termino`,`c`.`fecha_termino` AS `fecha_termino`,`c`.`vigencia` AS `vigencia`,`c`.`fecha_desiste` AS `fecha_desiste`,`c`.`fecha_pdf_anexo` AS `fecha_pdf_anexo`,`c`.`fecha_compromiso` AS `fecha_compromiso`,`c`.`ultima_funcion` AS `ultima_funcion`,`c`.`q_mov` AS `q_mov`,`c`.`id_lote_id` AS `id_lote_id`,`c`.`ccomuna_id` AS `ccomuna_id`,`c`.`cciudad_id` AS `cciudad_id`,`c`.`cregion_id` AS `cregion_id`,`c`.`sexo` AS `sexo`,`c`.`is_anexo` AS `is_anexo`,`c`.`proximo_vencimiento` AS `proximo_vencimiento`,`c`.`fecha_ultima_gestion` AS `fecha_ultima_gestion`,`c`.`pago_actual` AS `pago_actual`,`c`.`is_total` AS `is_total`,`c`.`cartera_orden` AS `cartera_orden`,`c`.`cartera_id` AS `cartera_id`,`c`.`is_incorporacion` AS `is_incorporacion`,`c`.`grupo_id` AS `grupo_id`,`c`.`estado_encuesta_id` AS `estado_encuesta_id`,`c`.`observacion_encuesta` AS `observacion_encuesta`,coalesce(`ca`.`fecha_creacion`,`c`.`fecha_creacion`) AS `fecha_creacion`,coalesce(concat(`ca`.`id`,'-',`c`.`folio`,'-',`ca`.`folio`),`c`.`folio`) AS `folio`,`c`.`folio` AS `folio_contrato`,`e1`.`fecha_creacion` AS `fecha_encuesta`,`e1`.`usuario_creacion_id` AS `usuario_encuesta_id`,`e1`.`nombre_funcion_respuesta` AS `encuesta_funcion_respuesta`,`e1`.`nombre_funcion_encuesta` AS `encuesta_funcion_encuesta`,`e1`.`observacion` AS `encuesta_observacion`,`e1`.`fecha_cierre` AS `encuesta_fecha_cierre`,`e1`.`pregunta` AS `encuesta_pregunta`,`e1`.`respuesta_abierta` AS `encuesta_respuesta_abierta`,`e1`.`nota` AS `encuesta_nota`,`e2`.`fecha_creacion` AS `fecha_gestion`,`e2`.`usuario_creacion_id` AS `usuario_gestion_id`,`e2`.`nombre_funcion_respuesta` AS `gestion_funcion_respuesta`,`e2`.`nombre_funcion_encuesta` AS `gestion_funcion_encuesta`,`e2`.`observacion` AS `gestion_observacion`,coalesce(`eq`.`qty_encuesta`,0) AS `qty_encuesta`,`eq`.`qty_gestion_encuesta` AS `qty_gestion_encuesta`,`nm`.`nota` AS `ultima_nota`,`uc`.`nombre` AS `usuario_calidad`,`cp`.`fecha_pago` AS `fecha_pago`,`cp`.`monto` AS `monto`,`cp`.`numero` AS `numero`,(case when (`vm`.`folio` is not null) then 1 when (`vr`.`folio` is not null) then 1 when (`vu`.`folio` is not null) then 1 else 0 end) AS `vip` from ((((((((((`contrato` `c` left join `vista_contrato_anexo_max` `ca` on((`ca`.`contrato_id` = `c`.`id`))) left join `vw_encuestas` `e1` on((`e1`.`contrato_id` = `c`.`id`))) left join `vw_gestiones` `e2` on((`e2`.`contrato_id` = `c`.`id`))) left join `vista_encuesta_qty` `eq` on((`eq`.`contrato_id` = `c`.`id`))) left join `vista_nota_max` `nm` on((`nm`.`contrato_id` = `c`.`id`))) left join `vista_usuario_calidad` `uc` on((`uc`.`grupo_id` = `c`.`grupo_id`))) left join `vw_cuota_pendiente` `cp` on((`cp`.`contrato_id` = `c`.`id`))) left join `vw_vip_mayor_2mm` `vm` on((`vm`.`contrato_id` = `c`.`id`))) left join `vw_vip_referidos` `vr` on((`vr`.`contrato_id` = `c`.`id`))) left join `vw_vip_una_cuota` `vu` on((`vu`.`contrato_id` = `c`.`id`)));

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_cuota_pendiente`
--
DROP TABLE IF EXISTS `vw_cuota_pendiente`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_cuota_pendiente` AS select `c0_`.`id` AS `cuota_id`,`c0_`.`numero` AS `numero`,`c0_`.`fecha_pago` AS `fecha_pago`,`c0_`.`monto` AS `monto`,`c0_`.`pagado` AS `pagado`,`c0_`.`anular` AS `anular`,`c0_`.`fecha_anulacion` AS `fecha_anulacion`,`c0_`.`is_multa` AS `is_multa`,`c0_`.`invoice_id` AS `invoice_id`,`c0_`.`usuario_anulacion_id` AS `usuario_anulacion_id`,`c0_`.`contrato_id` AS `contrato_id`,`c0_`.`anexo_id` AS `anexo_id` from `cuota` `c0_` where (((`c0_`.`monto` > `c0_`.`pagado`) or isnull(`c0_`.`pagado`)) and (isnull(`c0_`.`anular`) or (`c0_`.`anular` = 0))) group by `c0_`.`contrato_id`;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_encuestas`
--
DROP TABLE IF EXISTS `vw_encuestas`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_encuestas` AS select `encuesta`.`contrato_id` AS `contrato_id`,`funcion_encuesta`.`nombre` AS `nombre_funcion_encuesta`,`funcion_respuesta`.`nombre` AS `nombre_funcion_respuesta`,max(`encuesta`.`fecha_creacion`) AS `fecha_creacion`,max(`encuesta`.`usuario_creacion_id`) AS `usuario_creacion_id`,`encuesta`.`observacion` AS `observacion`,`vista_nota_max`.`nota` AS `nota`,`encuesta`.`fecha_cierre` AS `fecha_cierre`,`encuesta_preguntas`.`pregunta` AS `pregunta`,`encuesta_preguntas`.`respuesta_abierta` AS `respuesta_abierta` from ((((`encuesta` join `funcion_respuesta` on((`encuesta`.`funcion_respuesta_id` = `funcion_respuesta`.`id`))) join `funcion_encuesta` on((`funcion_respuesta`.`funcion_encuesta_id` = `funcion_encuesta`.`id`))) join `vista_nota_max` on((`vista_nota_max`.`encuesta_id` = `encuesta`.`id`))) join `encuesta_preguntas` on((`encuesta_preguntas`.`encuesta_id` = `encuesta`.`id`))) where ((`encuesta`.`funcion_respuesta_id` = 1) and (`encuesta`.`estado_id` = 2) and (`encuesta_preguntas`.`tipo_pregunta` = 3)) group by `encuesta`.`contrato_id`;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_gestiones`
--
DROP TABLE IF EXISTS `vw_gestiones`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_gestiones` AS select `encuesta`.`contrato_id` AS `contrato_id`,`funcion_encuesta`.`nombre` AS `nombre_funcion_encuesta`,`funcion_respuesta`.`nombre` AS `nombre_funcion_respuesta`,max(`encuesta`.`fecha_creacion`) AS `fecha_creacion`,max(`encuesta`.`usuario_creacion_id`) AS `usuario_creacion_id`,`encuesta`.`observacion` AS `observacion` from ((`encuesta` join `funcion_respuesta` on((`encuesta`.`funcion_respuesta_id` = `funcion_respuesta`.`id`))) join `funcion_encuesta` on((`funcion_respuesta`.`funcion_encuesta_id` = `funcion_encuesta`.`id`))) where ((`encuesta`.`funcion_respuesta_id` <> 1) and (`encuesta`.`estado_id` = 2)) group by `encuesta`.`contrato_id`;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_max_fecha_anexo`
--
DROP TABLE IF EXISTS `vw_max_fecha_anexo`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_max_fecha_anexo` AS select `contrato_anexo`.`contrato_id` AS `contrato_id`,max(`contrato_anexo`.`fecha_creacion`) AS `max_fecha` from `contrato_anexo` where (ifnull(`contrato_anexo`.`is_desiste`,0) <> 1) group by `contrato_anexo`.`contrato_id`;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_max_fecha_observacion_causa`
--
DROP TABLE IF EXISTS `vw_max_fecha_observacion_causa`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_max_fecha_observacion_causa` AS select `causa_observacion`.`causa_id` AS `causa_id`,max(`causa_observacion`.`fecha_registro`) AS `max_fecha` from `causa_observacion` group by `causa_observacion`.`causa_id`;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_resumen_causas`
--
DROP TABLE IF EXISTS `vw_resumen_causas`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_resumen_causas` AS select `vw_causas_activas_final`.`cuenta_id` AS `cuenta_id`,`vw_causas_activas_final`.`tramitador_id` AS `tramitador_id`,`vw_causas_activas_final`.`tramitador` AS `tramitador`,count(0) AS `causas_activas`,sum((case when (`vw_causas_activas_final`.`moroso` = 0) then 1 else 0 end)) AS `causas_al_dia`,count(distinct (case when (`vw_causas_activas_final`.`activo` = 1) then `vw_causas_activas_final`.`contrato_id` end)) AS `clientes_activos`,count(distinct (case when ((`vw_causas_activas_final`.`activo` = 1) and (`vw_causas_activas_final`.`moroso` = 0)) then `vw_causas_activas_final`.`contrato_id` end)) AS `clientes_al_dia`,count(distinct (case when (`vw_causas_activas_final`.`moroso` = 1) then `vw_causas_activas_final`.`contrato_id` end)) AS `clientes_morosos`,count(distinct (case when ((`vw_causas_activas_final`.`activo` = 1) and (`vw_causas_activas_final`.`vip` = 1)) then `vw_causas_activas_final`.`contrato_id` end)) AS `clientes_activos_vip`,count(distinct (case when ((`vw_causas_activas_final`.`activo` = 1) and (`vw_causas_activas_final`.`vip` = 1) and (`vw_causas_activas_final`.`moroso` = 0)) then `vw_causas_activas_final`.`contrato_id` end)) AS `clientes_al_dia_vip`,count((case when ((`vw_causas_activas_final`.`activo` = 1) and (`vw_causas_activas_final`.`tieneRol` = 1)) then 1 end)) AS `causas_activas_con_rol`,count((case when ((`vw_causas_activas_final`.`activo` = 1) and (`vw_causas_activas_final`.`tieneRol` = 0)) then 1 end)) AS `causas_activas_sin_rol`,count((case when ((`vw_causas_activas_final`.`activo` = 1) and (`vw_causas_activas_final`.`causa_finalizada` = 1)) then 1 end)) AS `causas_activas_finalizadas` from `vw_causas_activas_final` where (`vw_causas_activas_final`.`activo` = 1) group by `vw_causas_activas_final`.`tramitador_id`;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_vip_mayor_2mm`
--
DROP TABLE IF EXISTS `vw_vip_mayor_2mm`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_vip_mayor_2mm` AS select `contrato`.`id` AS `contrato_id`,`contrato`.`folio` AS `folio`,`contrato`.`cuotas` AS `cuotas` from (((`contrato` join `agenda`) join `cuenta_materia`) join `materia`) where ((`contrato`.`monto_contrato` >= 2000000) and (`contrato`.`agenda_id` = `agenda`.`id`) and (`agenda`.`cuenta_id` = `cuenta_materia`.`cuenta_id`) and (`cuenta_materia`.`materia_id` = `materia`.`id`));

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_vip_referidos`
--
DROP TABLE IF EXISTS `vw_vip_referidos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_vip_referidos` AS select `contrato`.`id` AS `contrato_id`,`contrato`.`folio` AS `folio`,`contrato`.`cuotas` AS `cuotas`,`agenda`.`agenda_contacto_id` AS `referidos` from (((`contrato` join `agenda`) join `cuenta_materia`) join `materia`) where (isnull(`contrato`.`fecha_desiste`) and (`contrato`.`agenda_id` = `agenda`.`id`) and (`agenda`.`agenda_contacto_id` = 4) and (`agenda`.`cuenta_id` = `cuenta_materia`.`cuenta_id`) and (`cuenta_materia`.`materia_id` = `materia`.`id`));

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_vip_una_cuota`
--
DROP TABLE IF EXISTS `vw_vip_una_cuota`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_vip_una_cuota` AS select `contrato`.`id` AS `contrato_id`,`contrato`.`folio` AS `folio`,`contrato`.`cuotas` AS `cuotas`,`cuota`.`numero` AS `numero` from ((((`contrato` join `agenda`) join `cuenta_materia`) join `materia`) join `cuota`) where (isnull(`contrato`.`fecha_desiste`) and (`contrato`.`monto_contrato` = `contrato`.`valor_cuota`) and (`contrato`.`agenda_id` = `agenda`.`id`) and (`agenda`.`cuenta_id` = `cuenta_materia`.`cuenta_id`) and (`cuenta_materia`.`materia_id` = `materia`.`id`) and (`contrato`.`id` = `cuota`.`contrato_id`) and isnull(`cuota`.`anular`) and (`cuota`.`numero` = 1) and (`contrato`.`monto_contrato` = `cuota`.`monto`));

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `accion`
--
ALTER TABLE `accion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_8A02E3B4521E1991` (`empresa_id`);

--
-- Indices de la tabla `actuacion`
--
ALTER TABLE `actuacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_321583D3EE4BC97C` (`cuaderno_id`);

--
-- Indices de la tabla `actuacion_anexo_procesal`
--
ALTER TABLE `actuacion_anexo_procesal`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_7C63AABB94FD6108` (`actuacion_id`),
  ADD KEY `IDX_7C63AABB223672E3` (`anexo_procesal_id`);

--
-- Indices de la tabla `agenda`
--
ALTER TABLE `agenda`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_2CEDC8779AEFF118` (`cuenta_id`),
  ADD KEY `IDX_2CEDC877CA6D16AE` (`gestionar_id`),
  ADD KEY `IDX_2CEDC877BBF3C044` (`agendador_id`),
  ADD KEY `IDX_2CEDC877279A5D5E` (`sucursal_id`),
  ADD KEY `FK_2CEDC8776BF700BD` (`status_id`),
  ADD KEY `IDX_2CEDC877BDBF9863` (`abogado_id`),
  ADD KEY `IDX_2CEDC8774E9B7368` (`reunion_id`),
  ADD KEY `IDX_2CEDC877D88CBC6F` (`agenda_contacto_id`),
  ADD KEY `FK_2CEDC87779FA4603` (`sub_status_id`),
  ADD KEY `IDX_2CEDC87768DB5B2E` (`canal_id`);

--
-- Indices de la tabla `agenda_contacto`
--
ALTER TABLE `agenda_contacto`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `agenda_observacion`
--
ALTER TABLE `agenda_observacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_BB645400EA67784A` (`agenda_id`),
  ADD KEY `IDX_BB6454001EEFD20` (`usuario_registro_id`),
  ADD KEY `IDX_BB6454006BF700BD` (`status_id`),
  ADD KEY `FK_BB64540079FA4603` (`sub_status_id`),
  ADD KEY `FK_BB645400CF6BBC1E` (`abogado_destino_id`);

--
-- Indices de la tabla `agenda_status`
--
ALTER TABLE `agenda_status`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `agenda_sub_status`
--
ALTER TABLE `agenda_sub_status`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_73CBC2A82129FD49` (`agenda_status_id`);

--
-- Indices de la tabla `anexo_procesal`
--
ALTER TABLE `anexo_procesal`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `canal`
--
ALTER TABLE `canal`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_E181FB59521E1991` (`empresa_id`),
  ADD KEY `IDX_E181FB591EEFD20` (`usuario_registro_id`);

--
-- Indices de la tabla `cartera`
--
ALTER TABLE `cartera`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_EA7592ECB54DBBCB` (`materia_id`);

--
-- Indices de la tabla `causa`
--
ALTER TABLE `causa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_F7B7BBA6516A508C` (`materia_estrategia_id`),
  ADD KEY `IDX_F7B7BBA6AABE9B97` (`juzgado_cuenta_id`),
  ADD KEY `IDX_F7B7BBA6EA67784A` (`agenda_id`),
  ADD KEY `FK_F7B7BBA6C9348664` (`anexo_id`);

--
-- Indices de la tabla `causa_observacion`
--
ALTER TABLE `causa_observacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_23D9D014E980B549` (`causa_id`),
  ADD KEY `IDX_23D9D0141EEFD20` (`usuario_registro_id`),
  ADD KEY `IDX_23D9D01470AE7BF1` (`contrato_id`);

--
-- Indices de la tabla `causa_observacion_archivo`
--
ALTER TABLE `causa_observacion_archivo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_A103715835961D0` (`causa_observacion_id`);

--
-- Indices de la tabla `ciudad`
--
ALTER TABLE `ciudad`
  ADD PRIMARY KEY (`id`),
  ADD KEY `region_id` (`region_id`);

--
-- Indices de la tabla `cliente_potencial`
--
ALTER TABLE `cliente_potencial`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `cobranza`
--
ALTER TABLE `cobranza`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_AE20EF3D8C185C36` (`funcion_id`),
  ADD KEY `IDX_AE20EF3DD9BA57A2` (`respuesta_id`),
  ADD KEY `IDX_AE20EF3D1EEFD20` (`usuario_registro_id`);

--
-- Indices de la tabla `cobranza_funcion`
--
ALTER TABLE `cobranza_funcion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_79CE3564521E1991` (`empresa_id`);

--
-- Indices de la tabla `cobranza_respuesta`
--
ALTER TABLE `cobranza_respuesta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_B792E924521E1991` (`empresa_id`);

--
-- Indices de la tabla `comuna`
--
ALTER TABLE `comuna`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ciudad_id` (`ciudad_id`);

--
-- Indices de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `contrato`
--
ALTER TABLE `contrato`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_66696523EA67784A` (`agenda_id`),
  ADD KEY `IDX_6669652375376D93` (`estado_civil_id`),
  ADD KEY `IDX_666965238577D28` (`situacion_laboral_id`),
  ADD KEY `IDX_6669652362144410` (`estrategia_juridica_id`),
  ADD KEY `IDX_666965235D855194` (`escritura_id`),
  ADD KEY `FK_66696523279A5D5E` (`sucursal_id`),
  ADD KEY `IDX_666965232D21BFE2` (`tramitador_id`),
  ADD KEY `IDX_66696523DE734E51` (`cliente_id`),
  ADD KEY `IDX_66696523C604D5C6` (`pais_id`),
  ADD KEY `IDX_6669652325F7D575` (`vehiculo_id`),
  ADD KEY `IDX_6669652381A75788` (`vivienda_id`),
  ADD KEY `IDX_666965234E9B7368` (`reunion_id`),
  ADD KEY `FK_666965236FEFB00C` (`id_lote_id`),
  ADD KEY `IDX_6669652338692C4C` (`ccomuna_id`),
  ADD KEY `IDX_66696523D73341BF` (`cciudad_id`),
  ADD KEY `IDX_66696523A775C2FE` (`cregion_id`),
  ADD KEY `FK_66696523A5A18135` (`cartera_id`),
  ADD KEY `IDX_666965239C833003` (`grupo_id`),
  ADD KEY `FK_666965237C88A2F6` (`estado_encuesta_id`);

--
-- Indices de la tabla `contrato_anexo`
--
ALTER TABLE `contrato_anexo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_9DD8C30E70AE7BF1` (`contrato_id`),
  ADD KEY `IDX_9DD8C30E1EEFD20` (`usuario_registro_id`);

--
-- Indices de la tabla `contrato_archivos`
--
ALTER TABLE `contrato_archivos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_D5B9B41B1EEFD20` (`usuario_registro_id`),
  ADD KEY `IDX_D5B9B41B70AE7BF1` (`contrato_id`),
  ADD KEY `IDX_D5B9B41BE980B549` (`causa_id`);

--
-- Indices de la tabla `contrato_audios`
--
ALTER TABLE `contrato_audios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_4E43327E70AE7BF1` (`contrato_id`),
  ADD KEY `IDX_4E43327E1EEFD20` (`usuario_registro_id`);

--
-- Indices de la tabla `contrato_casetracking`
--
ALTER TABLE `contrato_casetracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_60E9F46A70AE7BF1` (`contrato_id`),
  ADD KEY `FK_60E9F46AB54DBBCB` (`materia_id`);

--
-- Indices de la tabla `contrato_mee`
--
ALTER TABLE `contrato_mee`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_3B028F3670AE7BF1` (`contrato_id`),
  ADD KEY `IDX_3B028F36C1825E09` (`mee_id`);

--
-- Indices de la tabla `contrato_observacion`
--
ALTER TABLE `contrato_observacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_1AA2E2DE1EEFD20` (`usuario_registro_id`),
  ADD KEY `IDX_1AA2E2DE70AE7BF1` (`contrato_id`);

--
-- Indices de la tabla `contrato_rol`
--
ALTER TABLE `contrato_rol`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_AF4B3B55B9A57363` (`juzgado_id`),
  ADD KEY `IDX_AF4B3B5570AE7BF1` (`contrato_id`),
  ADD KEY `IDX_AF4B3B55BDBF9863` (`abogado_id`);

--
-- Indices de la tabla `contrato_vehiculo`
--
ALTER TABLE `contrato_vehiculo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_4CEA6AB521E1991` (`empresa_id`);

--
-- Indices de la tabla `contrato_vivienda`
--
ALTER TABLE `contrato_vivienda`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_E0CB1B76521E1991` (`empresa_id`);

--
-- Indices de la tabla `cuaderno`
--
ALTER TABLE `cuaderno`
  ADD PRIMARY KEY (`id`),
  ADD KEY `estrategia_juridica_id` (`estrategia_juridica_id`),
  ADD KEY `FK_57F20B209EB2E0E0` (`depende_cuaderno_id`);

--
-- Indices de la tabla `cuenta`
--
ALTER TABLE `cuenta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_31C7BFCF521E1991` (`empresa_id`);

--
-- Indices de la tabla `cuenta_corriente`
--
ALTER TABLE `cuenta_corriente`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `cuenta_materia`
--
ALTER TABLE `cuenta_materia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_FCAF66119AEFF118` (`cuenta_id`),
  ADD KEY `IDX_FCAF6611B54DBBCB` (`materia_id`);

--
-- Indices de la tabla `cuota`
--
ALTER TABLE `cuota`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_763CCB0FBAF036CE` (`usuario_anulacion_id`),
  ADD KEY `IDX_763CCB0F70AE7BF1` (`contrato_id`),
  ADD KEY `IDX_763CCB0FC9348664` (`anexo_id`);

--
-- Indices de la tabla `detalle_cuaderno`
--
ALTER TABLE `detalle_cuaderno`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_8FB7FE14EE4BC97C` (`cuaderno_id`),
  ADD KEY `IDX_8FB7FE1494FD6108` (`actuacion_id`),
  ADD KEY `IDX_8FB7FE14223672E3` (`anexo_procesal_id`),
  ADD KEY `IDX_8FB7FE14E980B549` (`causa_id`),
  ADD KEY `usuario_creacion_id` (`usuario_creacion_id`);

--
-- Indices de la tabla `dias_pago`
--
ALTER TABLE `dias_pago`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `empresa`
--
ALTER TABLE `empresa`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `encuesta`
--
ALTER TABLE `encuesta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_B25B684170AE7BF1` (`contrato_id`),
  ADD KEY `IDX_B25B6841AEADF654` (`usuario_creacion_id`),
  ADD KEY `IDX_B25B68415A7EBB88` (`funcion_encuesta_id`),
  ADD KEY `IDX_B25B6841570A09D` (`funcion_respuesta_id`);

--
-- Indices de la tabla `encuesta_preguntas`
--
ALTER TABLE `encuesta_preguntas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_5C80177346844BA6` (`encuesta_id`);

--
-- Indices de la tabla `escritura`
--
ALTER TABLE `escritura`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_2B6F7E72521E1991` (`empresa_id`);

--
-- Indices de la tabla `estado_civil`
--
ALTER TABLE `estado_civil`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_F4222D84521E1991` (`empresa_id`);

--
-- Indices de la tabla `estado_encuesta`
--
ALTER TABLE `estado_encuesta`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `estrategia_juridica`
--
ALTER TABLE `estrategia_juridica`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_B649EC96521E1991` (`empresa_id`),
  ADD KEY `IDX_B649EC9663AA8B75` (`linea_tiempo_id`);

--
-- Indices de la tabla `estrategia_juridica_reporte`
--
ALTER TABLE `estrategia_juridica_reporte`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_EBBC246C62144410` (`estrategia_juridica_id`);

--
-- Indices de la tabla `estrategia_juridica_reporte_archivos`
--
ALTER TABLE `estrategia_juridica_reporte_archivos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_6A70915AE980B549` (`causa_id`),
  ADD KEY `IDX_6A70915A14B3E99E` (`estrategia_juridica_reporte_id`),
  ADD KEY `IDX_6A70915AAEADF654` (`usuario_creacion_id`);

--
-- Indices de la tabla `funcion_encuesta`
--
ALTER TABLE `funcion_encuesta`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `funcion_respuesta`
--
ALTER TABLE `funcion_respuesta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_F48A1AA45A7EBB88` (`funcion_encuesta_id`);

--
-- Indices de la tabla `gateway_pagos_solicitados_detail`
--
ALTER TABLE `gateway_pagos_solicitados_detail`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `gateway_pagos_solicitados_header`
--
ALTER TABLE `gateway_pagos_solicitados_header`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `gestionar`
--
ALTER TABLE `gestionar`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `grupo`
--
ALTER TABLE `grupo`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `html_tempaltes`
--
ALTER TABLE `html_tempaltes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `importacion`
--
ALTER TABLE `importacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_F483A40E9AEFF118` (`cuenta_id`),
  ADD KEY `IDX_F483A40E8924462A` (`usuario_carga_id`);

--
-- Indices de la tabla `importancia`
--
ALTER TABLE `importancia`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `inf_agendados`
--
ALTER TABLE `inf_agendados`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_46D6EC48BDBF9863` (`abogado_id`),
  ADD KEY `IDX_46D6EC48DB38439E` (`usuario_id`);

--
-- Indices de la tabla `inf_comision_cobradores`
--
ALTER TABLE `inf_comision_cobradores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_2B0F631370AE7BF1` (`contrato_id`),
  ADD KEY `IDX_2B0F6313A87A7CB6` (`cobranza_id`),
  ADD KEY `IDX_2B0F631363FB8380` (`pago_id`),
  ADD KEY `IDX_2B0F63136A7CF079` (`cuota_id`);

--
-- Indices de la tabla `inf_seguimiento`
--
ALTER TABLE `inf_seguimiento`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_2E15E2CDDB38439E` (`usuario_id`);

--
-- Indices de la tabla `juzgado`
--
ALTER TABLE `juzgado`
  ADD PRIMARY KEY (`id`),
  ADD KEY `empresa_id` (`empresa_id`);

--
-- Indices de la tabla `juzgado_cuenta`
--
ALTER TABLE `juzgado_cuenta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_FCE1830F9AEFF118` (`cuenta_id`),
  ADD KEY `IDX_FCE1830FB9A57363` (`juzgado_id`);

--
-- Indices de la tabla `linea_tiempo`
--
ALTER TABLE `linea_tiempo`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `linea_tiempo_etapas`
--
ALTER TABLE `linea_tiempo_etapas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_6535CAFD63AA8B75` (`linea_tiempo_id`);

--
-- Indices de la tabla `linea_tiempo_terminada`
--
ALTER TABLE `linea_tiempo_terminada`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_271DA87BE980B549` (`causa_id`),
  ADD KEY `IDX_271DA87BBCFBDE31` (`linea_tiempo_etapas_id`),
  ADD KEY `IDX_271DA87B1EEFD20` (`usuario_registro_id`);

--
-- Indices de la tabla `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `lotes`
--
ALTER TABLE `lotes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_7BDBF5EC521E1991` (`empresa_id`);

--
-- Indices de la tabla `mails_enviados`
--
ALTER TABLE `mails_enviados`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `materia`
--
ALTER TABLE `materia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_6DF05284521E1991` (`empresa_id`);

--
-- Indices de la tabla `materia_estrategia`
--
ALTER TABLE `materia_estrategia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_8A1D519EB54DBBCB` (`materia_id`),
  ADD KEY `IDX_8A1D519E62144410` (`estrategia_juridica_id`);

--
-- Indices de la tabla `mee`
--
ALTER TABLE `mee`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_9A1C8B54516A508C` (`materia_estrategia_id`),
  ADD KEY `IDX_9A1C8B545D855194` (`escritura_id`);

--
-- Indices de la tabla `mensaje`
--
ALTER TABLE `mensaje`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_9B631D013F7A1974` (`mensaje_tipo_id`),
  ADD KEY `IDX_9B631D011EEFD20` (`usuario_registro_id`),
  ADD KEY `IDX_9B631D0117064CB7` (`usuario_destino_id`);

--
-- Indices de la tabla `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_7D053A93521E1991` (`empresa_id`),
  ADD KEY `IDX_7D053A93A53F971C` (`depende_de_id`),
  ADD KEY `IDX_7D053A93975F194D` (`menu_cabezera_id`),
  ADD KEY `IDX_7D053A93C07F55F5` (`modulo_id`);

--
-- Indices de la tabla `menu_cabezera`
--
ALTER TABLE `menu_cabezera`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_431A2F13521E1991` (`empresa_id`);

--
-- Indices de la tabla `migration_versions`
--
ALTER TABLE `migration_versions`
  ADD PRIMARY KEY (`version`);

--
-- Indices de la tabla `modulo`
--
ALTER TABLE `modulo`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `modulo_per`
--
ALTER TABLE `modulo_per`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_ABF22FE5521E1991` (`empresa_id`),
  ADD KEY `IDX_ABF22FE5C07F55F5` (`modulo_id`);

--
-- Indices de la tabla `movatec_log`
--
ALTER TABLE `movatec_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_324FE63BEA67784A` (`agenda_id`);

--
-- Indices de la tabla `movimientospjud`
--
ALTER TABLE `movimientospjud`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_10786DC01EEFD20` (`usuario_registro_id`);

--
-- Indices de la tabla `pago`
--
ALTER TABLE `pago`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_F4DF5F3EC6690F67` (`pago_tipo_id`),
  ADD KEY `IDX_F4DF5F3EFF66CCC7` (`pago_canal_id`),
  ADD KEY `IDX_F4DF5F3E1EEFD20` (`usuario_registro_id`),
  ADD KEY `IDX_F4DF5F3E1FB75A3B` (`cuenta_corriente_id`),
  ADD KEY `IDX_F4DF5F3EBAF036CE` (`usuario_anulacion_id`),
  ADD KEY `contrato_id` (`contrato_id`),
  ADD KEY `contrato_id_2` (`contrato_id`),
  ADD KEY `contrato_id_3` (`contrato_id`);

--
-- Indices de la tabla `pago_canal`
--
ALTER TABLE `pago_canal`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_23705BC1521E1991` (`empresa_id`);

--
-- Indices de la tabla `pago_cuotas`
--
ALTER TABLE `pago_cuotas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_75D1048763FB8380` (`pago_id`),
  ADD KEY `IDX_75D104876A7CF079` (`cuota_id`);

--
-- Indices de la tabla `pago_tipo`
--
ALTER TABLE `pago_tipo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_567222FB521E1991` (`empresa_id`);

--
-- Indices de la tabla `pais`
--
ALTER TABLE `pais`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_7E5D2EFF521E1991` (`empresa_id`);

--
-- Indices de la tabla `privilegio`
--
ALTER TABLE `privilegio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_D0E1EA51DB38439E` (`usuario_id`),
  ADD KEY `IDX_D0E1EA513F4B5275` (`accion_id`),
  ADD KEY `IDX_D0E1EA5188C77C8D` (`modulo_per_id`);

--
-- Indices de la tabla `privilegio_tipousuario`
--
ALTER TABLE `privilegio_tipousuario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_BE31D90E3F4B5275` (`accion_id`),
  ADD KEY `IDX_BE31D90E74CA5DCD` (`tipousuario_id`),
  ADD KEY `IDX_BE31D90E88C77C8D` (`modulo_per_id`);

--
-- Indices de la tabla `region`
--
ALTER TABLE `region`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `reset_password_request`
--
ALTER TABLE `reset_password_request`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_7CE748AA76ED395` (`user_id`);

--
-- Indices de la tabla `reunion`
--
ALTER TABLE `reunion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_5B00A482521E1991` (`empresa_id`);

--
-- Indices de la tabla `situacion_laboral`
--
ALTER TABLE `situacion_laboral`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_7F28676521E1991` (`empresa_id`);

--
-- Indices de la tabla `sucursal`
--
ALTER TABLE `sucursal`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_E99C6D569AEFF118` (`cuenta_id`);

--
-- Indices de la tabla `ticket`
--
ALTER TABLE `ticket`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_97A0ADA370AE7BF1` (`contrato_id`),
  ADD KEY `IDX_97A0ADA393529ECD` (`origen_id`),
  ADD KEY `IDX_97A0ADA3E4360615` (`destino_id`),
  ADD KEY `IDX_97A0ADA34D75585E` (`encargado_id`),
  ADD KEY `IDX_97A0ADA3521E1991` (`empresa_id`),
  ADD KEY `IDX_97A0ADA39F5A440B` (`estado_id`),
  ADD KEY `IDX_97A0ADA3C56AE4E9` (`importancia_id`),
  ADD KEY `IDX_97A0ADA3A5EB373E` (`ticket_tipo_id`);

--
-- Indices de la tabla `ticket_estado`
--
ALTER TABLE `ticket_estado`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `ticket_historial`
--
ALTER TABLE `ticket_historial`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_BCAFDC18700047D2` (`ticket_id`),
  ADD KEY `IDX_BCAFDC181EEFD20` (`usuario_registro_id`),
  ADD KEY `IDX_BCAFDC189F5A440B` (`estado_id`);

--
-- Indices de la tabla `ticket_tipo`
--
ALTER TABLE `ticket_tipo`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_2265B05DF85E0677` (`username`),
  ADD KEY `IDX_2265B05DD001C42B` (`usuario_tipo_id`),
  ADD KEY `IDX_2265B05D3397707A` (`categoria_id`),
  ADD KEY `IDX_2265B05D6BF700BD` (`status_id`);

--
-- Indices de la tabla `usuario_cartera`
--
ALTER TABLE `usuario_cartera`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_935338ABDB38439E` (`usuario_id`),
  ADD KEY `IDX_935338ABA5A18135` (`cartera_id`);

--
-- Indices de la tabla `usuario_categoria`
--
ALTER TABLE `usuario_categoria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_C72BF83F521E1991` (`empresa_id`);

--
-- Indices de la tabla `usuario_cuenta`
--
ALTER TABLE `usuario_cuenta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_CBD55CC69AEFF118` (`cuenta_id`),
  ADD KEY `IDX_CBD55CC6DB38439E` (`usuario_id`);

--
-- Indices de la tabla `usuario_grupo`
--
ALTER TABLE `usuario_grupo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_91D0F1CDDB38439E` (`usuario_id`),
  ADD KEY `IDX_91D0F1CD9C833003` (`grupo_id`);

--
-- Indices de la tabla `usuario_lote`
--
ALTER TABLE `usuario_lote`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_CCE488FDB38439E` (`usuario_id`),
  ADD KEY `IDX_CCE488FB172197C` (`lote_id`);

--
-- Indices de la tabla `usuario_no_disponible`
--
ALTER TABLE `usuario_no_disponible`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_7C64E39CDB38439E` (`usuario_id`);

--
-- Indices de la tabla `usuario_status`
--
ALTER TABLE `usuario_status`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuario_tipo`
--
ALTER TABLE `usuario_tipo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_19576757975F194D` (`menu_cabezera_id`),
  ADD KEY `IDX_19576757521E1991` (`empresa_id`);

--
-- Indices de la tabla `usuario_tipo_documento`
--
ALTER TABLE `usuario_tipo_documento`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuario_usuariocategoria`
--
ALTER TABLE `usuario_usuariocategoria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `cuenta_id` (`cuenta_id`),
  ADD KEY `agenda_id` (`agenda_id`);

--
-- Indices de la tabla `vencimiento`
--
ALTER TABLE `vencimiento`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_66923AA8521E1991` (`empresa_id`);

--
-- Indices de la tabla `webhook`
--
ALTER TABLE `webhook`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `accion`
--
ALTER TABLE `accion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `actuacion`
--
ALTER TABLE `actuacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `actuacion_anexo_procesal`
--
ALTER TABLE `actuacion_anexo_procesal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `agenda`
--
ALTER TABLE `agenda`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `agenda_contacto`
--
ALTER TABLE `agenda_contacto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `agenda_observacion`
--
ALTER TABLE `agenda_observacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `agenda_status`
--
ALTER TABLE `agenda_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `agenda_sub_status`
--
ALTER TABLE `agenda_sub_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `anexo_procesal`
--
ALTER TABLE `anexo_procesal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `canal`
--
ALTER TABLE `canal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `cartera`
--
ALTER TABLE `cartera`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `causa`
--
ALTER TABLE `causa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `causa_observacion`
--
ALTER TABLE `causa_observacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `causa_observacion_archivo`
--
ALTER TABLE `causa_observacion_archivo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `cliente_potencial`
--
ALTER TABLE `cliente_potencial`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `cobranza`
--
ALTER TABLE `cobranza`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `cobranza_funcion`
--
ALTER TABLE `cobranza_funcion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `cobranza_respuesta`
--
ALTER TABLE `cobranza_respuesta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `contrato`
--
ALTER TABLE `contrato`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `contrato_anexo`
--
ALTER TABLE `contrato_anexo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `contrato_archivos`
--
ALTER TABLE `contrato_archivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `contrato_audios`
--
ALTER TABLE `contrato_audios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `contrato_casetracking`
--
ALTER TABLE `contrato_casetracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `contrato_mee`
--
ALTER TABLE `contrato_mee`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `contrato_observacion`
--
ALTER TABLE `contrato_observacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `contrato_rol`
--
ALTER TABLE `contrato_rol`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `contrato_vehiculo`
--
ALTER TABLE `contrato_vehiculo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `contrato_vivienda`
--
ALTER TABLE `contrato_vivienda`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `cuaderno`
--
ALTER TABLE `cuaderno`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `cuenta`
--
ALTER TABLE `cuenta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `cuenta_corriente`
--
ALTER TABLE `cuenta_corriente`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `cuenta_materia`
--
ALTER TABLE `cuenta_materia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `cuota`
--
ALTER TABLE `cuota`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `detalle_cuaderno`
--
ALTER TABLE `detalle_cuaderno`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `dias_pago`
--
ALTER TABLE `dias_pago`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `empresa`
--
ALTER TABLE `empresa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `encuesta`
--
ALTER TABLE `encuesta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `encuesta_preguntas`
--
ALTER TABLE `encuesta_preguntas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `escritura`
--
ALTER TABLE `escritura`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `estado_civil`
--
ALTER TABLE `estado_civil`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `estado_encuesta`
--
ALTER TABLE `estado_encuesta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `estrategia_juridica`
--
ALTER TABLE `estrategia_juridica`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `estrategia_juridica_reporte`
--
ALTER TABLE `estrategia_juridica_reporte`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `estrategia_juridica_reporte_archivos`
--
ALTER TABLE `estrategia_juridica_reporte_archivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `funcion_encuesta`
--
ALTER TABLE `funcion_encuesta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `funcion_respuesta`
--
ALTER TABLE `funcion_respuesta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `gateway_pagos_solicitados_detail`
--
ALTER TABLE `gateway_pagos_solicitados_detail`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `gateway_pagos_solicitados_header`
--
ALTER TABLE `gateway_pagos_solicitados_header`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `gestionar`
--
ALTER TABLE `gestionar`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `grupo`
--
ALTER TABLE `grupo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `html_tempaltes`
--
ALTER TABLE `html_tempaltes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `importacion`
--
ALTER TABLE `importacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `importancia`
--
ALTER TABLE `importancia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `inf_agendados`
--
ALTER TABLE `inf_agendados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `inf_comision_cobradores`
--
ALTER TABLE `inf_comision_cobradores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `inf_seguimiento`
--
ALTER TABLE `inf_seguimiento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `juzgado`
--
ALTER TABLE `juzgado`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `juzgado_cuenta`
--
ALTER TABLE `juzgado_cuenta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `linea_tiempo`
--
ALTER TABLE `linea_tiempo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `linea_tiempo_etapas`
--
ALTER TABLE `linea_tiempo_etapas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `linea_tiempo_terminada`
--
ALTER TABLE `linea_tiempo_terminada`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `lotes`
--
ALTER TABLE `lotes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `mails_enviados`
--
ALTER TABLE `mails_enviados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `materia`
--
ALTER TABLE `materia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `materia_estrategia`
--
ALTER TABLE `materia_estrategia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `mee`
--
ALTER TABLE `mee`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `mensaje`
--
ALTER TABLE `mensaje`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `menu`
--
ALTER TABLE `menu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `menu_cabezera`
--
ALTER TABLE `menu_cabezera`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `modulo`
--
ALTER TABLE `modulo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `modulo_per`
--
ALTER TABLE `modulo_per`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `movatec_log`
--
ALTER TABLE `movatec_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `movimientospjud`
--
ALTER TABLE `movimientospjud`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `pago`
--
ALTER TABLE `pago`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `pago_canal`
--
ALTER TABLE `pago_canal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `pago_cuotas`
--
ALTER TABLE `pago_cuotas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `pago_tipo`
--
ALTER TABLE `pago_tipo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `pais`
--
ALTER TABLE `pais`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `privilegio`
--
ALTER TABLE `privilegio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `privilegio_tipousuario`
--
ALTER TABLE `privilegio_tipousuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `region`
--
ALTER TABLE `region`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `reset_password_request`
--
ALTER TABLE `reset_password_request`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `reunion`
--
ALTER TABLE `reunion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `situacion_laboral`
--
ALTER TABLE `situacion_laboral`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `sucursal`
--
ALTER TABLE `sucursal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `ticket`
--
ALTER TABLE `ticket`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `ticket_estado`
--
ALTER TABLE `ticket_estado`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `ticket_historial`
--
ALTER TABLE `ticket_historial`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `ticket_tipo`
--
ALTER TABLE `ticket_tipo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `usuario_cartera`
--
ALTER TABLE `usuario_cartera`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `usuario_categoria`
--
ALTER TABLE `usuario_categoria`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `usuario_cuenta`
--
ALTER TABLE `usuario_cuenta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `usuario_grupo`
--
ALTER TABLE `usuario_grupo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `usuario_lote`
--
ALTER TABLE `usuario_lote`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `usuario_no_disponible`
--
ALTER TABLE `usuario_no_disponible`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `usuario_status`
--
ALTER TABLE `usuario_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `usuario_tipo`
--
ALTER TABLE `usuario_tipo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `usuario_tipo_documento`
--
ALTER TABLE `usuario_tipo_documento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `usuario_usuariocategoria`
--
ALTER TABLE `usuario_usuariocategoria`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `webhook`
--
ALTER TABLE `webhook`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `accion`
--
ALTER TABLE `accion`
  ADD CONSTRAINT `FK_8A02E3B4521E1991` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`);

--
-- Filtros para la tabla `actuacion`
--
ALTER TABLE `actuacion`
  ADD CONSTRAINT `FK_321583D3EE4BC97C` FOREIGN KEY (`cuaderno_id`) REFERENCES `cuaderno` (`id`);

--
-- Filtros para la tabla `actuacion_anexo_procesal`
--
ALTER TABLE `actuacion_anexo_procesal`
  ADD CONSTRAINT `FK_7C63AABB223672E3` FOREIGN KEY (`anexo_procesal_id`) REFERENCES `anexo_procesal` (`id`),
  ADD CONSTRAINT `FK_7C63AABB94FD6108` FOREIGN KEY (`actuacion_id`) REFERENCES `actuacion` (`id`);

--
-- Filtros para la tabla `agenda`
--
ALTER TABLE `agenda`
  ADD CONSTRAINT `FK_2CEDC877279A5D5E` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursal` (`id`),
  ADD CONSTRAINT `FK_2CEDC8774E9B7368` FOREIGN KEY (`reunion_id`) REFERENCES `reunion` (`id`),
  ADD CONSTRAINT `FK_2CEDC8776BF700BD` FOREIGN KEY (`status_id`) REFERENCES `agenda_status` (`id`),
  ADD CONSTRAINT `FK_2CEDC87779FA4603` FOREIGN KEY (`sub_status_id`) REFERENCES `agenda_sub_status` (`id`),
  ADD CONSTRAINT `FK_2CEDC8779AEFF118` FOREIGN KEY (`cuenta_id`) REFERENCES `cuenta` (`id`),
  ADD CONSTRAINT `FK_2CEDC877BBF3C044` FOREIGN KEY (`agendador_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_2CEDC877BDBF9863` FOREIGN KEY (`abogado_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_2CEDC877CA6D16AE` FOREIGN KEY (`gestionar_id`) REFERENCES `gestionar` (`id`),
  ADD CONSTRAINT `FK_2CEDC877D88CBC6F` FOREIGN KEY (`agenda_contacto_id`) REFERENCES `agenda_contacto` (`id`);

--
-- Filtros para la tabla `agenda_observacion`
--
ALTER TABLE `agenda_observacion`
  ADD CONSTRAINT `FK_BB6454001EEFD20` FOREIGN KEY (`usuario_registro_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_BB6454006BF700BD` FOREIGN KEY (`status_id`) REFERENCES `agenda_status` (`id`),
  ADD CONSTRAINT `FK_BB64540079FA4603` FOREIGN KEY (`sub_status_id`) REFERENCES `agenda_sub_status` (`id`),
  ADD CONSTRAINT `FK_BB645400CF6BBC1E` FOREIGN KEY (`abogado_destino_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_BB645400EA67784A` FOREIGN KEY (`agenda_id`) REFERENCES `agenda` (`id`);

--
-- Filtros para la tabla `agenda_sub_status`
--
ALTER TABLE `agenda_sub_status`
  ADD CONSTRAINT `FK_73CBC2A82129FD49` FOREIGN KEY (`agenda_status_id`) REFERENCES `agenda_status` (`id`);

--
-- Filtros para la tabla `canal`
--
ALTER TABLE `canal`
  ADD CONSTRAINT `FK_E181FB591EEFD20` FOREIGN KEY (`usuario_registro_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_E181FB59521E1991` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`);

--
-- Filtros para la tabla `cartera`
--
ALTER TABLE `cartera`
  ADD CONSTRAINT `FK_EA7592ECB54DBBCB` FOREIGN KEY (`materia_id`) REFERENCES `materia` (`id`);

--
-- Filtros para la tabla `causa`
--
ALTER TABLE `causa`
  ADD CONSTRAINT `FK_F7B7BBA6C9348664` FOREIGN KEY (`anexo_id`) REFERENCES `contrato_anexo` (`id`);

--
-- Filtros para la tabla `causa_observacion`
--
ALTER TABLE `causa_observacion`
  ADD CONSTRAINT `FK_23D9D0141EEFD20` FOREIGN KEY (`usuario_registro_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_23D9D01470AE7BF1` FOREIGN KEY (`contrato_id`) REFERENCES `contrato` (`id`),
  ADD CONSTRAINT `FK_23D9D014E980B549` FOREIGN KEY (`causa_id`) REFERENCES `causa` (`id`);

--
-- Filtros para la tabla `causa_observacion_archivo`
--
ALTER TABLE `causa_observacion_archivo`
  ADD CONSTRAINT `FK_A103715835961D0` FOREIGN KEY (`causa_observacion_id`) REFERENCES `causa_observacion` (`id`);

--
-- Filtros para la tabla `ciudad`
--
ALTER TABLE `ciudad`
  ADD CONSTRAINT `ciudad_ibfk_1` FOREIGN KEY (`region_id`) REFERENCES `region` (`id`);

--
-- Filtros para la tabla `cobranza`
--
ALTER TABLE `cobranza`
  ADD CONSTRAINT `FK_AE20EF3D1EEFD20` FOREIGN KEY (`usuario_registro_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_AE20EF3D8C185C36` FOREIGN KEY (`funcion_id`) REFERENCES `cobranza_funcion` (`id`),
  ADD CONSTRAINT `FK_AE20EF3DD9BA57A2` FOREIGN KEY (`respuesta_id`) REFERENCES `cobranza_respuesta` (`id`);

--
-- Filtros para la tabla `cobranza_funcion`
--
ALTER TABLE `cobranza_funcion`
  ADD CONSTRAINT `FK_79CE3564521E1991` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`);

--
-- Filtros para la tabla `cobranza_respuesta`
--
ALTER TABLE `cobranza_respuesta`
  ADD CONSTRAINT `FK_B792E924521E1991` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`);

--
-- Filtros para la tabla `comuna`
--
ALTER TABLE `comuna`
  ADD CONSTRAINT `comuna_ibfk_1` FOREIGN KEY (`ciudad_id`) REFERENCES `comuna` (`id`);

--
-- Filtros para la tabla `contrato`
--
ALTER TABLE `contrato`
  ADD CONSTRAINT `FK_6669652325F7D575` FOREIGN KEY (`vehiculo_id`) REFERENCES `contrato_vehiculo` (`id`),
  ADD CONSTRAINT `FK_66696523279A5D5E` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursal` (`id`),
  ADD CONSTRAINT `FK_666965232D21BFE2` FOREIGN KEY (`tramitador_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_6669652338692C4C` FOREIGN KEY (`ccomuna_id`) REFERENCES `comuna` (`id`),
  ADD CONSTRAINT `FK_666965234E9B7368` FOREIGN KEY (`reunion_id`) REFERENCES `reunion` (`id`),
  ADD CONSTRAINT `FK_666965235D855194` FOREIGN KEY (`escritura_id`) REFERENCES `escritura` (`id`),
  ADD CONSTRAINT `FK_6669652362144410` FOREIGN KEY (`estrategia_juridica_id`) REFERENCES `estrategia_juridica` (`id`),
  ADD CONSTRAINT `FK_666965236FEFB00C` FOREIGN KEY (`id_lote_id`) REFERENCES `lotes` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_6669652375376D93` FOREIGN KEY (`estado_civil_id`) REFERENCES `estado_civil` (`id`),
  ADD CONSTRAINT `FK_666965237C88A2F6` FOREIGN KEY (`estado_encuesta_id`) REFERENCES `estado_encuesta` (`id`),
  ADD CONSTRAINT `FK_6669652381A75788` FOREIGN KEY (`vivienda_id`) REFERENCES `contrato_vivienda` (`id`),
  ADD CONSTRAINT `FK_666965238577D28` FOREIGN KEY (`situacion_laboral_id`) REFERENCES `situacion_laboral` (`id`),
  ADD CONSTRAINT `FK_666965239C833003` FOREIGN KEY (`grupo_id`) REFERENCES `grupo` (`id`),
  ADD CONSTRAINT `FK_66696523A5A18135` FOREIGN KEY (`cartera_id`) REFERENCES `cartera` (`id`),
  ADD CONSTRAINT `FK_66696523A775C2FE` FOREIGN KEY (`cregion_id`) REFERENCES `region` (`id`),
  ADD CONSTRAINT `FK_66696523C604D5C6` FOREIGN KEY (`pais_id`) REFERENCES `pais` (`id`),
  ADD CONSTRAINT `FK_66696523D73341BF` FOREIGN KEY (`cciudad_id`) REFERENCES `ciudad` (`id`),
  ADD CONSTRAINT `FK_66696523DE734E51` FOREIGN KEY (`cliente_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_66696523EA67784A` FOREIGN KEY (`agenda_id`) REFERENCES `agenda` (`id`);

--
-- Filtros para la tabla `contrato_anexo`
--
ALTER TABLE `contrato_anexo`
  ADD CONSTRAINT `FK_9DD8C30E1EEFD20` FOREIGN KEY (`usuario_registro_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_9DD8C30E70AE7BF1` FOREIGN KEY (`contrato_id`) REFERENCES `contrato` (`id`);

--
-- Filtros para la tabla `contrato_archivos`
--
ALTER TABLE `contrato_archivos`
  ADD CONSTRAINT `FK_D5B9B41B1EEFD20` FOREIGN KEY (`usuario_registro_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_D5B9B41B70AE7BF1` FOREIGN KEY (`contrato_id`) REFERENCES `contrato` (`id`);

--
-- Filtros para la tabla `contrato_audios`
--
ALTER TABLE `contrato_audios`
  ADD CONSTRAINT `FK_4E43327E1EEFD20` FOREIGN KEY (`usuario_registro_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_4E43327E70AE7BF1` FOREIGN KEY (`contrato_id`) REFERENCES `contrato` (`id`);

--
-- Filtros para la tabla `contrato_casetracking`
--
ALTER TABLE `contrato_casetracking`
  ADD CONSTRAINT `FK_60E9F46A70AE7BF1` FOREIGN KEY (`contrato_id`) REFERENCES `contrato` (`id`),
  ADD CONSTRAINT `FK_60E9F46AB54DBBCB` FOREIGN KEY (`materia_id`) REFERENCES `materia` (`id`);

--
-- Filtros para la tabla `contrato_mee`
--
ALTER TABLE `contrato_mee`
  ADD CONSTRAINT `FK_3B028F3670AE7BF1` FOREIGN KEY (`contrato_id`) REFERENCES `contrato` (`id`),
  ADD CONSTRAINT `FK_3B028F36C1825E09` FOREIGN KEY (`mee_id`) REFERENCES `mee` (`id`);

--
-- Filtros para la tabla `contrato_rol`
--
ALTER TABLE `contrato_rol`
  ADD CONSTRAINT `contrato_rol_ibfk_1` FOREIGN KEY (`contrato_id`) REFERENCES `contrato` (`id`),
  ADD CONSTRAINT `contrato_rol_ibfk_2` FOREIGN KEY (`juzgado_id`) REFERENCES `juzgado` (`id`),
  ADD CONSTRAINT `FK_AF4B3B55BDBF9863` FOREIGN KEY (`abogado_id`) REFERENCES `usuario` (`id`);

--
-- Filtros para la tabla `contrato_vehiculo`
--
ALTER TABLE `contrato_vehiculo`
  ADD CONSTRAINT `FK_4CEA6AB521E1991` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`);

--
-- Filtros para la tabla `contrato_vivienda`
--
ALTER TABLE `contrato_vivienda`
  ADD CONSTRAINT `FK_E0CB1B76521E1991` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`);

--
-- Filtros para la tabla `cuaderno`
--
ALTER TABLE `cuaderno`
  ADD CONSTRAINT `FK_57F20B209EB2E0E0` FOREIGN KEY (`depende_cuaderno_id`) REFERENCES `cuaderno` (`id`);

--
-- Filtros para la tabla `cuenta`
--
ALTER TABLE `cuenta`
  ADD CONSTRAINT `FK_31C7BFCF521E1991` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`);

--
-- Filtros para la tabla `cuenta_materia`
--
ALTER TABLE `cuenta_materia`
  ADD CONSTRAINT `FK_FCAF66119AEFF118` FOREIGN KEY (`cuenta_id`) REFERENCES `cuenta` (`id`),
  ADD CONSTRAINT `FK_FCAF6611B54DBBCB` FOREIGN KEY (`materia_id`) REFERENCES `materia` (`id`);

--
-- Filtros para la tabla `cuota`
--
ALTER TABLE `cuota`
  ADD CONSTRAINT `FK_763CCB0F70AE7BF1` FOREIGN KEY (`contrato_id`) REFERENCES `contrato` (`id`),
  ADD CONSTRAINT `FK_763CCB0FBAF036CE` FOREIGN KEY (`usuario_anulacion_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_763CCB0FC9348664` FOREIGN KEY (`anexo_id`) REFERENCES `contrato_anexo` (`id`);

--
-- Filtros para la tabla `detalle_cuaderno`
--
ALTER TABLE `detalle_cuaderno`
  ADD CONSTRAINT `FK_8FB7FE14223672E3` FOREIGN KEY (`anexo_procesal_id`) REFERENCES `anexo_procesal` (`id`),
  ADD CONSTRAINT `FK_8FB7FE1494FD6108` FOREIGN KEY (`actuacion_id`) REFERENCES `actuacion` (`id`),
  ADD CONSTRAINT `FK_8FB7FE14AEADF654` FOREIGN KEY (`usuario_creacion_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_8FB7FE14E980B549` FOREIGN KEY (`causa_id`) REFERENCES `causa` (`id`),
  ADD CONSTRAINT `FK_8FB7FE14EE4BC97C` FOREIGN KEY (`cuaderno_id`) REFERENCES `cuaderno` (`id`);

--
-- Filtros para la tabla `encuesta`
--
ALTER TABLE `encuesta`
  ADD CONSTRAINT `FK_B25B6841570A09D` FOREIGN KEY (`funcion_respuesta_id`) REFERENCES `funcion_respuesta` (`id`),
  ADD CONSTRAINT `FK_B25B68415A7EBB88` FOREIGN KEY (`funcion_encuesta_id`) REFERENCES `funcion_encuesta` (`id`),
  ADD CONSTRAINT `FK_B25B684170AE7BF1` FOREIGN KEY (`contrato_id`) REFERENCES `contrato` (`id`),
  ADD CONSTRAINT `FK_B25B6841AEADF654` FOREIGN KEY (`usuario_creacion_id`) REFERENCES `usuario` (`id`);

--
-- Filtros para la tabla `encuesta_preguntas`
--
ALTER TABLE `encuesta_preguntas`
  ADD CONSTRAINT `FK_5C80177346844BA6` FOREIGN KEY (`encuesta_id`) REFERENCES `encuesta` (`id`);

--
-- Filtros para la tabla `escritura`
--
ALTER TABLE `escritura`
  ADD CONSTRAINT `FK_2B6F7E72521E1991` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`);

--
-- Filtros para la tabla `estado_civil`
--
ALTER TABLE `estado_civil`
  ADD CONSTRAINT `FK_F4222D84521E1991` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`);

--
-- Filtros para la tabla `estrategia_juridica`
--
ALTER TABLE `estrategia_juridica`
  ADD CONSTRAINT `FK_B649EC96521E1991` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`),
  ADD CONSTRAINT `FK_B649EC9663AA8B75` FOREIGN KEY (`linea_tiempo_id`) REFERENCES `linea_tiempo` (`id`);

--
-- Filtros para la tabla `estrategia_juridica_reporte`
--
ALTER TABLE `estrategia_juridica_reporte`
  ADD CONSTRAINT `FK_EBBC246C62144410` FOREIGN KEY (`estrategia_juridica_id`) REFERENCES `estrategia_juridica` (`id`);

--
-- Filtros para la tabla `estrategia_juridica_reporte_archivos`
--
ALTER TABLE `estrategia_juridica_reporte_archivos`
  ADD CONSTRAINT `FK_6A70915A14B3E99E` FOREIGN KEY (`estrategia_juridica_reporte_id`) REFERENCES `estrategia_juridica_reporte` (`id`),
  ADD CONSTRAINT `FK_6A70915AAEADF654` FOREIGN KEY (`usuario_creacion_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_6A70915AE980B549` FOREIGN KEY (`causa_id`) REFERENCES `causa` (`id`);

--
-- Filtros para la tabla `funcion_respuesta`
--
ALTER TABLE `funcion_respuesta`
  ADD CONSTRAINT `FK_F48A1AA45A7EBB88` FOREIGN KEY (`funcion_encuesta_id`) REFERENCES `funcion_encuesta` (`id`);

--
-- Filtros para la tabla `importacion`
--
ALTER TABLE `importacion`
  ADD CONSTRAINT `FK_F483A40E8924462A` FOREIGN KEY (`usuario_carga_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_F483A40E9AEFF118` FOREIGN KEY (`cuenta_id`) REFERENCES `cuenta` (`id`);

--
-- Filtros para la tabla `inf_agendados`
--
ALTER TABLE `inf_agendados`
  ADD CONSTRAINT `FK_46D6EC48BDBF9863` FOREIGN KEY (`abogado_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_46D6EC48DB38439E` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`);

--
-- Filtros para la tabla `inf_comision_cobradores`
--
ALTER TABLE `inf_comision_cobradores`
  ADD CONSTRAINT `FK_2B0F631363FB8380` FOREIGN KEY (`pago_id`) REFERENCES `pago` (`id`),
  ADD CONSTRAINT `FK_2B0F63136A7CF079` FOREIGN KEY (`cuota_id`) REFERENCES `cuota` (`id`),
  ADD CONSTRAINT `FK_2B0F631370AE7BF1` FOREIGN KEY (`contrato_id`) REFERENCES `contrato` (`id`),
  ADD CONSTRAINT `FK_2B0F6313A87A7CB6` FOREIGN KEY (`cobranza_id`) REFERENCES `cobranza` (`id`);

--
-- Filtros para la tabla `inf_seguimiento`
--
ALTER TABLE `inf_seguimiento`
  ADD CONSTRAINT `FK_2E15E2CDDB38439E` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`);

--
-- Filtros para la tabla `movatec_log`
--
ALTER TABLE `movatec_log`
  ADD CONSTRAINT `FK_324FE63BEA67784A` FOREIGN KEY (`agenda_id`) REFERENCES `agenda` (`id`);

--
-- Filtros para la tabla `movimientospjud`
--
ALTER TABLE `movimientospjud`
  ADD CONSTRAINT `FK_10786DC01EEFD20` FOREIGN KEY (`usuario_registro_id`) REFERENCES `usuario` (`id`);

--
-- Filtros para la tabla `ticket`
--
ALTER TABLE `ticket`
  ADD CONSTRAINT `FK_97A0ADA3A5EB373E` FOREIGN KEY (`ticket_tipo_id`) REFERENCES `ticket_tipo` (`id`),
  ADD CONSTRAINT `FK_97A0ADA3C56AE4E9` FOREIGN KEY (`importancia_id`) REFERENCES `importancia` (`id`);

--
-- Filtros para la tabla `usuario_grupo`
--
ALTER TABLE `usuario_grupo`
  ADD CONSTRAINT `FK_91D0F1CD9C833003` FOREIGN KEY (`grupo_id`) REFERENCES `grupo` (`id`),
  ADD CONSTRAINT `FK_91D0F1CDDB38439E` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

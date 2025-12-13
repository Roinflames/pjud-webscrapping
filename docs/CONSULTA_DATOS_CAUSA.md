# Consulta de Datos de Causa - Mapeo de Campos

Este documento explica dónde están almacenados los datos de una causa en la base de datos y cómo consultarlos.

## Mapeo de Campos del JSON a la Base de Datos

### Estructura de Relaciones

```
contrato (cliente, rut, folio)
  └── agenda (abogado_id)
      └── causa (rol, id_causa, causa_nombre, letra, anio)
      └── cuenta (nombre - juzgado/compañía)
  └── contrato_rol (nombre_rol, juzgado_id, abogado_id)
      └── juzgado (nombre)
      └── usuario (nombre - abogado)
```

## Campos del JSON y su Ubicación

### 1. **rit** (Rol Único de Ingreso): "16707-2019"

**Ubicación**: Tabla `causa`
- Campo: `id_causa` (VARCHAR) - Puede contener el RIT completo
- O se construye con: `rol` + `-` + `anio`
- Ejemplo: `rol = "16707"` + `anio = 2019` = "16707-2019"

**Consulta**:
```sql
SELECT 
    c.id_causa AS rit_completo,
    CONCAT(c.rol, '-', c.anio) AS rit_construido,
    c.rol,
    c.anio
FROM causa c
WHERE c.id_causa = '16707-2019'
   OR (c.rol = '16707' AND c.anio = 2019);
```

### 2. **competencia**: "3"

**Ubicación**: No hay una tabla directa de "competencia" en el esquema actual.
- Podría estar relacionado con `materia_estrategia` o `materia`
- O podría ser un campo que falta en la base de datos

**Consulta** (si existe en materia):
```sql
SELECT m.id, m.nombre AS competencia
FROM materia m
WHERE m.id = 3;
```

### 3. **corte**: "90"

**Ubicación**: No hay una tabla directa de "corte" en el esquema actual.
- Podría estar relacionado con `juzgado` o ser un código externo
- O podría ser un campo que falta en la base de datos

**Consulta** (si existe relación con juzgado):
```sql
SELECT j.id, j.nombre AS corte
FROM juzgado j
WHERE j.id = 90;
```

### 4. **tribunal**: "276"

**Ubicación**: Tabla `juzgado`
- Campo: `id` (INT) - ID del tribunal/juzgado
- Relación: `contrato_rol.juzgado_id` → `juzgado.id`

**Consulta**:
```sql
SELECT 
    j.id AS tribunal_id,
    j.nombre AS tribunal_nombre
FROM juzgado j
WHERE j.id = 276;
```

### 5. **tipoCausa**: "C"

**Ubicación**: Tabla `causa`
- Campo: `letra` (VARCHAR(10)) - Tipo de causa (C = Civil, L = Laboral, etc.)

**Consulta**:
```sql
SELECT 
    c.id,
    c.letra AS tipoCausa,
    c.rol,
    c.anio
FROM causa c
WHERE c.letra = 'C';
```

### 6. **cliente**: "Carlos Domingo Gutierrez Ramos"

**Ubicación**: Tabla `contrato`
- Campo: `nombre` (VARCHAR(255))

**Consulta**:
```sql
SELECT 
    c.id AS contrato_id,
    c.nombre AS cliente,
    c.rut
FROM contrato c
WHERE c.nombre = 'Carlos Domingo Gutierrez Ramos';
```

### 7. **rut**: "8.462.961-8"

**Ubicación**: Tabla `contrato`
- Campo: `rut` (VARCHAR(255))

**Consulta**:
```sql
SELECT 
    c.id AS contrato_id,
    c.nombre AS cliente,
    c.rut
FROM contrato c
WHERE c.rut = '8.462.961-8';
```

### 8. **caratulado**: "27 Juzgado Civil de Santiago"

**Ubicación**: Tabla `causa`
- Campo: `causa_nombre` (VARCHAR(255))

**Consulta**:
```sql
SELECT 
    c.id AS causa_id,
    c.causa_nombre AS caratulado,
    c.rol,
    c.anio
FROM causa c
WHERE c.causa_nombre = '27 Juzgado Civil de Santiago';
```

### 9. **abogado**: "Tatiana Gonzalez"

**Ubicación**: Tabla `usuario`
- Relación: `agenda.abogado_id` → `usuario.id`
- O: `contrato_rol.abogado_id` → `usuario.id`
- Campo: `nombre` (VARCHAR(50))

**Consulta**:
```sql
SELECT 
    u.id AS abogado_id,
    u.nombre AS abogado
FROM usuario u
WHERE u.nombre = 'Tatiana Gonzalez';
```

### 10. **juzgado**: "Promotora CMR Falabella"

**Ubicación**: 
- Tabla `juzgado` (campo `nombre`)
- O Tabla `cuenta` (campo `nombre`) - si se refiere a la compañía/cliente

**Consulta** (juzgado):
```sql
SELECT 
    j.id AS juzgado_id,
    j.nombre AS juzgado
FROM juzgado j
WHERE j.nombre LIKE '%Promotora CMR Falabella%';
```

**Consulta** (cuenta/compañía):
```sql
SELECT 
    c.id AS cuenta_id,
    c.nombre AS juzgado_compania
FROM cuenta c
WHERE c.nombre LIKE '%Promotora CMR Falabella%';
```

### 11. **folio**: "20212"

**Ubicación**: Tabla `contrato`
- Campo: `folio` (VARCHAR(255))

**Consulta**:
```sql
SELECT 
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente
FROM contrato c
WHERE c.folio = '20212';
```

## Consulta Completa - Obtener Todos los Datos de una Causa

### Opción 1: Usando la Vista `vw_causas_activas_final`

```sql
SELECT 
    contrato_id,
    folio,
    cliente,
    caratulado,
    rol,
    abogado_id,
    cerrador AS abogado_nombre,
    cuenta_nombre AS juzgado
FROM vw_causas_activas_final
WHERE folio = '20212'
   OR cliente LIKE '%Carlos Domingo Gutierrez Ramos%'
   OR rut = '8.462.961-8';
```

### Opción 2: Consulta Manual con JOINs

```sql
SELECT 
    -- Datos del contrato/cliente
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente,
    c.rut,
    
    -- Datos de la causa
    ca.id AS causa_id,
    ca.id_causa AS rit,
    CONCAT(ca.rol, '-', ca.anio) AS rit_construido,
    ca.rol,
    ca.anio,
    ca.letra AS tipoCausa,
    ca.causa_nombre AS caratulado,
    
    -- Datos del abogado
    u_abogado.id AS abogado_id,
    u_abogado.nombre AS abogado,
    
    -- Datos del juzgado
    j.id AS tribunal_id,
    j.nombre AS tribunal_nombre,
    
    -- Datos de la cuenta/compañía
    cuenta.id AS cuenta_id,
    cuenta.nombre AS juzgado_compania,
    
    -- Datos del rol del contrato
    cr.nombre_rol AS nombre_rol
    
FROM contrato c
INNER JOIN agenda a ON c.agenda_id = a.id
INNER JOIN causa ca ON ca.agenda_id = a.id
INNER JOIN usuario u_abogado ON a.abogado_id = u_abogado.id
INNER JOIN cuenta ON a.cuenta_id = cuenta.id
LEFT JOIN contrato_rol cr ON cr.contrato_id = c.id
LEFT JOIN juzgado j ON (cr.juzgado_id = j.id OR j.id = 276)
WHERE c.folio = '20212'
   OR c.rut = '8.462.961-8'
   OR c.nombre LIKE '%Carlos Domingo Gutierrez Ramos%'
   OR ca.id_causa = '16707-2019'
   OR (ca.rol = '16707' AND ca.anio = 2019);
```

### Opción 3: Procedimiento Almacenado Recomendado

Puedes crear un procedimiento almacenado para facilitar las consultas:

```sql
DELIMITER $$

CREATE PROCEDURE `fsp_Buscar_Causa_Completa`(
    IN p_folio VARCHAR(255),
    IN p_rut VARCHAR(255),
    IN p_rit VARCHAR(255)
)
BEGIN
    SELECT 
        -- Datos del contrato/cliente
        c.id AS contrato_id,
        c.folio,
        c.nombre AS cliente,
        c.rut,
        
        -- Datos de la causa
        ca.id AS causa_id,
        COALESCE(ca.id_causa, CONCAT(ca.rol, '-', ca.anio)) AS rit,
        ca.rol,
        ca.anio,
        ca.letra AS tipoCausa,
        ca.causa_nombre AS caratulado,
        
        -- Datos del abogado
        u_abogado.id AS abogado_id,
        u_abogado.nombre AS abogado,
        
        -- Datos del juzgado
        j.id AS tribunal_id,
        j.nombre AS tribunal_nombre,
        
        -- Datos de la cuenta/compañía
        cuenta.id AS cuenta_id,
        cuenta.nombre AS juzgado_compania
        
    FROM contrato c
    INNER JOIN agenda a ON c.agenda_id = a.id
    INNER JOIN causa ca ON ca.agenda_id = a.id
    INNER JOIN usuario u_abogado ON a.abogado_id = u_abogado.id
    INNER JOIN cuenta ON a.cuenta_id = cuenta.id
    LEFT JOIN contrato_rol cr ON cr.contrato_id = c.id
    LEFT JOIN juzgado j ON cr.juzgado_id = j.id
    WHERE 
        (p_folio IS NULL OR c.folio = p_folio)
        AND (p_rut IS NULL OR c.rut = p_rut)
        AND (p_rit IS NULL OR ca.id_causa = p_rit OR CONCAT(ca.rol, '-', ca.anio) = p_rit);
END$$

DELIMITER ;
```

**Uso del procedimiento**:
```sql
-- Buscar por folio
CALL fsp_Buscar_Causa_Completa('20212', NULL, NULL);

-- Buscar por RUT
CALL fsp_Buscar_Causa_Completa(NULL, '8.462.961-8', NULL);

-- Buscar por RIT
CALL fsp_Buscar_Causa_Completa(NULL, NULL, '16707-2019');
```

## Notas Importantes

1. **Campos que pueden no existir directamente**:
   - `competencia`: No hay tabla específica, podría estar en `materia` o ser un campo faltante
   - `corte`: No hay tabla específica, podría estar relacionado con `juzgado` o ser un código externo

2. **Relaciones importantes**:
   - `contrato` → `agenda` → `causa` (relación principal)
   - `agenda` → `usuario` (abogado)
   - `agenda` → `cuenta` (compañía/juzgado)
   - `contrato` → `contrato_rol` → `juzgado` (juzgado específico)

3. **Vistas útiles**:
   - `vw_causas_activas_final`: Vista consolidada con la mayoría de los datos
   - `vw_clientes_activos_final`: Similar pero agrupada por cliente

4. **Formato del RIT**:
   - Puede estar completo en `causa.id_causa`
   - O construirse con `causa.rol` + `-` + `causa.anio`
   - Ejemplo: `rol = "16707"` + `anio = 2019` = "16707-2019"


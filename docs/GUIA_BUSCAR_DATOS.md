# Guía Simple: Buscar Datos de Causa en Producción

## 🎯 Objetivo
Encontrar en la base de datos `codi_ejamtest` los datos que están en `pjud_config.json`

## 📋 Datos que Buscamos (del JSON)
- **rit**: "16707-2019"
- **folio**: "20212"
- **cliente**: "Carlos Domingo Gutierrez Ramos"
- **rut**: "8.462.961-8"
- **caratulado**: "27 Juzgado Civil de Santiago"
- **abogado**: "Tatiana Gonzalez"
- **tribunal**: "276"
- **juzgado**: "Promotora CMR Falabella"
- **tipoCausa**: "C"

---

## 🚀 Pasos para Buscar en XAMPP

### Paso 1: Abrir phpMyAdmin
1. Abre tu navegador
2. Ve a: `http://localhost/phpmyadmin`
3. Selecciona la base de datos: `codi_ejamtest`

### Paso 2: Ejecutar Consultas (en orden)

#### 🔍 Consulta 1: Buscar por FOLIO (la más fácil)
```sql
SELECT 
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente,
    c.rut,
    c.agenda_id
FROM contrato c
WHERE c.folio = '20212';
```

**¿Qué hace?** Busca el contrato con folio "20212". Si encuentras resultados, anota el `contrato_id` y `agenda_id`.

---

#### 🔍 Consulta 2: Buscar la CAUSA relacionada
```sql
SELECT 
    ca.id AS causa_id,
    ca.id_causa AS rit_completo,
    CONCAT(ca.rol, '-', ca.anio) AS rit_construido,
    ca.rol,
    ca.anio,
    ca.letra AS tipoCausa,
    ca.causa_nombre AS caratulado
FROM causa ca
WHERE ca.agenda_id IN (
    SELECT agenda_id 
    FROM contrato 
    WHERE folio = '20212'
);
```

**¿Qué hace?** Busca la causa relacionada con el contrato que encontraste. Aquí deberías ver el RIT "16707-2019" y el caratulado.

---

#### 🔍 Consulta 3: Buscar por RUT
```sql
SELECT 
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente,
    c.rut
FROM contrato c
WHERE c.rut LIKE '%8462961%';
```

**¿Qué hace?** Busca por RUT (con o sin puntos). Si el formato en la BD es diferente, esto lo encontrará.

---

#### 🔍 Consulta 4: Buscar por RIT
```sql
SELECT 
    ca.id AS causa_id,
    ca.id_causa AS rit_completo,
    ca.rol,
    ca.anio,
    ca.causa_nombre AS caratulado
FROM causa ca
WHERE ca.id_causa = '16707-2019'
   OR (ca.rol = '16707' AND ca.anio = 2019);
```

**¿Qué hace?** Busca la causa por RIT. Puede estar completo en `id_causa` o separado en `rol` y `anio`.

---

#### 🔍 Consulta 5: Buscar ABOGADO
```sql
SELECT 
    u.id AS abogado_id,
    u.nombre AS abogado
FROM usuario u
WHERE u.nombre LIKE '%Tatiana%Gonzalez%';
```

**¿Qué hace?** Busca al abogado "Tatiana Gonzalez" en la tabla de usuarios.

---

#### 🔍 Consulta 6: Buscar JUZGADO/TRIBUNAL
```sql
-- Buscar en tabla juzgado
SELECT 
    j.id AS tribunal_id,
    j.nombre AS tribunal_nombre
FROM juzgado j
WHERE j.id = 276
   OR j.nombre LIKE '%CMR%'
   OR j.nombre LIKE '%Falabella%';
```

**¿Qué hace?** Busca el juzgado/tribunal. Puede estar en la tabla `juzgado` o en `cuenta`.

---

## 🎯 Consulta TODO EN UNO (Recomendada)

Esta consulta busca TODOS los datos del JSON de una vez:

```sql
SELECT 
    -- Contrato
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente,
    c.rut,
    
    -- Causa
    ca.id AS causa_id,
    COALESCE(ca.id_causa, CONCAT(ca.rol, '-', ca.anio)) AS rit,
    ca.rol,
    ca.anio,
    ca.letra AS tipoCausa,
    ca.causa_nombre AS caratulado,
    
    -- Abogado
    u_abogado.nombre AS abogado,
    
    -- Juzgado/Tribunal
    j.id AS tribunal_id,
    j.nombre AS tribunal_nombre,
    cuenta.nombre AS juzgado_compania

FROM contrato c
INNER JOIN agenda a ON c.agenda_id = a.id
LEFT JOIN causa ca ON ca.agenda_id = a.id
LEFT JOIN usuario u_abogado ON a.abogado_id = u_abogado.id
LEFT JOIN cuenta ON a.cuenta_id = cuenta.id
LEFT JOIN contrato_rol cr ON cr.contrato_id = c.id
LEFT JOIN juzgado j ON cr.juzgado_id = j.id

WHERE 
    c.folio = '20212'
    OR c.rut LIKE '%8462961%'
    OR c.nombre LIKE '%Carlos%Gutierrez%'
    OR ca.id_causa = '16707-2019'
    OR (ca.rol = '16707' AND ca.anio = 2019)
    OR ca.causa_nombre LIKE '%Juzgado Civil%Santiago%'
    OR u_abogado.nombre LIKE '%Tatiana%Gonzalez%'
    OR j.id = 276;
```

---

## 📊 Cómo Interpretar los Resultados

### Si encuentras resultados:
✅ **Perfecto!** Los datos están en la base de datos. Anota:
- `contrato_id`: ID del contrato
- `causa_id`: ID de la causa
- `agenda_id`: ID de la agenda
- `abogado_id`: ID del abogado

### Si NO encuentras resultados:
❌ Puede ser que:
1. Los datos estén en otra base de datos
2. Los formatos sean diferentes (ej: RUT sin puntos)
3. Los datos no existan en producción

**Solución**: Prueba con búsquedas más amplias:
```sql
-- Buscar solo por parte del nombre
SELECT * FROM contrato WHERE nombre LIKE '%Carlos%';

-- Ver todos los folios similares
SELECT * FROM contrato WHERE folio LIKE '%20212%';

-- Ver todas las causas con ese año
SELECT * FROM causa WHERE anio = 2019;
```

---

## 🔧 Verificar Estructura de Tablas

Si quieres ver qué campos tienen las tablas:

```sql
-- Ver estructura de tabla contrato
DESCRIBE contrato;

-- Ver estructura de tabla causa
DESCRIBE causa;

-- Ver algunos ejemplos de datos
SELECT * FROM contrato LIMIT 5;
SELECT * FROM causa LIMIT 5;
```

---

## 📝 Notas Importantes

1. **Formato de RUT**: En la BD puede estar con o sin puntos. Usa `LIKE '%8462961%'` para buscar ambos.

2. **RIT**: Puede estar en:
   - `causa.id_causa` (completo: "16707-2019")
   - O construido: `causa.rol` + "-" + `causa.anio`

3. **Juzgado**: Puede estar en:
   - `juzgado.nombre` (tabla juzgado)
   - `cuenta.nombre` (tabla cuenta/compañía)

4. **Relaciones**:
   - `contrato` → `agenda` → `causa`
   - `agenda` → `usuario` (abogado)
   - `contrato` → `contrato_rol` → `juzgado`

---

## 🆘 Si No Encuentras Nada

1. **Verifica que estés en la base de datos correcta**: `codi_ejamtest`
2. **Verifica que haya datos**: `SELECT COUNT(*) FROM contrato;`
3. **Busca con criterios más amplios**: Usa `LIKE '%texto%'` en lugar de `=`
4. **Revisa los formatos**: Los datos pueden estar en diferente formato (mayúsculas, espacios, etc.)

---

## ✅ Checklist

- [ ] Abrí phpMyAdmin
- [ ] Seleccioné la base de datos `codi_ejamtest`
- [ ] Ejecuté la consulta por FOLIO
- [ ] Encontré el contrato
- [ ] Ejecuté la consulta por CAUSA
- [ ] Encontré la causa con el RIT
- [ ] Verifiqué que los datos coincidan con el JSON


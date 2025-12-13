# Solución: Tabla 'contrato' no existe

## 🔍 Problema
La tabla `contrato` no existe en la base de datos `codi_ejamtest`.

## ✅ Solución: Verificar qué tablas existen

### Paso 1: Ver TODAS las tablas
Ejecuta esta consulta en phpMyAdmin:

```sql
SHOW TABLES;
```

Esto te mostrará **todas las tablas** que existen en la base de datos.

### Paso 2: Buscar tablas relacionadas
Ejecuta estas consultas para encontrar tablas que puedan contener los datos:

```sql
-- Buscar tablas con "contrato"
SHOW TABLES LIKE '%contrato%';

-- Buscar tablas con "causa"
SHOW TABLES LIKE '%causa%';

-- Buscar tablas con "cliente"
SHOW TABLES LIKE '%cliente%';

-- Buscar tablas con "agenda"
SHOW TABLES LIKE '%agenda%';

-- Buscar tablas con "juzgado"
SHOW TABLES LIKE '%juzgado%';

-- Buscar tablas con "usuario"
SHOW TABLES LIKE '%usuario%';
```

### Paso 3: Ver información de las tablas
```sql
SELECT 
    TABLE_NAME AS nombre_tabla,
    TABLE_ROWS AS cantidad_registros
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'codi_ejamtest'
ORDER BY TABLE_NAME;
```

---

## 🤔 Posibles Causas

### 1. Las tablas tienen prefijos
Puede que las tablas tengan un prefijo, por ejemplo:
- `ejam_contrato` en lugar de `contrato`
- `codi_contrato` en lugar de `contrato`
- `app_contrato` en lugar de `contrato`

**Solución**: Busca con `SHOW TABLES LIKE '%contrato%';`

### 2. Los nombres están en mayúsculas o diferentes
Puede que las tablas se llamen:
- `Contrato` (con mayúscula)
- `CONTRATO` (todo mayúsculas)
- `contratos` (plural)

**Solución**: MySQL es case-sensitive en algunos sistemas. Prueba diferentes variaciones.

### 3. Estás en la base de datos incorrecta
Verifica que estés en la base de datos correcta:

```sql
-- Ver en qué base de datos estás
SELECT DATABASE();

-- Ver todas las bases de datos
SHOW DATABASES;
```

### 4. La base de datos está vacía o no se importó correctamente
Verifica si hay tablas:

```sql
-- Contar cuántas tablas hay
SELECT COUNT(*) AS total_tablas
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'codi_ejamtest';
```

---

## 🔧 Pasos a Seguir

1. **Ejecuta `SHOW TABLES;`** y copia el resultado
2. **Busca tablas que contengan**: contrato, causa, cliente, agenda, juzgado
3. **Una vez que encuentres las tablas**, ajusta las consultas con los nombres correctos

---

## 📝 Ejemplo de Consulta Ajustada

Una vez que sepas el nombre real de las tablas, ajusta la consulta así:

```sql
-- Si la tabla se llama "ejam_contrato"
SELECT 
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente,
    c.rut
FROM ejam_contrato c
WHERE c.folio = '20212';

-- Si la tabla se llama "contratos" (plural)
SELECT 
    c.id AS contrato_id,
    c.folio,
    c.nombre AS cliente,
    c.rut
FROM contratos c
WHERE c.folio = '20212';
```

---

## 🆘 Si No Encuentras Ninguna Tabla

1. **Verifica que el archivo SQL se importó correctamente**:
   - Ve a la pestaña "Importar" en phpMyAdmin
   - Asegúrate de que el archivo `codi_ejamtest.sql` se haya importado sin errores

2. **Verifica el tamaño del archivo**:
   - Si el archivo es muy grande, puede que necesites aumentar el límite de upload en phpMyAdmin

3. **Verifica los logs de error**:
   - Revisa si hubo errores durante la importación

---

## ✅ Próximos Pasos

Una vez que identifiques los nombres correctos de las tablas:
1. Compárteme los nombres reales de las tablas
2. Ajustaré todas las consultas con los nombres correctos
3. Crearemos un nuevo archivo SQL con las consultas corregidas


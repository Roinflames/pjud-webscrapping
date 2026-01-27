# 📋 Instrucciones: Insertar Causa de Prueba C-213-2023

## 🎯 Objetivo

Insertar la causa `C-213-2023` en la base de datos para testear el scraping que detecta cambios automáticamente.

## 📝 Datos de la Causa

- **RIT**: `C-213-2023`
- **Fecha**: `10/01/2023`
- **Caratulado**: `COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI SCM/FISCO DE CHILE (CDE)`
- **Tribunal**: `1º Juzgado de Letras de Iquique`
- **Competencia**: `3` (Civil)
- **Tipo**: `C` (Civil)

## 🚀 Método 1: Script Node.js (Automático)

### Paso 1: Verificar configuración de BD

Asegúrate de que tu `.env` tenga las credenciales correctas:

```bash
DB_HOST=localhost
DB_PORT=3307
DB_NAME=codi_ejamtest
DB_USER=root
DB_PASSWORD=tu_password_aqui
```

### Paso 2: Ejecutar script

```bash
npm run test:insertar-causa
```

El script:
- ✅ Busca automáticamente el tribunal de Iquique
- ✅ Inserta o actualiza la causa
- ✅ Verifica que todo esté correcto

## 🚀 Método 2: SQL Directo (Manual)

Si el script Node.js falla, puedes insertar directamente con SQL:

### Paso 1: Conectarte a la BD

```bash
mysql -h localhost -P 3307 -u root -p codi_ejamtest
```

### Paso 2: Buscar el tribunal_id

```sql
-- Buscar tribunal de Iquique
SELECT 
    j.id AS tribunal_id,
    j.nombre AS tribunal_nombre
FROM juzgado j
WHERE j.nombre LIKE '%Iquique%'
   OR j.nombre LIKE '%1%Juzgado%Letras%'
ORDER BY j.id
LIMIT 10;
```

Anota el `tribunal_id` encontrado (ej: `123`).

### Paso 3: Insertar la causa

```sql
-- Insertar causa (reemplaza TRIBUNAL_ID con el ID encontrado)
INSERT INTO causa (
    id_causa,
    causa_nombre,
    materia_estrategia_id,
    juzgado_cuenta_id,
    letra,
    rol,
    anio,
    estado
) VALUES (
    'C-213-2023',
    'COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI SCM/FISCO DE CHILE (CDE)',
    3,              -- Competencia: Civil
    TRIBUNAL_ID,    -- Reemplaza con el ID encontrado
    'C',            -- Tipo: Civil
    '213',
    2023,
    1               -- Estado: activo
)
ON DUPLICATE KEY UPDATE
    causa_nombre = VALUES(causa_nombre),
    materia_estrategia_id = VALUES(materia_estrategia_id),
    juzgado_cuenta_id = VALUES(juzgado_cuenta_id),
    letra = VALUES(letra),
    rol = VALUES(rol),
    anio = VALUES(anio);
```

### Paso 4: Verificar inserción

```sql
SELECT 
    c.id AS causa_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal_id,
    j.nombre AS tribunal_nombre
FROM causa c
LEFT JOIN juzgado j ON c.juzgado_cuenta_id = j.id
WHERE c.id_causa = 'C-213-2023';
```

## ✅ Verificar que la Causa está Lista

La causa debe tener:
- ✅ `id_causa` = `'C-213-2023'`
- ✅ `causa_nombre` = `'COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI SCM/FISCO DE CHILE (CDE)'`
- ✅ `materia_estrategia_id` = `3` (Civil)
- ✅ `juzgado_cuenta_id` = `[ID del tribunal]` (NO NULL)
- ✅ `letra` = `'C'`
- ✅ `rol` = `'213'`
- ✅ `anio` = `2023`

## 🔄 Probar Detección Automática

Una vez insertada la causa, prueba el scraping automático:

### Opción A: Listener (detecta nuevos registros)

```bash
npm run api:listener
```

El listener detectará la nueva causa y la agregará a `pjud_cola_scraping`.

### Opción B: Worker de Cola (procesa cola)

```bash
node src/worker_cola_scraping.js
```

El worker procesará la causa de la cola usando `processCausa`.

### Opción C: Worker de Monitoreo Continuo

```bash
npm run scrape:monitoreo --once
```

El worker detectará la causa activa y ejecutará el scraping una vez.

## ⚠️ Si el Tribunal no se Encuentra

Si no encuentras el tribunal "1º Juzgado de Letras de Iquique":

1. **Buscar todos los juzgados de Iquique:**
```sql
SELECT id, nombre FROM juzgado WHERE nombre LIKE '%Iquique%';
```

2. **Usar el ID más cercano** o **crear el tribunal** si es necesario.

3. **Actualizar la causa:**
```sql
UPDATE causa 
SET juzgado_cuenta_id = TRIBUNAL_ID_AQUI
WHERE id_causa = 'C-213-2023';
```

## 📊 Estructura de la Tabla `causa`

Si tu tabla tiene campos diferentes, ajusta el INSERT:

```sql
DESCRIBE causa;
```

Campos esperados:
- `id_causa` (VARCHAR) - RIT completo
- `causa_nombre` (VARCHAR/TEXT) - Caratulado
- `materia_estrategia_id` (INT) - Competencia
- `juzgado_cuenta_id` (INT) - Tribunal
- `letra` (CHAR) - Tipo causa
- `rol` (VARCHAR) - Rol
- `anio` (INT) - Año
- `estado` (INT) - Estado

## 🎯 Resultado Esperado

Después de insertar y ejecutar el scraping, deberías ver:

1. ✅ La causa en la tabla `causa`
2. ✅ Movimientos en `pjud_movimientos_intermedia` o `movimientos`
3. ✅ PDFs descargados en `src/outputs/pdf/`
4. ✅ JSON generado en `src/outputs/causas/C_213_2023.json`

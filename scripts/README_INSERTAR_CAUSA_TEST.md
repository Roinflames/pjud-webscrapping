# 📝 Insertar Causa de Prueba para Testing

Este script inserta una causa de prueba en la base de datos para testear el scraping que detecta cambios automáticamente.

## 📋 Causa de Prueba

- **RIT**: `C-213-2023`
- **Fecha**: `10/01/2023`
- **Caratulado**: `COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI SCM/FISCO DE CHILE (CDE)`
- **Tribunal**: `1º Juzgado de Letras de Iquique`
- **Competencia**: `3` (Civil)
- **Tipo**: `C` (Civil)

## 🚀 Uso

### Opción 1: Script Node.js (Recomendado)

```bash
npm run test:insertar-causa
```

Este script:
1. Busca automáticamente el tribunal "1º Juzgado de Letras de Iquique" en la BD
2. Inserta o actualiza la causa con todos los datos necesarios
3. Verifica que la inserción fue exitosa
4. Muestra información de la causa insertada

### Opción 2: SQL Directo

```bash
mysql -h localhost -P 3307 -u root -p codi_ejamtest < scripts/insertar_causa_test.sql
```

**Nota**: Necesitarás ajustar el `tribunal_id` manualmente si no se encuentra automáticamente.

## ✅ Verificación

Después de insertar, verifica que la causa esté en la BD:

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

## 🔄 Probar Detección Automática

Una vez insertada la causa, puedes probar el scraping automático de dos formas:

### 1. Usando Listener (detecta nuevos registros)

```bash
npm run api:listener
```

El listener detectará la nueva causa y la agregará a la cola de scraping.

### 2. Usando Worker de Cola (procesa cola)

```bash
node src/worker_cola_scraping.js
```

El worker procesará la causa de la cola usando `processCausa`.

### 3. Usando Worker de Monitoreo Continuo

```bash
npm run scrape:monitoreo
```

El worker de monitoreo detectará la causa activa y ejecutará el scraping.

## ⚠️ Requisitos

- La tabla `causa` debe existir en la BD
- La tabla `juzgado` debe existir para buscar el tribunal
- Variables de entorno configuradas (`.env`):
  - `DB_HOST`
  - `DB_PORT`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`

## 🔍 Troubleshooting

### Error: "No se encontró tribunal"

Si el script no encuentra el tribunal automáticamente:

1. Busca manualmente el tribunal:
```sql
SELECT id, nombre FROM juzgado WHERE nombre LIKE '%Iquique%';
```

2. Actualiza la causa con el tribunal_id correcto:
```sql
UPDATE causa 
SET juzgado_cuenta_id = TRIBUNAL_ID_AQUI
WHERE id_causa = 'C-213-2023';
```

### Error: "Tabla no existe"

Verifica que la tabla `causa` exista:
```sql
SHOW TABLES LIKE 'causa';
DESCRIBE causa;
```

### Error: "Campo no encontrado"

Verifica la estructura de la tabla:
```sql
DESCRIBE causa;
```

Ajusta el script si los nombres de campos son diferentes.

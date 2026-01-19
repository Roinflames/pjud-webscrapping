# 🔄 Guía: Sistema de Cola para Scraping Automático

Este sistema permite que cuando insertes un RIT en tu tabla SQL (ej: `causa`), automáticamente se ejecute el scraping.

---

## 🎯 Cómo Funciona

```
1. Insertas RIT en tabla 'causa'
   ↓
2. Trigger detecta el INSERT
   ↓
3. Agrega RIT a tabla 'pjud_cola_scraping' con estado 'PENDIENTE'
   ↓
4. Worker Node.js detecta RIT pendiente
   ↓
5. Ejecuta scraping automáticamente
   ↓
6. Marca como 'COMPLETADO' o 'ERROR'
```

---

## 📋 Instalación

### Paso 1: Crear Tabla y Triggers

1. Abre phpMyAdmin o tu cliente MySQL
2. Selecciona la base de datos `codi_ejamtest`
3. Ve a la pestaña "SQL"
4. Copia y pega el contenido de `docs/sql/trigger_cola_scraping.sql`
5. Ejecuta el SQL

Esto creará:
- Tabla `pjud_cola_scraping` (cola de trabajo)
- Trigger `trigger_agregar_a_cola_scraping` (se activa al INSERT en `causa`)
- Trigger `trigger_actualizar_cola_scraping` (se activa al UPDATE en `causa`)
- Procedimientos almacenados y vistas útiles

### Paso 2: Verificar que Funciona

Inserta un RIT de prueba en tu tabla `causa`:

```sql
INSERT INTO causa (rit, competencia_id, corte_id, tribunal_id)
VALUES ('C-12345-2020', 3, 90, 276);
```

Luego verifica que se agregó a la cola:

```sql
SELECT * FROM pjud_cola_scraping WHERE rit = 'C-12345-2020';
```

Deberías ver un registro con `estado = 'PENDIENTE'`.

---

## 🚀 Ejecutar el Worker

### Modo Continuo (Recomendado)

El worker escucha la cola cada 10 segundos y procesa RITs automáticamente:

```bash
node src/worker_cola_scraping.js
```

### Modo con Intervalo Personalizado

```bash
node src/worker_cola_scraping.js --interval 5000  # Cada 5 segundos
node src/worker_cola_scraping.js --interval 30000  # Cada 30 segundos
```

### Modo Una Vez

Procesa un solo RIT y termina:

```bash
node src/worker_cola_scraping.js --once
```

### Ejecutar en Background (Linux/Mac)

```bash
nohup node src/worker_cola_scraping.js > logs/worker.log 2>&1 &
```

### Ejecutar como Servicio (Windows)

Usa `pm2` o crea un servicio de Windows:

```bash
npm install -g pm2
pm2 start src/worker_cola_scraping.js --name "scraping-worker"
pm2 save
pm2 startup
```

---

## 📊 Consultas Útiles

### Ver RITs Pendientes

```sql
SELECT * FROM v_cola_scraping_pendientes;
```

### Ver Estadísticas

```sql
SELECT 
  estado,
  COUNT(*) as total,
  AVG(intentos) as promedio_intentos,
  MIN(fecha_creacion) as mas_antiguo,
  MAX(fecha_creacion) as mas_reciente
FROM pjud_cola_scraping
GROUP BY estado;
```

### Ver RITs con Errores

```sql
SELECT 
  rit,
  intentos,
  error_message,
  fecha_creacion,
  fecha_completado
FROM pjud_cola_scraping
WHERE estado = 'ERROR'
ORDER BY fecha_completado DESC;
```

### Reintentar RITs con Error

```sql
UPDATE pjud_cola_scraping
SET estado = 'PENDIENTE',
    intentos = 0,
    error_message = NULL,
    fecha_creacion = NOW()
WHERE estado = 'ERROR'
AND intentos < 3;
```

---

## 🔧 Insertar RITs Manualmente a la Cola

Si necesitas agregar un RIT manualmente sin usar el trigger:

```sql
INSERT INTO pjud_cola_scraping (
  rit,
  competencia_id,
  corte_id,
  tribunal_id,
  tipo_causa,
  estado
) VALUES (
  'C-12345-2020',
  3,
  90,
  276,
  'C',
  'PENDIENTE'
);
```

O usa el script helper:

```bash
node src/agregar_a_cola.js C-12345-2020 3 90 276
```

---

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=codi_ejamtest
DB_PORT=3306
```

### Ajustar Intervalo de Polling

Por defecto el worker consulta cada 10 segundos. Puedes cambiarlo:

```bash
# En el comando
node src/worker_cola_scraping.js --interval 5000

# O modifica INTERVAL_MS en el código
```

---

## 🐛 Solución de Problemas

### El Worker No Procesa RITs

1. **Verifica que hay RITs pendientes:**
   ```sql
   SELECT * FROM pjud_cola_scraping WHERE estado = 'PENDIENTE';
   ```

2. **Verifica que el worker está corriendo:**
   ```bash
   ps aux | grep worker_cola_scraping
   ```

3. **Revisa los logs del worker**

### RITs Quedan en Estado "PROCESANDO"

Si un RIT queda atascado en "PROCESANDO" (el worker se cerró inesperadamente):

```sql
-- Resetear a PENDIENTE para reintentar
UPDATE pjud_cola_scraping
SET estado = 'PENDIENTE',
    fecha_procesamiento = NULL
WHERE estado = 'PROCESANDO'
AND fecha_procesamiento < DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

### Limpiar Cola Antigua

```sql
-- Eliminar completados de hace más de 30 días
DELETE FROM pjud_cola_scraping 
WHERE estado = 'COMPLETADO' 
AND fecha_completado < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

## 📝 Ejemplo de Flujo Completo

### 1. Insertar RIT en tu tabla principal

```sql
INSERT INTO causa (
  rit,
  competencia_id,
  corte_id,
  tribunal_id,
  cliente_id
) VALUES (
  'C-99999-2024',
  3,
  90,
  276,
  123
);
```

### 2. El trigger automáticamente agrega a la cola

```sql
-- Verificar
SELECT * FROM pjud_cola_scraping WHERE rit = 'C-99999-2024';
-- Debería mostrar estado = 'PENDIENTE'
```

### 3. El worker detecta y procesa

El worker (si está corriendo) automáticamente:
- Detecta el RIT pendiente
- Marca como 'PROCESANDO'
- Ejecuta el scraping
- Descarga PDFs
- Inserta en `pjud_movimientos_intermedia`
- Marca como 'COMPLETADO'

### 4. Verificar resultado

```sql
-- Ver movimientos insertados
SELECT * FROM pjud_movimientos_intermedia 
WHERE rit = 'C-99999-2024';

-- Ver estado en cola
SELECT * FROM pjud_cola_scraping 
WHERE rit = 'C-99999-2024';
```

---

## 🎯 Casos de Uso

### Caso 1: Nuevo Cliente con RIT

Cuando agregas un nuevo cliente con su RIT:

```sql
INSERT INTO causa (rit, competencia_id, corte_id, cliente_id)
VALUES ('C-NUEVO-2024', 3, 90, 456);
```

El scraping se ejecuta automáticamente.

### Caso 2: Actualizar Información de RIT

Si actualizas el RIT o sus datos:

```sql
UPDATE causa 
SET corte_id = 91, tribunal_id = 500
WHERE rit = 'C-EXISTENTE-2020';
```

El trigger detecta el cambio y agrega a la cola para re-scrapear.

### Caso 3: Scraping Programado

Puedes crear un script que inserte RITs periódicamente:

```sql
-- Insertar todos los RITs que no se han scrapeado en 30 días
INSERT INTO pjud_cola_scraping (rit, competencia_id, corte_id, estado)
SELECT rit, competencia_id, corte_id, 'PENDIENTE'
FROM causa
WHERE rit NOT IN (
  SELECT DISTINCT rit FROM pjud_movimientos_intermedia
  WHERE fecha_consulta_actual > DATE_SUB(NOW(), INTERVAL 30 DAY)
);
```

---

## 🔒 Seguridad y Rendimiento

### Límite de Intentos

Por defecto, un RIT se intenta máximo 3 veces. Puedes ajustarlo en el código.

### Evitar Duplicados

El trigger verifica que no haya RITs pendientes o procesando antes de agregar.

### Procesamiento en Lote

El worker procesa un RIT a la vez para evitar sobrecarga. Puedes ejecutar múltiples workers si necesitas más throughput.

---

## 📚 Archivos Relacionados

- **SQL Triggers:** `docs/sql/trigger_cola_scraping.sql`
- **Worker Script:** `src/worker_cola_scraping.js`
- **Configuración BD:** Variables en `.env`

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo ejecutar múltiples workers?**  
R: Sí, pero asegúrate de que solo uno procese cada RIT (el trigger previene duplicados).

**P: ¿Qué pasa si el worker se cae?**  
R: Los RITs en "PROCESANDO" pueden quedar atascados. Usa la consulta de "resetear procesando" para limpiarlos.

**P: ¿Puedo desactivar los triggers?**  
R: Sí, `DROP TRIGGER trigger_agregar_a_cola_scraping;`

**P: ¿Cómo agrego RITs sin usar triggers?**  
R: Inserta directamente en `pjud_cola_scraping` con estado 'PENDIENTE'.



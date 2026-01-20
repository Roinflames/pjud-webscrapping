# 🚀 Guía: Scraping Masivo de Causas

Esta guía te explica cómo ejecutar el scraping masivo de múltiples causas desde el archivo CSV.

## 📋 Requisitos Previos

1. **Archivo CSV de causas**: Asegúrate de tener `causa.csv` o `causa_validas.csv` en la raíz del proyecto
2. **Variables de entorno**: Archivo `.env` configurado con `OJV_URL`
3. **Dependencias instaladas**: `npm install` ya ejecutado
4. **Navegadores Playwright**: `npx playwright install chromium`

---

## 🎯 Formas de Ejecutar

### Opción 1: Usando npm script (Recomendado)

```bash
# Procesar 10 causas (número por defecto)
npm run scrape:batch

# Procesar 50 causas
npm run scrape:batch 50

# Procesar 100 causas
npm run scrape:batch 100

# Procesar TODAS las causas del CSV (0 = todas)
npm run scrape:batch 0
```

### Opción 2: Directo con Node.js

```bash
# Procesar 10 causas (por defecto)
node src/process-csv-causas.js

# Procesar 50 causas
node src/process-csv-causas.js 50

# Procesar 100 causas
node src/process-csv-causas.js 100

# Procesar TODAS las causas (0 = todas)
node src/process-csv-causas.js 0
```

---

## 🔄 Reanudar desde Checkpoint

Si el scraping se detuvo (por error, bloqueo, etc.), puedes reanudar desde donde se quedó:

```bash
# Reanudar desde el último checkpoint
node src/process-csv-causas.js 0 --resume

# O con la forma corta
node src/process-csv-causas.js 0 -r
```

**Nota**: El checkpoint guarda solo las causas exitosas, así que las que fallaron se reintentarán automáticamente.

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Prueba Pequeña (5 causas)
```bash
node src/process-csv-causas.js 5
```
Ideal para probar que todo funciona correctamente antes de procesar grandes cantidades.

### Ejemplo 2: Lote Mediano (50 causas)
```bash
node src/process-csv-causas.js 50
```
Procesa 50 causas con delays entre cada una para evitar bloqueos.

### Ejemplo 3: Lote Grande (200 causas)
```bash
node src/process-csv-causas.js 200
```
Procesa hasta 200 causas. El script verificará bloqueos después de cada causa.

### Ejemplo 4: Todas las Causas
```bash
node src/process-csv-causas.js 0
```
Procesa **todas** las causas válidas del CSV. ⚠️ Esto puede tardar horas o días.

---

## ⚙️ Configuración y Comportamiento

### Archivo CSV Requerido

El script lee desde `causa.csv` en la raíz del proyecto. Debe tener estas columnas:
- `causa_id`: ID de la causa
- `rit`: RIT de la causa (ej: "C-13786-2018")
- `competencia`: ID de competencia (ej: "3" para Civil)
- `tribunal`: ID de tribunal
- `tipo_causa`: Tipo de causa (ej: "C")

### Filtrado Automático

El script automáticamente:
- ✅ Solo procesa causas con RIT válido
- ✅ Filtra causas duplicadas por `causa_id`
- ✅ Asume competencia "3" (Civil) si no está especificada

### Delays entre Causas

Para evitar bloqueos, el script:
- ⏳ Espera **5-15 segundos** entre cada causa
- ⏳ Espera **3-5 segundos** adicionales si hubo un error en la causa anterior
- ⏳ Verifica CAPTCHA/bloqueo después de cada causa

### Límite Diario

Por defecto hay un límite de **150 causas por día** para evitar bloqueos. Puedes modificarlo en:
- Archivo: `src/daily_count.json`
- Variable: `DEFAULT_DAILY_LIMIT` en `src/process-csv-causas.js`

---

## 📁 Archivos Generados

### Durante la Ejecución

```
src/outputs/
├── resultado_C_13786_2018.json     # JSON con movimientos
├── resultado_C_13786_2018.csv      # CSV con movimientos
├── movimientos_C_13786_2018.json   # JSON estructurado
├── C_13786_2018_doc_1.pdf          # PDFs descargados
├── C_13786_2018_doc_2.pdf
└── ...
```

### Checkpoints y Logs

```
src/logs/
├── checkpoints/
│   └── last_checkpoint.json        # Estado del scraping
├── causas_pendientes_TIMESTAMP.json # Causas no procesadas
├── bloqueo_causa_X_TIMESTAMP.png   # Screenshot si hay bloqueo
└── daily_count.json                # Contador diario
```

---

## 🚨 Manejo de Bloqueos

Si el script detecta un bloqueo/CAPTCHA:

1. **Se detiene inmediatamente** (NO reintenta automáticamente)
2. **Muestra mensaje claro** con instrucciones
3. **Guarda checkpoint** con el progreso actual
4. **Guarda causas pendientes** para continuar después
5. **Guarda screenshot** para diagnóstico

### Qué Hacer Si Hay Bloqueo

```
🚨 ============================================
🚨 BLOQUEO/CAPTCHA DETECTADO - DETENIENDO
🚨 ============================================

📝 ACCIÓN REQUERIDA:
   1. Espera 30-60 minutos antes de reintentar
   2. Considera usar una VPN o cambiar tu IP
   3. Reduce la velocidad de scraping si continúas
   4. Verifica manualmente en el navegador si el bloqueo persiste

⏸️  El proceso se ha detenido para evitar empeorar el bloqueo.
```

**Para continuar después:**
```bash
# Espera 30-60 minutos y luego:
node src/process-csv-causas.js 0 --resume
```

---

## 📊 Monitoreo del Progreso

### Durante la Ejecución

El script muestra información en tiempo real:
```
🚀 Iniciando scraping masivo...
📊 Causas válidas: 3222
📋 Se procesarán 50 causas del CSV.

✅ Procesando causa 1/50: C-13786-2018
   ✅ Causa procesada exitosamente
   ⏳ Esperando 8s antes de la siguiente causa (anti-bloqueo)...

✅ Procesando causa 2/50: C-23607-2015
   ✅ Causa procesada exitosamente
   ⏳ Esperando 12s antes de la siguiente causa (anti-bloqueo)...

...

📊 Resumen final:
   ✅ Exitosas: 45
   ❌ Fallidas: 5
   ⏱️  Tiempo total: 15 minutos
```

### Verificar Progreso Guardado

```bash
# Ver el checkpoint actual
cat src/logs/checkpoints/last_checkpoint.json

# Ver contador diario
cat src/logs/daily_count.json

# Ver causas pendientes (si hubo bloqueo)
cat src/logs/causas_pendientes_*.json
```

---

## 🔧 Opciones Avanzadas

### Procesar Solo Causas con Tribunal

Si quieres procesar solo causas que tienen tribunal especificado (mayor tasa de éxito):

Edita `src/process-csv-causas.js` línea ~149:
```javascript
const requireTribunal = true; // Cambiar a true
```

### Aumentar Delays

Para reducir riesgo de bloqueo, aumenta los delays en `src/process-csv-causas.js`:

```javascript
// Línea ~398: Delay entre causas
const delay = 10000 + Math.random() * 20000; // Cambiar a 10-30 segundos
```

### Modo Headless

Por defecto el navegador es visible. Para ocultarlo (más rápido pero menos debugging):

Edita `src/browser.js` o pasa `headless: true` a `startBrowser()`.

---

## 📈 Ejemplo de Sesión Completa

```bash
# 1. Primera ejecución: 50 causas
node src/process-csv-causas.js 50

# 2. Si se bloquea, espera 30-60 minutos y reanuda:
node src/process-csv-causas.js 0 --resume

# 3. Continuar con más causas:
node src/process-csv-causas.js 100

# 4. Verificar resultados:
ls -lh src/outputs/*.json | wc -l  # Contar causas procesadas
```

---

## ⚠️ Recomendaciones Importantes

### Para Evitar Bloqueos:

1. **Empieza con lotes pequeños** (10-20 causas) para probar
2. **Aumenta gradualmente** (50, 100, 200)
3. **Ejecuta en horarios de menor tráfico** (madrugada)
4. **Respeta el límite diario** de 150 causas
5. **Monitorea los logs** para detectar bloqueos temprano

### Si Ya Estás Bloqueado:

1. **Espera 30-60 minutos** antes de reintentar
2. **Cambia tu IP** usando VPN o proxy
3. **Reduce aún más la velocidad** (aumenta delays)
4. **Procesa menos causas por sesión** (10-20 máximo)

---

## 🎯 Resumen de Comandos Rápidos

```bash
# Procesar 10 causas (prueba)
node src/process-csv-causas.js 10

# Procesar 50 causas (lote mediano)
node src/process-csv-causas.js 50

# Procesar todas las causas
node src/process-csv-causas.js 0

# Reanudar desde checkpoint
node src/process-csv-causas.js 0 --resume

# Usar script npm
npm run scrape:batch 50
```

---

## 📞 Solución de Problemas

### Error: "No se encontró el archivo: causa.csv"

```bash
# Verifica que el archivo existe
ls -la causa.csv

# Si no existe, usa causa_validas.csv
# Edita src/read-csv.js línea 7 para cambiar el nombre
```

### Error: "Cannot find module"

```bash
npm install
npx playwright install chromium
```

### El proceso se detiene sin razón aparente

```bash
# Verifica logs
tail -f src/logs/checkpoints/last_checkpoint.json

# Verifica si hay bloqueo
ls -la src/logs/bloqueo_*.png
```

### Quiero empezar desde cero

```bash
# Elimina el checkpoint
rm src/logs/checkpoints/last_checkpoint.json

# Elimina contador diario (opcional)
rm src/logs/daily_count.json
```

---

**¡Listo! Ya puedes ejecutar el scraping masivo.** 🚀

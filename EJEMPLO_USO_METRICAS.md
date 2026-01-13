# Ejemplo Práctico: Integrar Métricas en tu Scraper

Este documento muestra cómo integrar las métricas de Prometheus en tu código existente.

## 📝 Escenario: Modificar `process-csv-causas.js`

### Antes (Sin Métricas)

```javascript
// process-csv-causas.js (versión original)
const { fillForm } = require('./form');
const { extractTableAsArray } = require('./table');

async function processCausa(page, context, config, outputDir) {
  try {
    await fillForm(page, context, config);
    const rows = await extractTableAsArray(page);
    await exportToJSON(rows, outputDir, ritClean);

    console.log('✅ Causa procesada exitosamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error procesando causa:', error);
    return { success: false };
  }
}
```

### Después (Con Métricas)

```javascript
// process-csv-causas.js (con métricas)
const metrics = require('./monitoring/metrics-collector');
const { fillForm } = require('./form');
const { extractTableAsArray } = require('./table');

async function processCausa(page, context, config, outputDir) {
  // Iniciar timer para toda la operación
  const endTimer = metrics.startTimer('full_scrape');
  metrics.incrementActiveOps();

  try {
    // 1. Fill Form
    const formTimer = metrics.startTimer('form_fill');
    await fillForm(page, context, config);
    formTimer();

    // 2. Extract Table
    const extractTimer = metrics.startTimer('table_extract');
    const rows = await extractTableAsArray(page);
    extractTimer();

    // Registrar movimientos extraídos
    metrics.recordMovimientos(rows.length);

    // 3. Export
    await exportToJSON(rows, outputDir, ritClean);
    const stats = fs.statSync(`${outputDir}/resultado_${ritClean}.json`);
    metrics.recordFileExport('json', stats.size);

    // Registrar causa exitosa
    metrics.recordCausaProcessed('success');

    console.log('✅ Causa procesada exitosamente');
    return { success: true };

  } catch (error) {
    // Clasificar y registrar error
    const errorType = error.message.includes('timeout') ? 'navigation' : 'unknown';
    metrics.recordError(errorType, 'error');
    metrics.recordCausaProcessed('failed');

    console.error('❌ Error procesando causa:', error);
    return { success: false };

  } finally {
    endTimer();
    metrics.decrementActiveOps();
  }
}
```

## 🔄 Ejemplo Completo: Loop de Procesamiento Masivo

```javascript
// process-csv-causas.js - Función principal
async function processMultipleCausas(limit = 10) {
  const causas = readCausaCSV();
  const checkpoint = loadCheckpoint();

  let processed = 0;
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < causas.length && processed < limit; i++) {
    const causa = causas[i];

    // Saltar si ya fue procesada
    if (isCausaProcessed(checkpoint, causa.causa_id)) {
      continue;
    }

    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Procesando causa ${processed + 1}/${limit}: ${causa.rit}`);

      // Procesar causa (con métricas integradas)
      const result = await processCausa(page, context, causa, outputDir);

      if (result.success) {
        successful++;

        // Guardar en checkpoint
        saveCheckpoint(checkpoint, causa.causa_id, 'exitosa');
      } else {
        failed++;
        saveCheckpoint(checkpoint, causa.causa_id, 'fallida');
      }

      processed++;

      // Actualizar progreso en Prometheus
      const percentage = Math.round((processed / limit) * 100);
      metrics.updateCheckpointProgress(percentage);

    } catch (error) {
      console.error(`Error procesando ${causa.rit}:`, error);
      failed++;
      metrics.recordCausaProcessed('failed');
      saveCheckpoint(checkpoint, causa.causa_id, 'fallida');
    }

    // Delay entre causas
    const delay = 5000 + Math.random() * 10000;
    console.log(`⏳ Esperando ${(delay/1000).toFixed(1)}s antes de continuar...`);
    await page.waitForTimeout(delay);
  }

  // Resumen final
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 RESUMEN FINAL:');
  console.log(`Total procesadas: ${processed}`);
  console.log(`✅ Exitosas: ${successful}`);
  console.log(`❌ Fallidas: ${failed}`);
  console.log(`${'='.repeat(60)}\n`);

  return { processed, successful, failed };
}
```

## 🎯 Integración con Detección de CAPTCHA

```javascript
const { detectCaptcha } = require('./utils/captcha-detector');
const metrics = require('./monitoring/metrics-collector');

async function fillFormSafe(page, context, config) {
  try {
    // Detectar CAPTCHA antes de llenar formulario
    const captchaCheck = await detectCaptcha(page);

    if (captchaCheck.detected) {
      // Registrar detección en métricas
      const captchaType = captchaCheck.type || 'generic';
      metrics.recordCaptcha(captchaType);

      console.error('🚨 CAPTCHA detectado! Tipo:', captchaType);
      throw new Error('CAPTCHA_DETECTED');
    }

    // Continuar con el formulario
    await fillForm(page, context, config);

  } catch (error) {
    if (error.message === 'CAPTCHA_DETECTED') {
      metrics.recordBlockedRequest('captcha');
    }
    throw error;
  }
}
```

## 📊 Monitorear en Tiempo Real

Una vez que tengas las métricas integradas:

### 1. Inicia el Servidor de Métricas

```bash
# Terminal 1
npm run metrics
```

### 2. Inicia Prometheus y Grafana

```bash
# Terminal 2
docker-compose up -d
```

### 3. Ejecuta el Scraper

```bash
# Terminal 3
npm run scrape
```

### 4. Observa las Métricas

- **Grafana Dashboard:** http://localhost:3000
- **Prometheus:** http://localhost:9090
- **Métricas Raw:** http://localhost:9091/metrics

## 🔍 Queries Útiles Durante el Scraping

### En Prometheus (http://localhost:9090/graph)

**Ver causas procesadas por segundo:**
```promql
rate(pjud_causas_processed_total[1m])
```

**Ver progreso actual:**
```promql
pjud_checkpoint_progress
```

**Ver operaciones activas:**
```promql
pjud_active_scraping_operations
```

**Ver duración promedio:**
```promql
rate(pjud_scraping_duration_seconds_sum[5m]) / rate(pjud_scraping_duration_seconds_count[5m])
```

## 🚨 Alertas Útiles

### Alerta cuando hay muchos errores

Edita `alerts.yml` y agrega:

```yaml
- alert: TooManyFailures
  expr: |
    (
      pjud_causas_processed_total{status="failed"}
      /
      sum(pjud_causas_processed_total)
    ) > 0.3
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Más del 30% de causas están fallando"
    description: "Verifica logs y estado del PJUD"
```

### Alerta cuando se detecta CAPTCHA

```yaml
- alert: CaptchaDetected
  expr: increase(pjud_captcha_detected_total[5m]) > 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "CAPTCHA detectado!"
    description: "El scraper puede estar bloqueado"
```

## 📈 Dashboard Personalizado

Crea un panel en Grafana con esta query para ver el rendimiento:

```promql
# Panel: Causas Procesadas (últimas 24h)
sum(increase(pjud_causas_processed_total[24h])) by (status)

# Panel: Velocidad de Procesamiento
rate(pjud_causas_processed_total{status="success"}[5m]) * 3600

# Panel: Tiempo Estimado de Finalización
(1000 - sum(pjud_causas_processed_total)) / (rate(pjud_causas_processed_total{status="success"}[5m]) * 60)
```

## 🎓 Tips y Buenas Prácticas

### 1. Registrar Métricas en Puntos Clave

```javascript
// ❌ Evitar
await doSomething();

// ✅ Mejor
const timer = metrics.startTimer('operation_name');
try {
  await doSomething();
  metrics.recordCausaProcessed('success');
} catch (error) {
  metrics.recordError('operation_name', 'error');
  throw error;
} finally {
  timer();
}
```

### 2. Usar Labels Apropiados

```javascript
// ❌ No crear métricas separadas para cada estado
metrics.successCounter.inc();
metrics.failedCounter.inc();

// ✅ Usar labels
metrics.recordCausaProcessed('success');
metrics.recordCausaProcessed('failed');
```

### 3. No Sobre-instrumentar

```javascript
// ❌ Demasiado detalle (cada línea)
metrics.record('line_1');
metrics.record('line_2');
metrics.record('line_3');

// ✅ Solo operaciones significativas
metrics.startTimer('form_fill');
await fillCompleteForm(); // Incluye varias operaciones
metrics.endTimer();
```

### 4. Actualizar Progreso Regularmente

```javascript
// En loops largos
for (let i = 0; i < causas.length; i++) {
  await processCausa(causas[i]);

  // Actualizar progreso cada 10 causas
  if (i % 10 === 0) {
    const progress = (i / causas.length) * 100;
    metrics.updateCheckpointProgress(progress);
  }
}
```

## 🔧 Debugging con Métricas

### Ver métricas en formato JSON para debugging

```bash
curl http://localhost:9091/metrics/json | jq .
```

### Verificar si una métrica específica existe

```bash
curl http://localhost:9091/metrics | grep "pjud_causas_processed_total"
```

### Ver valor actual de una métrica

```bash
# En Prometheus
curl 'http://localhost:9090/api/v1/query?query=pjud_causas_processed_total'
```

---

¡Ahora tienes métricas completas integradas en tu scraper! 🎉

Revisa el dashboard en Grafana para ver todo en tiempo real.

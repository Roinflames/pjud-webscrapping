# PJUD Scraper - Monitoring con Prometheus y Grafana

Guía completa para configurar y usar el sistema de monitoreo con Prometheus y Grafana.

## 📋 Tabla de Contenidos

- [Introducción](#introducción)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Métricas Disponibles](#métricas-disponibles)
- [Dashboards](#dashboards)
- [Alertas](#alertas)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

Este sistema de monitoreo permite:

- ✅ **Métricas en tiempo real** del scraping (causas procesadas, duración, errores)
- ✅ **Dashboards visuales** con Grafana
- ✅ **Alertas automáticas** para problemas críticos
- ✅ **Historial de métricas** (retención de 30 días)
- ✅ **Monitoreo de sistema** (CPU, memoria, etc.)

---

## 🏗️ Arquitectura

```
┌─────────────────┐
│  PJUD Scraper   │  ─────> Genera métricas
└────────┬────────┘
         │ HTTP :9091
         │
         ▼
┌─────────────────┐
│   Prometheus    │  ─────> Recolecta y almacena
└────────┬────────┘
         │ :9090
         │
         ▼
┌─────────────────┐
│     Grafana     │  ─────> Visualiza
└─────────────────┘
         :3000
```

**Componentes:**

1. **Metrics Collector** - Genera métricas en el scraper
2. **Metrics Server** - Expone métricas vía HTTP (puerto 9091)
3. **Prometheus** - Recolecta y almacena métricas (puerto 9090)
4. **Grafana** - Dashboards de visualización (puerto 3000)
5. **AlertManager** - Gestiona alertas (puerto 9093)

---

## 📦 Instalación

### Paso 1: Instalar Dependencias

```bash
npm install
```

Esto instalará:
- `prom-client` - Cliente de Prometheus para Node.js
- `express` - Servidor HTTP para exponer métricas

### Paso 2: Iniciar Stack de Monitoreo (Docker)

```bash
# Iniciar Prometheus, Grafana y AlertManager
docker-compose up -d

# Verificar que todos los servicios estén corriendo
docker-compose ps
```

**Servicios disponibles:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)
- AlertManager: http://localhost:9093

### Paso 3: Iniciar Metrics Server

En una terminal separada:

```bash
npm run metrics
```

Esto iniciará el servidor de métricas en http://localhost:9091

### Paso 4: Ejecutar el Scraper

```bash
# Procesamiento masivo desde CSV
npm run scrape

# O scraping individual
npm run scrape:single
```

---

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` (o edita el existente):

```bash
# Puerto del servidor de métricas
METRICS_PORT=9091

# Otras configuraciones del scraper
OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php
```

### Configuración de Prometheus

Edita `prometheus.yml` para cambiar:

- **Intervalo de scraping:** `scrape_interval: 15s`
- **Retención de datos:** `--storage.tsdb.retention.time=30d`
- **Targets:** Si corres en Linux, cambia `host.docker.internal` por `172.17.0.1`

### Configuración de Alertas

Edita `alerts.yml` para personalizar:

- Umbrales de alertas
- Condiciones de disparo
- Tiempos de espera

Edita `alertmanager.yml` para configurar notificaciones:

```yaml
# Email
email_configs:
  - to: 'team@company.com'
    from: 'alertmanager@company.com'
    smarthost: 'smtp.gmail.com:587'
    auth_username: 'alertmanager@company.com'
    auth_password: 'your-password'

# Slack
slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
    channel: '#alerts'
```

---

## 🚀 Uso

### Acceder a Grafana

1. Abre http://localhost:3000
2. Login: `admin` / `admin`
3. El dashboard "PJUD Scraper - Overview" se carga automáticamente

### Ver Métricas en Prometheus

1. Abre http://localhost:9090
2. Navega a **Graph** o **Status > Targets**
3. Ejecuta queries como:
   ```promql
   # Causas procesadas por segundo
   rate(pjud_causas_processed_total[5m])

   # Duración promedio del scraping
   rate(pjud_scraping_duration_seconds_sum[5m]) / rate(pjud_scraping_duration_seconds_count[5m])
   ```

### Endpoint de Métricas

- **Formato Prometheus:** http://localhost:9091/metrics
- **Formato JSON:** http://localhost:9091/metrics/json
- **Health Check:** http://localhost:9091/health

### Integrar Métricas en tu Código

#### Opción 1: Usar el Wrapper Instrumentado

```javascript
const { scrapeCausaWithMetrics } = require('./monitoring/instrumented-scraper');

// En lugar de llamar a las funciones directamente, usa el wrapper
const result = await scrapeCausaWithMetrics(page, context, config, outputDir);
```

#### Opción 2: Usar Métricas Directamente

```javascript
const metrics = require('./monitoring/metrics-collector');

// Incrementar contador de causas procesadas
metrics.recordCausaProcessed('success'); // o 'failed'

// Registrar duración de operación
const endTimer = metrics.startTimer('form_fill');
await fillForm(page, context, config);
endTimer();

// Registrar PDFs extraídos
metrics.recordPDFExtraction(pdfUrls.length, true);

// Registrar errores
metrics.recordError('navigation', 'error');

// Actualizar progreso
metrics.updateCheckpointProgress(75); // 75%
```

---

## 📊 Métricas Disponibles

### Métricas de Negocio

| Métrica | Tipo | Descripción |
|---------|------|-------------|
| `pjud_causas_processed_total` | Counter | Total de causas procesadas (labels: status) |
| `pjud_scraping_duration_seconds` | Histogram | Duración de operaciones (labels: operation) |
| `pjud_pdfs_extracted_total` | Counter | Total de PDFs extraídos |
| `pjud_pdfs_downloaded_total` | Counter | Total de PDFs descargados |
| `pjud_movimientos_extracted_total` | Counter | Total de movimientos extraídos |

### Métricas de Seguridad

| Métrica | Tipo | Descripción |
|---------|------|-------------|
| `pjud_captcha_detected_total` | Counter | Detecciones de CAPTCHA (labels: type) |
| `pjud_requests_blocked_total` | Counter | Requests bloqueados (labels: reason) |
| `pjud_circuit_breaker_state` | Gauge | Estado del circuit breaker (0/1/2) |

### Métricas de Performance

| Métrica | Tipo | Descripción |
|---------|------|-------------|
| `pjud_active_scraping_operations` | Gauge | Operaciones activas en este momento |
| `pjud_checkpoint_progress` | Gauge | Progreso del checkpoint (0-100) |
| `pjud_retries_total` | Counter | Reintentos totales (labels: reason) |
| `pjud_page_load_seconds` | Histogram | Tiempos de carga de páginas |

### Métricas de Errores

| Métrica | Tipo | Descripción |
|---------|------|-------------|
| `pjud_errors_total` | Counter | Errores totales (labels: type, severity) |
| `pjud_last_scraping_timestamp` | Gauge | Timestamp del último scraping |

### Métricas de Sistema (Node.js)

Todas las métricas automáticas con prefijo `pjud_scraper_`:
- `process_cpu_user_seconds_total` - Uso de CPU
- `process_resident_memory_bytes` - Memoria RAM
- `nodejs_heap_size_total_bytes` - Heap de Node.js
- `nodejs_eventloop_lag_seconds` - Event loop lag

---

## 📈 Dashboards

### Dashboard Principal: "PJUD Scraper - Overview"

Incluye:

**Sección Superior (Stats):**
- Total de causas procesadas
- Causas exitosas
- Causas fallidas
- Operaciones activas

**Gráficos:**
1. **Processing Rate** - Causas/minuto (success vs failed)
2. **Scraping Duration** - Percentiles p50 y p95
3. **Causas by Status** - Pie chart
4. **Checkpoint Progress** - Gauge 0-100%
5. **Errors by Type** - Gráfico de barras apiladas
6. **PDFs/Movimientos** - Contadores
7. **CAPTCHA Detections** - Alerta visual
8. **Circuit Breaker State** - Estado actual

### Crear Dashboards Personalizados

1. En Grafana, click en **+** > **Dashboard**
2. Añadir panel con queries como:

```promql
# Tasa de éxito
(
  pjud_causas_processed_total{status="success"}
  /
  sum(pjud_causas_processed_total)
) * 100

# Causas procesadas por hora
increase(pjud_causas_processed_total[1h])

# Errores en la última hora
sum(increase(pjud_errors_total[1h])) by (type)
```

---

## 🚨 Alertas

### Alertas Configuradas

1. **HighScrapingFailureRate** 🔴 CRITICAL
   - Se dispara cuando >50% de causas fallan por 5 minutos

2. **CaptchaDetectionSpike** 🟡 WARNING
   - Más de 0.1 detecciones/segundo por 2 minutos

3. **CircuitBreakerOpen** 🟡 WARNING
   - El circuit breaker se abre

4. **ScraperNotRunning** 🔴 CRITICAL
   - El endpoint de métricas no responde por 2 minutos

5. **NoScrapingActivity** 🟡 WARNING
   - Sin actividad por >10 minutos

6. **HighErrorRate** 🟡 WARNING
   - Más de 0.5 errores/segundo por 5 minutos

7. **SlowScrapingOperations** 🟡 WARNING
   - p95 de duración >60 segundos por 10 minutos

8. **HighMemoryUsage** 🟡 WARNING
   - Uso de memoria >2GB por 5 minutos

### Configurar Notificaciones

#### Email

Edita `alertmanager.yml`:

```yaml
email_configs:
  - to: 'tu-email@company.com'
    from: 'alertmanager@company.com'
    smarthost: 'smtp.gmail.com:587'
    auth_username: 'tu-email@gmail.com'
    auth_password: 'tu-app-password'
```

#### Slack

1. Crea un webhook en Slack: https://api.slack.com/messaging/webhooks
2. Edita `alertmanager.yml`:

```yaml
slack_configs:
  - api_url: 'https://hooks.slack.com/services/T00/B00/XXX'
    channel: '#alerts'
    title: '{{ .GroupLabels.alertname }}'
```

#### Webhook Personalizado

```yaml
webhook_configs:
  - url: 'https://tu-servidor.com/webhook'
    send_resolved: true
```

---

## 🔧 Troubleshooting

### El servidor de métricas no inicia

```bash
# Verificar si el puerto está en uso
netstat -ano | findstr :9091

# Cambiar el puerto
set METRICS_PORT=9092
npm run metrics
```

### Prometheus no encuentra el scraper

**En Windows/Mac con Docker:**
```yaml
# prometheus.yml
targets: ['host.docker.internal:9091']
```

**En Linux con Docker:**
```yaml
# prometheus.yml
targets: ['172.17.0.1:9091']
```

**Sin Docker:**
```yaml
# prometheus.yml
targets: ['localhost:9091']
```

### Grafana no muestra datos

1. Verifica que Prometheus esté scrapeando:
   - Ve a http://localhost:9090/targets
   - El target `pjud-scraper` debe estar **UP**

2. Verifica la datasource en Grafana:
   - Configuration > Data Sources > Prometheus
   - Click "Test" - debe decir "Data source is working"

3. Verifica que haya métricas:
   - Abre http://localhost:9091/metrics
   - Debe mostrar métricas en formato texto

### Las alertas no se envían

1. Verifica la configuración de AlertManager:
   ```bash
   docker exec -it pjud-alertmanager amtool check-config /etc/alertmanager/alertmanager.yml
   ```

2. Verifica que las alertas estén activas en Prometheus:
   - http://localhost:9090/alerts

3. Revisa logs de AlertManager:
   ```bash
   docker logs pjud-alertmanager
   ```

### Alto uso de memoria/disco

**Reducir retención de Prometheus:**

Edita `docker-compose.yml`:
```yaml
command:
  - '--storage.tsdb.retention.time=7d'  # Reducir a 7 días
```

**Limpiar datos viejos:**
```bash
docker-compose down
docker volume rm webscrapping_prometheus-data
docker-compose up -d
```

---

## 📝 Comandos Útiles

```bash
# Iniciar stack de monitoreo
docker-compose up -d

# Ver logs
docker-compose logs -f prometheus
docker-compose logs -f grafana

# Reiniciar servicios
docker-compose restart prometheus
docker-compose restart grafana

# Detener todo
docker-compose down

# Detener y borrar datos
docker-compose down -v

# Ver estado
docker-compose ps

# Entrar a contenedor
docker exec -it pjud-prometheus sh
docker exec -it pjud-grafana sh

# Recargar configuración de Prometheus (sin reiniciar)
curl -X POST http://localhost:9090/-/reload
```

---

## 📚 Recursos Adicionales

- [Documentación de Prometheus](https://prometheus.io/docs/)
- [Documentación de Grafana](https://grafana.com/docs/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)

---

## 🎓 Ejemplos de Queries Útiles

### Prometheus Queries (PromQL)

```promql
# Tasa de procesamiento (causas/minuto)
rate(pjud_causas_processed_total[5m]) * 60

# Porcentaje de éxito
(
  pjud_causas_processed_total{status="success"}
  /
  sum(pjud_causas_processed_total)
) * 100

# Duración promedio del scraping
rate(pjud_scraping_duration_seconds_sum{operation="full_scrape"}[5m])
/
rate(pjud_scraping_duration_seconds_count{operation="full_scrape"}[5m])

# Top 3 tipos de errores
topk(3, sum by (type) (pjud_errors_total))

# Memoria usada en GB
process_resident_memory_bytes / 1024 / 1024 / 1024

# Predicción de finalización (causas restantes / tasa actual)
(
  total_causas - sum(pjud_causas_processed_total)
) / (
  rate(pjud_causas_processed_total{status="success"}[5m]) * 60
)
```

---

¡Monitoreo implementado exitosamente! 🎉

Para soporte adicional, revisa los logs o crea un issue en el repositorio.

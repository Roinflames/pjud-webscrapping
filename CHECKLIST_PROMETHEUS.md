# ✅ Checklist de Verificación - Prometheus Implementado

Usa este checklist para verificar que todo está funcionando correctamente.

## 📦 1. Instalación

- [x] Dependencias instaladas (`npm install`)
- [x] `prom-client` instalado
- [x] `express` instalado
- [x] Docker Desktop instalado (para Windows/Mac)
- [x] Docker Compose disponible

**Verificar:**
```bash
npm list prom-client express
docker --version
docker-compose --version
```


## 📁 2. Archivos Creados

### Sistema de Métricas
- [x] `src/monitoring/metrics-collector.js`
- [x] `src/monitoring/metrics-server.js`
- [x] `src/monitoring/instrumented-scraper.js`

### Configuración Prometheus
- [x] `prometheus.yml`
- [x] `alerts.yml`
- [x] `alertmanager.yml`

### Docker
- [x] `docker-compose.yml`

### Grafana
- [x] `grafana/provisioning/datasources/prometheus.yml`
- [x] `grafana/provisioning/dashboards/default.yml`
- [x] `grafana/dashboards/pjud-scraper-overview.json`

### Documentación
- [x] `MONITORING.md`
- [x] `EJEMPLO_USO_METRICAS.md`
- [x] `QUICKSTART_MONITORING.md`
- [x] `PROMETHEUS_IMPLEMENTACION.md`
- [x] `CHECKLIST_PROMETHEUS.md`

### Scripts
- [x] `start-monitoring.sh` (Linux/Mac)
- [x] `start-monitoring.ps1` (Windows)

### Package.json
- [x] Scripts agregados (`metrics`, `scrape`, etc.)

**Verificar:**
```bash
ls src/monitoring/
ls grafana/
ls *.yml
ls *.md
```

## 🚀 3. Servicios Funcionando

### Docker Stack
- [ ] Contenedores iniciados
- [ ] Prometheus corriendo (puerto 9090)
- [ ] Grafana corriendo (puerto 3000)
- [ ] AlertManager corriendo (puerto 9093)
- [ ] Node Exporter corriendo (puerto 9100)

**Verificar:**
```bash
# Iniciar stack
docker-compose up -d

# Verificar estado
docker-compose ps

# Deberías ver:
# pjud-prometheus     Up  9090/tcp
# pjud-grafana        Up  3000/tcp
# pjud-alertmanager   Up  9093/tcp
# pjud-node-exporter  Up  9100/tcp
```

### Servidor de Métricas
- [ ] Servidor iniciado en puerto 9091
- [ ] Endpoint `/metrics` responde
- [ ] Endpoint `/health` responde
- [ ] Endpoint `/metrics/json` responde

**Verificar:**
```bash
# Iniciar servidor
npm run metrics

# En otra terminal, probar endpoints
curl http://localhost:9091/health
curl http://localhost:9091/metrics
curl http://localhost:9091/metrics/json
```

**Respuesta esperada `/health`:**
```json
{
  "status": "healthy",
  "service": "pjud-scraper-metrics",
  "timestamp": "2026-01-10T...",
  "uptime": 123.456
}
```

## 🔗 4. Conexiones

### Prometheus → Metrics Server
- [ ] Prometheus puede alcanzar el servidor de métricas
- [ ] Target `pjud-scraper` está UP (verde)

**Verificar:**
1. Abre http://localhost:9090/targets
2. Busca `pjud-scraper`
3. Estado debe ser **UP** (verde)

**Si está DOWN:**
- Windows/Mac: Verifica que `prometheus.yml` use `host.docker.internal:9091`
- Linux: Cambia a `172.17.0.1:9091` en `prometheus.yml`

### Grafana → Prometheus
- [ ] Datasource configurado
- [ ] Conexión exitosa

**Verificar:**
1. Abre http://localhost:3000
2. Login: `admin` / `admin`
3. Ve a Configuration → Data Sources
4. Click en "Prometheus"
5. Scroll down → Click "Test"
6. Debe decir: **"Data source is working"** (verde)

## 📊 5. Métricas Generándose

### Métricas Base (sin scraper)
- [ ] Métricas del sistema visibles
- [ ] Métricas de Node.js visibles

**Verificar:**
```bash
curl http://localhost:9091/metrics | grep "process_cpu"
curl http://localhost:9091/metrics | grep "nodejs_heap"
```

### Métricas de Negocio (con scraper)
- [ ] `pjud_causas_processed_total` existe
- [ ] `pjud_scraping_duration_seconds` existe
- [ ] Valores incrementan al ejecutar scraper

**Verificar:**
```bash
# Terminal 1: Iniciar scraper
npm run scrape

# Terminal 2: Ver métricas en tiempo real
watch -n 2 'curl -s http://localhost:9091/metrics | grep "pjud_causas_processed_total"'
```

## 📈 6. Dashboard de Grafana

- [ ] Dashboard "PJUD Scraper - Overview" cargado
- [ ] Paneles muestran datos
- [ ] Gráficos se actualizan

**Verificar:**
1. Abre http://localhost:3000
2. Ve a Dashboards → Browse
3. Abre "PJUD Scraper - Overview"
4. Deberías ver:
   - 4 stats en la parte superior
   - Gráficos de procesamiento
   - Pie chart de estados
   - Gauge de progreso

**Si no hay datos:**
- Verifica que el scraper esté corriendo
- Verifica que Prometheus esté scrapeando (paso 4)
- Espera 15-30 segundos para que aparezcan datos

## 🚨 7. Alertas

### Reglas de Alertas
- [ ] Prometheus carga las reglas de `alerts.yml`
- [ ] Alertas visibles en Prometheus

**Verificar:**
1. Abre http://localhost:9090/alerts
2. Deberías ver 10 alertas:
   - HighScrapingFailureRate
   - CaptchaDetectionSpike
   - CircuitBreakerOpen
   - ScraperNotRunning
   - NoScrapingActivity
   - HighErrorRate
   - SlowScrapingOperations
   - HighMemoryUsage
   - BlockedRequestsIncreasing
   - TooManyRetries

### AlertManager
- [ ] AlertManager corriendo
- [ ] Configuración cargada

**Verificar:**
```bash
# Ver si AlertManager está corriendo
docker logs pjud-alertmanager

# Verificar configuración
docker exec -it pjud-alertmanager amtool check-config /etc/alertmanager/alertmanager.yml
```

## 🧪 8. Pruebas

### Test 1: Métrica de Causa Procesada
```bash
# En Node.js REPL
node
> const metrics = require('./src/monitoring/metrics-collector')
> metrics.recordCausaProcessed('success')
> // Luego verifica:
```
```bash
curl http://localhost:9091/metrics | grep "pjud_causas_processed_total"
# Debe mostrar: pjud_causas_processed_total{status="success"} 1
```

### Test 2: Timer de Operación
```javascript
// En Node.js REPL
const metrics = require('./src/monitoring/metrics-collector');
const timer = metrics.startTimer('test_operation');
setTimeout(() => {
  timer();
  console.log('Timer registrado');
}, 2000);
```
```bash
# Verificar en métricas
curl http://localhost:9091/metrics | grep "test_operation"
```

### Test 3: Integración Completa
```bash
# Terminal 1: Servidor de métricas
npm run metrics

# Terminal 2: Ejecutar scraper de prueba
npm run scrape:single

# Terminal 3: Ver métricas
curl http://localhost:9091/metrics/json | jq '.metrics[] | select(.name | contains("causas"))'

# Terminal 4: Ver en Grafana
# Abre http://localhost:3000 y observa el dashboard
```

## 🔍 9. Troubleshooting

### Problema: Puerto 9091 en uso
**Solución:**
```bash
# Windows
set METRICS_PORT=9092
npm run metrics

# Linux/Mac
METRICS_PORT=9092 npm run metrics

# Actualizar prometheus.yml
targets: ['host.docker.internal:9092']
```

### Problema: Prometheus no encuentra el scraper
**Windows/Mac:**
```yaml
# prometheus.yml
targets: ['host.docker.internal:9091']
```

**Linux:**
```yaml
# prometheus.yml
targets: ['172.17.0.1:9091']
```

**Reiniciar Prometheus:**
```bash
docker-compose restart prometheus
```

### Problema: Grafana no muestra datos
**Checklist:**
1. ✓ Prometheus está scrapeando (http://localhost:9090/targets → UP)
2. ✓ Métricas existen (http://localhost:9091/metrics)
3. ✓ Datasource conectado (Grafana → Data Sources → Test)
4. ✓ Esperar 30 segundos para datos frescos

### Problema: Contenedores no inician
```bash
# Ver logs
docker-compose logs -f

# Reiniciar desde cero
docker-compose down -v
docker-compose up -d
```

## ✅ 10. Verificación Final

Ejecuta estos comandos para verificación completa:

```bash
# 1. Verificar servicios Docker
docker-compose ps
# Todos deben estar "Up"

# 2. Verificar servidor de métricas
curl http://localhost:9091/health
# Debe retornar JSON con status: healthy

# 3. Verificar Prometheus targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.labels.job=="pjud-scraper") | .health'
# Debe retornar: "up"

# 4. Verificar métricas
curl http://localhost:9091/metrics | grep "pjud_" | head -5
# Debe mostrar métricas pjud_*

# 5. Verificar Grafana
curl -u admin:admin http://localhost:3000/api/health
# Debe retornar: {"commit":"...","database":"ok","version":"..."}
```

## 🎯 11. Todo Listo Si...

- ✅ Todos los contenedores Docker están corriendo
- ✅ `curl http://localhost:9091/health` retorna `"status": "healthy"`
- ✅ `http://localhost:9090/targets` muestra `pjud-scraper` en verde
- ✅ `http://localhost:3000` abre Grafana (admin/admin)
- ✅ Dashboard "PJUD Scraper - Overview" muestra paneles
- ✅ Al ejecutar `npm run scrape`, las métricas incrementan
- ✅ Los gráficos en Grafana se actualizan

## 📋 Comandos de Inicio Rápido

```bash
# Opción 1: Todo automático (Windows)
.\start-monitoring.ps1

# Opción 2: Todo automático (Linux/Mac)
./start-monitoring.sh

# Opción 3: Manual
docker-compose up -d      # Stack
npm run metrics           # Servidor métricas (Terminal 1)
npm run scrape           # Scraper (Terminal 2)

# Abrir Grafana
# http://localhost:3000 (admin/admin)
```

## 🎓 Siguientes Pasos

Una vez que todo esté funcionando:

1. **Lee la documentación completa:**
   - [QUICKSTART_MONITORING.md](QUICKSTART_MONITORING.md)
   - [MONITORING.md](MONITORING.md)
   - [EJEMPLO_USO_METRICAS.md](EJEMPLO_USO_METRICAS.md)

2. **Integra métricas en tu código:**
   - Sigue los ejemplos en `EJEMPLO_USO_METRICAS.md`

3. **Personaliza alertas:**
   - Edita `alerts.yml`
   - Configura notificaciones en `alertmanager.yml`

4. **Crea dashboards personalizados:**
   - En Grafana, duplica y modifica el dashboard existente

---

## ✨ Felicitaciones!

Si completaste este checklist, tienes un sistema completo de monitoreo con:
- 📊 Métricas en tiempo real
- 📈 Dashboards visuales
- 🔔 Sistema de alertas
- 📚 Documentación completa

**¡Disfruta monitoreando tu scraper!** 🎉

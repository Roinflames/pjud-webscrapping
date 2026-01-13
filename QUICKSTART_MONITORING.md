# 🚀 Quick Start - Monitoreo con Prometheus

Guía rápida para tener el sistema de monitoreo funcionando en 5 minutos.

## ⚡ Inicio Rápido

### Opción 1: Script Automático (Windows)

```powershell
# Ejecutar el script de inicio
.\start-monitoring.ps1
```

### Opción 2: Script Automático (Linux/Mac)

```bash
# Dar permisos de ejecución
chmod +x start-monitoring.sh

# Ejecutar el script
./start-monitoring.sh
```

### Opción 3: Paso a Paso Manual

#### 1️⃣ Instalar Dependencias

```bash
npm install
```

#### 2️⃣ Iniciar Stack Docker

```bash
docker-compose up -d
```

Esto inicia:
- ✅ Prometheus (puerto 9090)
- ✅ Grafana (puerto 3000)
- ✅ AlertManager (puerto 9093)
- ✅ Node Exporter (puerto 9100)

#### 3️⃣ Iniciar Servidor de Métricas

En una terminal:

```bash
npm run metrics
```

Deberías ver:
```
============================================================
📊 PJUD Scraper - Metrics Server
============================================================
✅ Server listening on http://0.0.0.0:9091
📊 Metrics: http://localhost:9091/metrics
📋 JSON: http://localhost:9091/metrics/json
❤️  Health: http://localhost:9091/health
============================================================
```

#### 4️⃣ Ejecutar el Scraper

En otra terminal:

```bash
npm run scrape
```

#### 5️⃣ Ver las Métricas

Abre tu navegador:

- **Grafana:** http://localhost:3000
  - Usuario: `admin`
  - Contraseña: `admin`
  - Dashboard: "PJUD Scraper - Overview"

- **Prometheus:** http://localhost:9090

- **Métricas Raw:** http://localhost:9091/metrics

## 📊 ¿Qué puedes ver?

### Dashboard de Grafana

El dashboard muestra en tiempo real:

1. **Estadísticas Principales**
   - Total de causas procesadas
   - Causas exitosas vs fallidas
   - Operaciones activas

2. **Gráficos de Rendimiento**
   - Tasa de procesamiento (causas/minuto)
   - Duración de operaciones (percentiles)
   - Progreso del checkpoint

3. **Alertas y Seguridad**
   - Detecciones de CAPTCHA
   - Estado del circuit breaker
   - Errores por tipo

4. **Métricas de Sistema**
   - Uso de CPU
   - Uso de memoria
   - Event loop lag

### Queries Útiles en Prometheus

Abre http://localhost:9090/graph y prueba estas queries:

```promql
# Causas procesadas por segundo
rate(pjud_causas_processed_total[5m])

# Porcentaje de éxito
(pjud_causas_processed_total{status="success"} / sum(pjud_causas_processed_total)) * 100

# Duración promedio del scraping
rate(pjud_scraping_duration_seconds_sum[5m]) / rate(pjud_scraping_duration_seconds_count[5m])

# Progreso actual
pjud_checkpoint_progress
```

## 🔧 Troubleshooting Rápido

### El servidor de métricas no inicia

**Problema:** Puerto 9091 en uso

**Solución:**
```bash
# Windows
set METRICS_PORT=9092
npm run metrics

# Linux/Mac
METRICS_PORT=9092 npm run metrics
```

### Grafana no muestra datos

**Solución:**
1. Verifica que Prometheus esté scrapeando:
   - Ve a http://localhost:9090/targets
   - El target `pjud-scraper` debe estar **UP** (verde)

2. Si está **DOWN** (rojo):
   - En Windows: asegúrate de que `host.docker.internal` funcione
   - En Linux: cambia en `prometheus.yml`:
     ```yaml
     targets: ['172.17.0.1:9091']  # En lugar de host.docker.internal
     ```

3. Reinicia Prometheus:
   ```bash
   docker-compose restart prometheus
   ```

### Docker no encuentra la red

**Solución:**
```bash
# Detener todo
docker-compose down

# Limpiar redes
docker network prune

# Reiniciar
docker-compose up -d
```

## 📱 Acceso Rápido

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| Grafana | http://localhost:3000 | admin / admin |
| Prometheus | http://localhost:9090 | - |
| Métricas | http://localhost:9091/metrics | - |
| AlertManager | http://localhost:9093 | - |
| Health Check | http://localhost:9091/health | - |

## 🎯 Ejemplo de Uso

### Ver métricas en tiempo real

```bash
# Terminal 1: Servidor de métricas
npm run metrics

# Terminal 2: Scraper
npm run scrape

# Terminal 3: Ver métricas en tiempo real
watch -n 2 'curl -s http://localhost:9091/metrics/json | jq ".metrics[] | select(.name | contains(\"causas_processed\"))"'
```

### Exportar métricas actuales

```bash
# Formato Prometheus
curl http://localhost:9091/metrics > metrics.txt

# Formato JSON
curl http://localhost:9091/metrics/json | jq . > metrics.json
```

## 🛑 Detener Todo

```bash
# Detener Docker Compose
docker-compose down

# Detener servidor de métricas (Ctrl+C en la terminal)

# Opcional: Borrar datos de Prometheus/Grafana
docker-compose down -v
```

## 📚 Siguiente Paso

Lee la documentación completa:
- [MONITORING.md](MONITORING.md) - Guía completa de monitoreo
- [EJEMPLO_USO_METRICAS.md](EJEMPLO_USO_METRICAS.md) - Cómo integrar métricas en tu código

## 🆘 Ayuda

Si algo no funciona:

1. Verifica los logs:
   ```bash
   docker-compose logs -f
   ```

2. Verifica el estado:
   ```bash
   docker-compose ps
   ```

3. Reinicia todo:
   ```bash
   docker-compose restart
   ```

---

¡Ya está todo listo! 🎉

Abre http://localhost:3000 y observa tus métricas en tiempo real.

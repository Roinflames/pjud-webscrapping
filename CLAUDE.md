# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema RPA (Robotic Process Automation) para extraer información de causas judiciales del Poder Judicial de Chile (PJUD). Procesa 3,221 causas civiles desde CSV, navega el sitio oficial, extrae movimientos y genera reportes estructurados. Incluye monitoreo completo con Prometheus/Grafana.

**Stack:** Node.js + Playwright (scraping) | Prometheus + Grafana (monitoring) | Docker Compose (infrastructure)

## Key Commands

### Development & Execution
```bash
# Single causa (debugging, headless=false)
npm run scrape:single          # node src/index.js

# Batch processing (production, headless=true)
npm run scrape                 # node src/process-causas.js
node src/process-causas.js 10    # Process 10 causas
node src/process-causas.js 0     # Process all (3,221 causas)

# Monitoring stack
npm run docker:up              # Start Prometheus + Grafana + AlertManager
npm run metrics                # Start metrics server on :9091
.\start-monitoring.ps1         # Windows: Start everything
./start-monitoring.sh          # Linux/Mac: Start everything

# Utilities
node src/validate-csv-for-scraping.js    # Validate CSV before scraping
node src/filter-valid-causas.js          # Filter valid causas (with RIT)
node src/sync-csv-to-db.js analyze       # Analyze CSV vs MySQL differences
```

## Architecture: High-Level Flow

```
CSV Input (3,221 causas) → Filter Valid RITs → For Each Causa:
  ├─ Browser (Playwright + anti-detection)
  ├─ Navigation (modals, forms)
  ├─ Form Fill (competencia=3, RIT parsing)
  ├─ Extraction (movimientos structured + PDFs)
  ├─ Export (JSON/CSV/Movimientos)
  └─ Metrics (Prometheus)
```

### Critical Architectural Decisions

1. **Dual Processing Modes:**
   - `index.js`: Single causa (development, visible browser)
   - `process-csv-causas.js`: Batch processing (production, headless)

2. **Competencia Always 3 (Civil):**
   - Analysis revealed ALL causas with valid RIT are civil
   - Hardcoded `competencia: '3'` instead of using CSV value
   - Simplifies validation and eliminates mismatches

3. **Tribunal as Optional Field:**
   - Many causas have `tribunal: NULL` in CSV
   - Form allows search by RIT-only without tribunal
   - Prevents failures on causas lacking tribunal data

4. **PDF Extraction Without Download:**
   - Extracts only URLs from DOM (300ms vs 30s per causa)
   - Downloads on-demand to avoid 64K+ PDF files
   - Intelligent deduplication of similar URLs

5. **Dual Export Formats:**
   - `resultado_[RIT].json` → Arrays (legacy compatibility)
   - `movimientos_[RIT].json` → Structured objects (new standard)
   - Allows gradual migration without breaking changes

## Critical Code Patterns

### RIT Parsing (All Causas)
```javascript
// RIT format: "C-13786-2018" → tipo: "C", rol: "13786", año: "2018"
function extractRolAnio(rit) {
  const parts = rit.split('-');
  return { rol: parts[1], año: parts[2] };
}
```

### Metrics Integration
```javascript
const metrics = require('./monitoring/metrics-collector');

// Record causa processed
metrics.recordCausaProcessed('success'); // or 'failed'

// Time operations
const timer = metrics.startTimer('full_scrape');
await processCausa();
timer();

// Update progress
metrics.updateCheckpointProgress(75); // 75%
```

### Error Handling Flow
```
TRY processCausa()
CATCH (error)
  ├─ Classify: CAPTCHA/Timeout/Selector/Network
  ├─ Record metric: metrics.recordError(type, severity)
  ├─ Save evidence: screenshot + HTML
  ├─ Log to: causas_fallidas.json
  └─ CONTINUE (don't stop batch processing)
```

### Checkpoint System
```javascript
const { loadCheckpoint, saveCheckpoint, isCausaProcessed } = require('./utils/checkpoint');

const checkpoint = loadCheckpoint();
if (isCausaProcessed(checkpoint, causa_id)) {
  continue; // Skip already processed
}
saveCheckpoint(checkpoint, causa_id, 'exitosa');
```

## Monitoring Architecture

```
Scraper → metrics-server.js (:9091/metrics)
            ↓
Prometheus (:9090) scrapes every 15s
  ├─ Stores metrics (30 days retention)
  ├─ Evaluates alerts.yml (10 rules)
  └─ Sends to AlertManager (:9093)
            ↓
Grafana (:3000) queries Prometheus
  └─ Dashboard: "PJUD Scraper Overview"
```

**Key Metrics:**
- `pjud_causas_processed_total{status}` - Counter
- `pjud_scraping_duration_seconds` - Histogram
- `pjud_active_scraping_operations` - Gauge
- `pjud_checkpoint_progress` - Gauge (0-100)
- `pjud_captcha_detected_total` - Counter
- `pjud_errors_total{type,severity}` - Counter

**Critical Alerts (alerts.yml):**
- HighScrapingFailureRate: >50% failed for 5min
- ScraperNotRunning: Endpoint down for 2min
- CaptchaDetectionSpike: >0.1 CAPTCHA/s for 2min
- NoScrapingActivity: No activity >10min

## File Structure: Non-Obvious

```
src/
├── monitoring/                       # Prometheus metrics system
│   ├── metrics-collector.js          # Singleton, 25+ metrics
│   ├── metrics-server.js             # Express server :9091
│   └── instrumented-scraper.js       # Wrappers with metrics
│
├── utils/
│   ├── checkpoint.js                 # Resume processing from saved state
│   ├── captcha-detector.js           # Detect reCAPTCHA/hCAPTCHA/blocks
│   └── logger.js                     # Winston logger (underutilized)
│
├── outputs/
│   ├── resultado_*.json              # Legacy array format
│   ├── movimientos_*.json            # NEW structured format ⭐
│   └── pdf_urls_*.json               # Extracted PDF URLs
│
└── logs/
    ├── procesamiento_*.json          # Full execution log
    └── causas_fallidas_*.json        # Failed causas details

grafana/dashboards/
└── pjud-scraper-overview.json        # Auto-loaded dashboard

docker-compose.yml                     # Full stack: Prometheus, Grafana, AlertManager
prometheus.yml                         # Scrape config (targets, intervals)
alerts.yml                            # 10 alert rules
```

## Configuration Files

### `.env` (Required)
```bash
OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php
METRICS_PORT=9091  # Optional, defaults to 9091
```

### `src/config/pjud_config.json` (Single Mode)
```json
{
  "rit": "C-13786-2018",        // Full RIT
  "competencia": "3",           // ALWAYS 3 (Civil)
  "corte": "90",                // Court ID
  "tribunal": "276",            // Tribunal ID (can be NULL)
  "tipoCausa": "C"              // Extracted from RIT
}
```

### `causa.csv` (Batch Mode)
- 3,221 civil causas
- Required columns: `causa_id`, `rit`, `competencia`, `tribunal`
- `rit` MUST NOT be NULL or empty
- Format: `[LETTER]-[ROL]-[YEAR]` (e.g., `C-13786-2018`)

## Critical PJUD Selectors

```javascript
// These are FRAGILE - if PJUD changes HTML, scraper breaks
'#close-modal'                          // Initial modal
'text=Consulta causas'                  // Navigation
'#competencia'                          // Form: competencia dropdown
'#conRolCausa'                          // Form: rol input
'#conEraCausa'                          // Form: year input
'a[title="Detalle de la causa"]'        // Results: detail link
'table.table tbody tr'                  // Movimientos table
'a[onclick*="submit"] i.fa-file-pdf-o'  // PDF icons
```

## Performance Optimizations

1. **Random Delays:** `200 + Math.random() * 400` ms (human-like, faster than fixed 1s)
2. **DOM Extraction First:** Extract all PDF info in single `page.evaluate()` without clicks
3. **Parallel Extraction:** `Promise.all()` for independent operations
4. **Timeout Strategy:** 30s critical, 15s important, 5s fast, `domcontentloaded` over `networkidle`
5. **User-Agent Rotation:** Pool of 5 agents to avoid detection

## Common Pitfalls

1. **Competencia != 3:** Will fail. All RIT causas are civil (competencia=3)
2. **Missing RIT:** Filter causas first with `filter-valid-causas.js`
3. **Prometheus Target DOWN:** Check `prometheus.yml` uses `host.docker.internal:9091` (Windows/Mac) or `172.17.0.1:9091` (Linux)
4. **Selector Changes:** PJUD updates break scraper. Check `pjud_error_*.png` screenshots
5. **CAPTCHA Detection:** Scraper stops. Manual intervention required (no auto-solver)

## Monitoring Quick Reference

```bash
# Check metrics endpoint
curl http://localhost:9091/health
curl http://localhost:9091/metrics | grep pjud_causas

# Verify Prometheus scraping
# http://localhost:9090/targets → pjud-scraper should be UP (green)

# Access Grafana
# http://localhost:3000 (admin/admin)
# Dashboard: "PJUD Scraper - Overview"

# Useful PromQL queries
# Success rate: (sum(rate(pjud_causas_processed_total{status="success"}[5m])) / sum(rate(pjud_causas_processed_total[5m]))) * 100
# ETA minutes: (3221 - sum(pjud_causas_processed_total)) / (rate(pjud_causas_processed_total{status="success"}[5m]) * 60)
```

## Known Limitations

1. **Sequential Processing:** One causa at a time (~30-60s each = 27-54 hours total)
2. **No Circuit Breaker:** Metric defined but not implemented
3. **No Auto-Retry:** Failed causas require manual reprocessing
4. **Fragile Selectors:** PJUD HTML changes break scraper
5. **No Proxy Rotation:** Single IP, vulnerable to blocking
6. **CAPTCHA:** Detection only, no resolution

## Documentation

- **MONITORING.md:** Complete monitoring guide (9,000+ words)
- **QUICKSTART_MONITORING.md:** Get started in 5 minutes
- **EJEMPLO_USO_METRICAS.md:** Practical integration examples
- **COMO_EJECUTAR.md:** Execution guide
- **EXPLICACION_SCRAPING.md:** Detailed architecture

## Integration Examples

### Add Metrics to New Function
```javascript
const metrics = require('./monitoring/metrics-collector');

async function myNewFunction(page) {
  const timer = metrics.startTimer('my_operation');
  metrics.incrementActiveOps();

  try {
    // Your code here
    const result = await doSomething();
    metrics.recordCausaProcessed('success');
    return result;
  } catch (error) {
    metrics.recordCausaProcessed('failed');
    metrics.recordError('my_operation', 'error');
    throw error;
  } finally {
    timer();
    metrics.decrementActiveOps();
  }
}
```

### Use Checkpoint System
```javascript
const { loadCheckpoint, saveCheckpoint, isCausaProcessed } = require('./utils/checkpoint');

async function processBatch(causas) {
  const checkpoint = loadCheckpoint();

  for (const causa of causas) {
    if (isCausaProcessed(checkpoint, causa.causa_id)) {
      console.log(`Skipping ${causa.rit} (already processed)`);
      continue;
    }

    try {
      await processCausa(causa);
      saveCheckpoint(checkpoint, causa.causa_id, 'exitosa');
    } catch (error) {
      saveCheckpoint(checkpoint, causa.causa_id, 'fallida');
    }
  }
}
```

## Glossary

- **RIT:** Rol Interno del Tribunal. Format: `[TYPE]-[ROL]-[YEAR]`
- **Competencia:** Judicial matter type (1=Penal, 2=Familia, 3=Civil)
- **Movimiento:** Procedural action in a causa (e.g., "Sentencia")
- **Caratulado:** Official causa name
- **PJUD:** Poder Judicial de Chile
- **OJV:** Oficina Judicial Virtual (PJUD web portal)

---

## Session Context Recovery

Para mantener continuidad entre sesiones de Claude Code, este proyecto usa una estructura de archivos en `.claude/`.

### Al iniciar una nueva sesión

Pedir a Claude:
> "Resume el contexto del proyecto"

Claude leerá automáticamente:
1. Este archivo (`CLAUDE.md`) - documentación técnica
2. `.claude/session-context.md` - estado actual del proyecto
3. `git status` - cambios pendientes
4. `.claude/history/` - prompts históricos relevantes

### Estructura de archivos `.claude/`

```
.claude/
├── settings.local.json      # Permisos persistentes de Claude Code
├── session-context.md       # Estado actual del proyecto (actualizar al final de cada sesión)
└── history/                 # Historial de prompts y decisiones
    ├── 01_selectores-formulario-pjud.md
    ├── 02_boton-busqueda-detalle.md
    ├── ...
    └── NN_descripcion-corta.md
```

### Al finalizar una sesión

Pedir a Claude:
> "Actualiza el contexto de sesión"

Esto actualizará `.claude/session-context.md` con:
- Tareas realizadas
- Archivos modificados
- Decisiones tomadas
- Próximos pasos pendientes

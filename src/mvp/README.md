# 🚀 MVP - Sistema Completo de Scraping PJUD

## 📋 Descripción

MVP completo que integra todas las funcionalidades:
- **Gestión de Causas**: Lectura desde CSV, validación y normalización
- **Scraping Masivo**: Sistema de cola con control de límites y reintentos
- **API Completa**: Endpoints REST para gestión y consulta
- **Dashboard Web**: Interfaz completa para monitoreo y control

## 🗂️ Estructura

```
src/mvp/
├── causa-manager.js      # Gestión de causas (CSV, validación, normalización)
├── cola-scraping.js      # Sistema de cola para scraping masivo
└── README.md            # Este archivo

src/api/
├── mvp-api.js           # Endpoints REST del MVP
└── public/
    └── mvp-dashboard.html  # Dashboard web completo
```

## 🔧 Módulos

### 1. Causa Manager (`causa-manager.js`)

Gestión completa de causas:
- Lectura desde CSV
- Validación y normalización
- Preparación de configuración para scraping
- Estadísticas y búsquedas

**Funciones principales:**
- `obtenerCausas()` - Carga todas las causas (con cache)
- `obtenerCausasValidas()` - Solo causas válidas para scraping
- `obtenerEstadisticasCausas()` - Estadísticas completas
- `buscarCausaPorRIT(rit)` - Buscar causa específica
- `prepararConfigScraping(causa)` - Preparar config para scraping

### 2. Cola de Scraping (`cola-scraping.js`)

Sistema robusto de cola:
- Inicialización con filtros
- Control de límites diarios
- Reintentos automáticos
- Manejo de errores
- Progreso persistente

**Funciones principales:**
- `inicializarCola(causas, filtros)` - Crear cola desde causas
- `procesarSiguiente()` - Procesar siguiente causa
- `obtenerEstadisticasCola()` - Estado de la cola
- `verificarLimiteDiario()` - Control de límites

### 3. API MVP (`mvp-api.js`)

Endpoints REST completos:

**Causas:**
- `GET /api/mvp/causas` - Listar causas (con filtros y paginación)
- `GET /api/mvp/causas/:rit` - Obtener causa por RIT
- `GET /api/mvp/estadisticas` - Estadísticas generales

**Scraping:**
- `POST /api/mvp/scraping/ejecutar` - Ejecutar scraping individual (requiere token)
- `POST /api/mvp/cola/inicializar` - Inicializar cola (requiere token)
- `GET /api/mvp/cola/estado` - Estado de la cola
- `POST /api/mvp/cola/procesar` - Procesar siguiente (requiere token)

**Resultados:**
- `GET /api/mvp/resultados` - Listar resultados (requiere token)
- `GET /api/mvp/resultados/:rit` - Obtener resultado (requiere token)

## 🌐 Dashboard Web

Acceso: `http://localhost:3000/mvp`

**Características:**
- Estadísticas en tiempo real
- Lista de causas con filtros
- Ejecución de scraping individual
- Gestión de cola de scraping
- Visualización de resultados

## 🚀 Uso

### 1. Cargar Causas

```javascript
const { obtenerCausas } = require('./src/mvp/causa-manager');

// Cargar todas las causas
const causas = obtenerCausas();

// Solo válidas
const validas = obtenerCausasValidas();

// Estadísticas
const stats = obtenerEstadisticasCausas();
```

### 2. Inicializar Cola

```javascript
const { inicializarCola } = require('./src/mvp/cola-scraping');

// Inicializar con todas las causas válidas
const cola = inicializarCola();

// Con filtros
const cola = inicializarCola(null, {
  competencia: '1',
  tribunal: '8',
  tipoCausa: 'C',
  limite: 100
});
```

### 3. Procesar Cola

```javascript
const { procesarSiguiente } = require('./src/mvp/cola-scraping');

// Procesar siguiente causa
const resultado = await procesarSiguiente();
console.log(resultado);
```

### 4. Desde la API

```bash
# Obtener estadísticas
curl http://localhost:3000/api/mvp/estadisticas

# Listar causas
curl http://localhost:3000/api/mvp/causas?limite=50&offset=0

# Inicializar cola (requiere token)
curl -X POST http://localhost:3000/api/mvp/cola/inicializar \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limite": 100, "competencia": "1"}'

# Procesar siguiente (requiere token)
curl -X POST http://localhost:3000/api/mvp/cola/procesar \
  -H "Authorization: Bearer TU_TOKEN"
```

## ⚙️ Configuración

### Límites Diarios

Editar `src/outputs/cola_config.json`:

```json
{
  "limiteDiario": 150,
  "pausaEntreCausas": 3000,
  "maxReintentos": 3,
  "pausaEntreReintentos": 5000,
  "tiempoMaximoPorCausa": 300000
}
```

### Archivos de Datos

- `causa.csv` - Fuente de datos de causas
- `src/outputs/causas_cache.json` - Cache de causas cargadas
- `src/outputs/cola_scraping.json` - Estado de la cola
- `src/outputs/scraping_progress.json` - Progreso individual
- `src/outputs/daily_scraping_count.json` - Contador diario

## 📊 Flujo Completo

```
1. Cargar causas desde CSV
   ↓
2. Validar y normalizar
   ↓
3. Inicializar cola con filtros
   ↓
4. Procesar causa por causa
   ↓
5. Guardar resultados (JSON + PDFs base64)
   ↓
6. Consultar resultados via API
   ↓
7. Visualizar en dashboard web
```

## 🔒 Autenticación

Algunos endpoints requieren token. Para obtenerlo:

```bash
# Ver token en archivo
cat src/outputs/tokens.json

# O usar script
./src/api/obtener-token.sh
```

## 📝 Notas

- El sistema guarda progreso automáticamente
- Puede reanudar desde donde se quedó
- Respeto de límites diarios
- Reintentos automáticos en caso de error
- Cache de causas para mejor rendimiento

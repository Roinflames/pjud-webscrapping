# Análisis: Casos de Uso de Scraping

## 📋 Tres Casos de Uso Identificados

### 1. 🔄 Scraping Continuo 24/7 (Monitoreo de Movimientos Nuevos)
**Objetivo**: Recorrer causas periódicamente buscando movimientos nuevos, poblando SQL todo el día

### 2. 🎯 Scraping por Endpoint (Gatillado por Nuevo Ingreso a BD)
**Objetivo**: Endpoint HTTP que se gatilla cuando hay un nuevo ingreso a la base de datos

### 3. 📦 Scraping Masivo (Una Vez, Poblar Toda la BD)
**Objetivo**: Recorrer todas las causas una vez para poblar toda la base de datos (ejecución única)

---

## ✅ Análisis por Caso

### 1️⃣ Scraping Continuo 24/7 (Monitoreo de Movimientos Nuevos)

#### ❌ **NO está completamente cubierto**

**Archivos relevantes refactorizados:**
- ❌ `worker_cola_scraping.js` - Procesa cola, pero no está diseñado para polling continuo
- ❌ `scraping_masivo.js` - Recorre todas las causas, pero no está diseñado para ejecución continua

**Archivos existentes (no refactorizados):**
- ✅ `src/api/listener.js` - Detecta nuevos registros en BD y los agrega a cola
- ⚠️ `worker_cola_scraping.js` - Procesa cola, pero necesita adaptación

**Lo que falta:**
1. **Worker de monitoreo continuo** que:
   - Recorra todas las causas activas periódicamente (ej: cada 1 hora)
   - Compare movimientos actuales vs movimientos en BD
   - Detecte movimientos nuevos
   - Solo procese causas con movimientos nuevos
   - Se ejecute 24/7 sin parar

**Recomendación:**
- Crear nuevo: `src/worker-monitoreo-continuo.js`
- Usar `processCausa` para scraping
- Comparar movimientos con BD para detectar nuevos
- Configurar intervalo de polling (ej: `--interval 3600000` = 1 hora)

---

### 2️⃣ Scraping por Endpoint (Gatillado por Nuevo Ingreso a BD)

#### ✅ **CUBIERTO, pero necesita verificación**

**Archivos relevantes refactorizados:**
- ✅ `api/scraper-service.js` - Ya usa `processCausa`, exporta `ejecutarScraping()`
- ✅ `worker_cola_scraping.js` - Procesa cola usando `processCausa`

**Archivos existentes (no refactorizados):**
- ✅ `src/api/listener.js` - Detecta nuevos registros en BD y los agrega a cola
- ✅ `src/api/mvp-api.js` - Tiene ruta `POST /api/mvp/scraping/ejecutar` que usa `executeScraping`
- ✅ `src/api/scraping-api.js` - Tiene rutas que usan `ejecutarScraping`

**Arquitectura actual:**
```
Opción A (Cola):
Nuevo registro en BD
    ↓
listener.js detecta
    ↓
Agrega a pjud_cola_scraping
    ↓
worker_cola_scraping.js procesa (usa processCausa)

Opción B (Endpoint directo):
POST /api/mvp/scraping/ejecutar
    ↓
ejecutarScraping() (usa processCausa)
    ↓
Retorna resultado HTTP
```

**Lo que funciona:**
- ✅ `listener.js` detecta nuevos registros
- ✅ `worker_cola_scraping.js` procesa la cola usando `processCausa`
- ✅ `api/mvp-api.js` tiene ruta `POST /api/mvp/scraping/ejecutar`
- ✅ `api/scraping-api.js` tiene rutas de scraping

**⚠️ Verificación necesaria:**
1. Verificar que `mvp-api.js` importa correctamente (`ejecutarScraping` vs `executeScraping`)
2. Verificar que las rutas funcionan correctamente
3. Opcional: Agregar ruta más simple `POST /api/scrape` que reciba RIT directamente

**Recomendación:**
- ✅ Ya está implementado
- Verificar/corregir imports en `mvp-api.js` si es necesario
- Probar endpoints existentes

---

### 3️⃣ Scraping Masivo (Una Vez, Poblar Toda la BD)

#### ✅ **COMPLETAMENTE cubierto**

**Archivos relevantes refactorizados:**
- ✅ `scraping_masivo.js` - Recorre todas las causas desde CSV, usa `processCausa`
- ✅ `process-causas.js` - Tiene `processMultipleCausas()` que procesa desde CSV

**Funcionalidad:**
- ✅ Lee CSV de causas (`causa.csv`)
- ✅ Filtra causas válidas (con tribunal)
- ✅ Procesa cada causa usando `processCausa`
- ✅ Guarda checkpoint para poder continuar si se interrumpe
- ✅ Pausa entre causas para respetar límites

**Uso:**
```bash
npm run scrape:masivo
# o
node src/scraping_masivo.js
```

**Estado:**
- ✅ **LISTO PARA USAR**
- ✅ Ya usa `processCausa` (refactorizado)
- ✅ Puede poblar toda la BD en una ejecución

---

## 📊 Resumen de Cobertura

| Caso de Uso | Estado | Archivos Relevantes | Acción Requerida |
|------------|--------|---------------------|------------------|
| **1. Continuo 24/7** | ❌ No cubierto | `worker_cola_scraping.js` (parcial) | Crear `worker-monitoreo-continuo.js` |
| **2. Por Endpoint** | ✅ Parcialmente | `api/scraper-service.js` ✅ | Agregar ruta HTTP directa |
| **3. Masivo (una vez)** | ✅ Completo | `scraping_masivo.js` ✅ | Nada, listo para usar |

---

## 🛠️ Recomendaciones de Implementación

### Para Caso 1 (Continuo 24/7):

**Crear:** `src/worker-monitoreo-continuo.js`

```javascript
// Pseudocódigo
async function workerMonitoreoContinuo() {
  while (true) {
    // 1. Obtener todas las causas activas de BD
    const causasActivas = await obtenerCausasActivas();
    
    for (const causa of causasActivas) {
      // 2. Scraping usando processCausa
      const resultado = await processCausa(page, context, causa, outputDir);
      
      // 3. Comparar movimientos con BD
      const movimientosNuevos = await detectarMovimientosNuevos(causa.rit, resultado);
      
      // 4. Solo actualizar si hay movimientos nuevos
      if (movimientosNuevos.length > 0) {
        await actualizarMovimientosEnBD(causa.rit, movimientosNuevos);
      }
    }
    
    // 5. Esperar intervalo (ej: 1 hora)
    await sleep(INTERVAL_MS);
  }
}
```

**Características:**
- Usa `processCausa` (ya refactorizado)
- Compara movimientos para detectar solo nuevos
- Se ejecuta 24/7
- Configurable intervalo

### Para Caso 2 (Por Endpoint):

**Opción A: Usar `scraper-service.js` directamente**
```javascript
// En api/server.js o api/mvp-api.js
app.post('/api/scrape', async (req, res) => {
  const { ejecutarScraping } = require('./scraper-service');
  const resultado = await ejecutarScraping(req.body);
  res.json(resultado);
});
```

**Opción B: Integrar con listener**
```javascript
// Modificar listener.js para llamar endpoint directamente
// O mantener cola pero con procesamiento inmediato
```

### Para Caso 3 (Masivo):

**✅ Ya está listo:**
```bash
npm run scrape:masivo
```

---

## 🎯 Conclusión

### Archivos Refactorizados que SÍ se Usarán:

1. ✅ **`process-causa.js`** - Motor único usado por TODOS
2. ✅ **`scraping_masivo.js`** - Caso 3 (masivo una vez)
3. ✅ **`api/scraper-service.js`** - Caso 2 (endpoint)
4. ⚠️ **`worker_cola_scraping.js`** - Caso 2 (parcial, procesa cola)

### Archivos Refactorizados que NO se Usarán:

1. ❌ `index.js` - Solo para testing manual
2. ❌ `index-sin-pausa.js` - Solo para testing manual
3. ❌ `scraper_batch.js` - Ya no se usa (reemplazado por `scraping_masivo.js`)
4. ❌ `processRit.js` - Solo shim de compatibilidad

### Lo que Falta Crear:

1. 🔨 **`worker-monitoreo-continuo.js`** - Para Caso 1 (24/7)
2. 🔨 **Ruta HTTP en API** - Para Caso 2 (endpoint directo)

---

## ✅ Plan de Acción

1. **Caso 3 (Masivo)**: ✅ Ya está listo, usar `scraping_masivo.js`

2. **Caso 2 (Endpoint)**: 
   - Agregar ruta HTTP que use `scraper-service.js`
   - O mejorar integración `listener.js` → endpoint

3. **Caso 1 (Continuo 24/7)**:
   - Crear `worker-monitoreo-continuo.js`
   - Implementar lógica de detección de movimientos nuevos
   - Configurar para ejecución 24/7

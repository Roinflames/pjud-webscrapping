# 📋 Casos de Uso de Scraping - Documentación Oficial

Este documento describe los **3 casos de uso principales** del sistema de scraping PJUD y los archivos correspondientes.

---

## 🎯 Los 3 Casos de Uso

### 1️⃣ Scraping Continuo 24/7 (Monitoreo de Movimientos Nuevos)

**Objetivo**: Recorrer causas activas periódicamente buscando movimientos nuevos, poblando SQL todo el día de forma continua.

**Archivo**: `src/worker-monitoreo-continuo.js`

**Características**:
- ✅ Se ejecuta 24/7 sin parar
- ✅ Recorre todas las causas activas de la BD periódicamente
- ✅ Usa `processCausa` (motor único) para scraping
- ✅ Compara movimientos con BD para detectar solo movimientos nuevos
- ✅ Actualiza BD solo cuando hay movimientos nuevos
- ✅ Configurable intervalo de polling (default: 1 hora)

**Uso**:
```bash
# Ejecutar con intervalo por defecto (1 hora)
npm run scrape:monitoreo

# Ejecutar con intervalo personalizado (30 minutos)
node src/worker-monitoreo-continuo.js --interval 1800000

# Ejecutar una vez y terminar (para testing)
node src/worker-monitoreo-continuo.js --once
```

**Flujo**:
```
1. Obtener causas activas de BD
   ↓
2. Para cada causa:
   - Scraping usando processCausa
   - Comparar movimientos con BD
   - Detectar movimientos nuevos
   - Actualizar BD solo con nuevos
   ↓
3. Esperar intervalo (ej: 1 hora)
   ↓
4. Repetir (24/7)
```

**Configuración**:
- Intervalo por defecto: 1 hora (3600000 ms)
- Pausa entre causas: 2 segundos
- Tabla de causas: `causa`
- Tabla de movimientos: `pjud_movimientos_intermedia`

---

### 2️⃣ Scraping por Endpoint (Gatillado por Nuevo Ingreso a BD)

**Objetivo**: Endpoint HTTP que se gatilla cuando hay un nuevo ingreso a la base de datos, ejecutando scraping inmediatamente.

**Archivo**: `src/api/scraper-service.js`

**Características**:
- ✅ Endpoint HTTP (`POST /api/scraping/ejecutar`)
- ✅ Usa `processCausa` (motor único) para scraping
- ✅ Retorna resultado inmediato vía HTTP
- ✅ Puede ser llamado desde listener o directamente
- ✅ Guarda resultados en BD y archivos

**Uso**:
```bash
# Iniciar servidor API
npm run api:start

# Llamar endpoint desde otro sistema
curl -X POST http://localhost:3000/api/scraping/ejecutar \
  -H "Content-Type: application/json" \
  -d '{
    "rit": "C-3030-2017",
    "competencia": "3",
    "corte": "90",
    "tribunal": "61",
    "tipoCausa": "C"
  }'
```

**Endpoints disponibles**:
- `POST /api/scraping/ejecutar` - Ejecuta scraping inmediatamente
- `POST /api/mvp/scraping/ejecutar` - Ejecuta scraping (MVP, requiere auth)
- `GET /api/scraping/resultado/:rit` - Obtiene resultado por RIT

**Integración con Listener**:
```
Nuevo registro en BD
    ↓
src/api/listener.js detecta
    ↓
Puede llamar directamente al endpoint
    o
Agregar a cola → worker_cola_scraping.js procesa
```

**Flujo**:
```
1. Request HTTP con RIT y configuración
   ↓
2. Validar datos
   ↓
3. Scraping usando processCausa
   ↓
4. Guardar en BD y archivos
   ↓
5. Retornar resultado HTTP
```

---

### 3️⃣ Scraping Masivo (Una Vez, Poblar Toda la BD)

**Objetivo**: Recorrer todas las causas una vez para poblar toda la base de datos. Ejecución única, no continua.

**Archivo**: `src/scraping_masivo.js`

**Características**:
- ✅ Recorre todas las causas desde CSV (`causa.csv`)
- ✅ Usa `processCausa` (motor único) para scraping
- ✅ Guarda checkpoint para poder continuar si se interrumpe
- ✅ Pausa entre causas para respetar límites de PJUD
- ✅ Ejecución única, no continua

**Uso**:
```bash
# Ejecutar scraping masivo
npm run scrape:masivo

# O directamente
node src/scraping_masivo.js
```

**Flujo**:
```
1. Leer CSV de causas (causa.csv)
   ↓
2. Filtrar causas válidas (con tribunal)
   ↓
3. Para cada causa:
   - Scraping usando processCausa
   - Guardar resultados
   - Guardar checkpoint
   - Pausa entre causas
   ↓
4. Continuar desde checkpoint si se interrumpe
```

**Checkpoint**:
- Archivo: `src/rit_state.json`
- Guarda último RIT procesado
- Permite reanudar si se interrumpe

**Configuración**:
- CSV de entrada: `causa.csv`
- Directorio de salida: `src/outputs/`
- Pausa entre causas: 5 segundos (respetando límite de 200 búsquedas)

---

## 🔧 Motor Único: `processCausa`

**Todos los casos de uso usan el mismo motor**:

**Archivo**: `src/process-causas.js`

**Función principal**: `processCausa(page, context, config, outputDir)`

**Ventajas**:
- ✅ Consistencia: Todos los flujos usan la misma lógica
- ✅ Mantenibilidad: Un solo lugar para arreglar bugs
- ✅ Testing: Más fácil testear el motor una vez
- ✅ Documentación: Estándar claro de cómo hacer scraping

**Ver documentación completa**: `docs/scraping-standard.md`

---

## 📊 Resumen de Archivos

| Caso de Uso | Archivo Principal | Uso | Estado |
|------------|-------------------|-----|--------|
| **1. Continuo 24/7** | `src/worker-monitoreo-continuo.js` | `npm run scrape:monitoreo` | ✅ Listo |
| **2. Por Endpoint** | `src/api/scraper-service.js` | `POST /api/scraping/ejecutar` | ✅ Listo |
| **3. Masivo (una vez)** | `src/scraping_masivo.js` | `npm run scrape:masivo` | ✅ Listo |
| **Motor único** | `src/process-causas.js` | Usado por todos | ✅ Motor |

---

## 🚀 Inicio Rápido

### Para monitoreo continuo 24/7:
```bash
npm run scrape:monitoreo
```

### Para scraping por endpoint:
```bash
# Iniciar servidor
npm run api:start

# Llamar endpoint (desde otro sistema o curl)
curl -X POST http://localhost:3000/api/scraping/ejecutar \
  -H "Content-Type: application/json" \
  -d '{"rit": "C-3030-2017", "competencia": "3", "corte": "90", "tribunal": "61", "tipoCausa": "C"}'
```

### Para scraping masivo (una vez):
```bash
npm run scrape:masivo
```

---

## 📝 Notas Importantes

1. **Todos los casos usan `processCausa`**: Esto garantiza consistencia y facilita mantenimiento.

2. **Configuración de BD**: Todos requieren variables de entorno:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`

3. **Límites de PJUD**: El sistema respeta límites de búsqueda (200 por día) con pausas entre causas.

4. **Checkpoints**: El scraping masivo guarda checkpoints para poder continuar si se interrumpe.

5. **Detección de movimientos nuevos**: El monitoreo continuo compara movimientos para detectar solo nuevos.

---

## 🔍 Verificación

Para verificar que solo estos 3 archivos hacen scraping (además del motor):

```bash
# Buscar violaciones (debería mostrar solo helpers del motor + tests/debug)
grep -r "fillForm|openDetalle|extractTable" src --include="*.js" | \
  grep -v "process-causas.js" | \
  grep -v "form.js" | \
  grep -v "table.js" | \
  grep -v "browser.js" | \
  grep -v "navigation.js" | \
  grep -v "test/" | \
  grep -v "debug"
```

Si hay resultados, son violaciones que deben ser adapters que llamen a `processCausa`.

---

## 📚 Documentación Relacionada

- `docs/scraping-standard.md` - Estándar de scraping (motor único)
- `ANALISIS_CASOS_USO_SCRAPING.md` - Análisis detallado de casos de uso
- `INFORME_SCRAPING_STANDARD.md` - Informe de implementación del estándar

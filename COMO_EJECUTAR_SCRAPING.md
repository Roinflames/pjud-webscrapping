# 🚀 Cómo Ejecutar el Scraping

## ⚠️ IMPORTANTE: Cambio de Nombre

El archivo **`src/process-csv-causas.js`** fue **renombrado** a **`src/process-causas.js`**.

**❌ NO funciona:**
```bash
node src/process-csv-causas.js 5
```

**✅ SÍ funciona:**
```bash
node src/process-causas.js 5
```

---

## 📋 Formas de Ejecutar el Scraping

### 1. **Scraping desde CSV (Batch)**
Procesa causas desde el archivo `causa.csv`:

```bash
# Procesar 5 causas
npm run scrape:batch

# O directamente
node src/process-causas.js 5
```

**Parámetros:**
- Sin parámetros: Procesa 5 causas por defecto
- Con número: `node src/process-causas.js 10` → Procesa 10 causas
- Lee desde: `causa.csv` en la raíz del proyecto

---

### 2. **Scraping Masivo (Una Vez)**
Procesa todas las causas del CSV una vez:

```bash
npm run scrape:masivo
```

**Características:**
- ✅ Guarda checkpoint para poder continuar si se interrumpe
- ✅ Pausa entre causas (5 segundos)
- ✅ Puede reanudarse desde donde quedó

---

### 3. **Scraping Continuo 24/7 (Monitoreo)**
Recorre causas activas periódicamente buscando movimientos nuevos:

```bash
# Con intervalo por defecto (1 hora)
npm run scrape:monitoreo

# Con intervalo personalizado (30 minutos)
node src/worker-monitoreo-continuo.js --interval 1800000

# Ejecutar una vez (para testing)
node src/worker-monitoreo-continuo.js --once
```

**Características:**
- ✅ Se ejecuta 24/7 sin parar
- ✅ Detecta solo movimientos nuevos
- ✅ Actualiza BD solo cuando hay cambios

---

### 4. **Scraping por Endpoint (API)**
Ejecuta scraping vía HTTP:

```bash
# Iniciar servidor API
npm run api:start

# Llamar endpoint
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

---

## 🔍 Verificar Archivos Disponibles

Para ver qué archivos de scraping existen:

```bash
ls -la src/process*.js
ls -la src/worker*.js
ls -la src/scraping*.js
```

**Archivos principales:**
- ✅ `src/process-causas.js` - Motor principal (antes `process-csv-causas.js`)
- ✅ `src/scraping_masivo.js` - Scraping masivo desde CSV
- ✅ `src/worker-monitoreo-continuo.js` - Monitoreo 24/7
- ✅ `src/worker_cola_scraping.js` - Worker de cola
- ✅ `src/worker-eventos.js` - Worker de eventos ERP

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Procesar 10 causas desde CSV
```bash
node src/process-causas.js 10
```

### Ejemplo 2: Scraping masivo completo
```bash
npm run scrape:masivo
```

### Ejemplo 3: Monitoreo continuo (cada 30 minutos)
```bash
node src/worker-monitoreo-continuo.js --interval 1800000
```

### Ejemplo 4: Probar monitoreo una vez
```bash
node src/worker-monitoreo-continuo.js --once
```

---

## ⚠️ Errores Comunes

### Error: "Cannot find module 'process-csv-causas.js'"
**Causa**: Estás usando el nombre antiguo del archivo.

**Solución**: Usa `process-causas.js` en lugar de `process-csv-causas.js`:
```bash
# ❌ Incorrecto
node src/process-csv-causas.js 5

# ✅ Correcto
node src/process-causas.js 5
```

### Error: "Access denied for user 'root'"
**Causa**: Credenciales de BD incorrectas o BD no está corriendo.

**Solución**: 
1. Verifica que Docker esté corriendo: `docker ps | grep pjud-mariadb-55`
2. Verifica tu `.env` tiene las credenciales correctas
3. Verifica el puerto (debería ser 3307, no 3306)

---

## 📚 Más Información

- Ver `CASOS_USO_SCRAPING.md` para los 3 casos de uso principales
- Ver `docs/scraping-standard.md` para el estándar de scraping
- Ver `package.json` para todos los scripts disponibles

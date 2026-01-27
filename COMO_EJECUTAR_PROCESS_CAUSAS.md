# 🚀 Cómo Ejecutar `process-causas.js`

## ⚠️ IMPORTANTE: El archivo fue renombrado

**Antes**: `src/process-csv-causas.js` ❌ (ya no existe)  
**Ahora**: `src/process-causas.js` ✅

---

## 📋 Formas de Ejecutar

### Opción 1: Comando Directo (Recomendado)

```bash
cd "/Users/diegomartinez/Documents/carpeta sin título/a"
PLAYWRIGHT_BROWSER=firefox node src/process-causas.js 5
```

**Explicación**:
- `PLAYWRIGHT_BROWSER=firefox` - Usa Firefox (más estable en macOS)
- `node src/process-causas.js` - Ejecuta el script
- `5` - Número de causas a procesar (puedes cambiarlo)

**Ejemplos**:
```bash
# Procesar 1 causa
PLAYWRIGHT_BROWSER=firefox node src/process-causas.js 1

# Procesar 10 causas
PLAYWRIGHT_BROWSER=firefox node src/process-causas.js 10

# Procesar 5 causas (por defecto si no especificas número)
PLAYWRIGHT_BROWSER=firefox node src/process-causas.js
```

---

### Opción 2: Usando npm (Más Fácil)

```bash
cd "/Users/diegomartinez/Documents/carpeta sin título/a"
npm run scrape:batch
```

**Nota**: Este comando procesa 5 causas por defecto. Si quieres cambiar el número, edita `package.json` o usa la Opción 1.

---

### Opción 3: Sin especificar navegador (usa el por defecto)

```bash
cd "/Users/diegomartinez/Documents/carpeta sin título/a"
node src/process-causas.js 5
```

---

## 🔧 Configuración del Navegador

El script puede usar diferentes navegadores:

```bash
# Firefox (recomendado para macOS)
PLAYWRIGHT_BROWSER=firefox node src/process-causas.js 5

# Chromium
PLAYWRIGHT_BROWSER=chromium node src/process-causas.js 5

# WebKit
PLAYWRIGHT_BROWSER=webkit node src/process-causas.js 5
```

---

## ❌ Errores Comunes

### Error: `Cannot find module 'process-csv-causas.js'`

**Causa**: Estás usando el nombre antiguo del archivo.

**Solución**: Usa `process-causas.js` en lugar de `process-csv-causas.js`:

```bash
# ❌ INCORRECTO
node src/process-csv-causas.js 5

# ✅ CORRECTO
node src/process-causas.js 5
```

---

## 📊 Parámetros

El script acepta un argumento opcional:

- **Número de causas**: `1`, `5`, `10`, etc.
  - Si no especificas, usa `5` por defecto
  - Ejemplo: `node src/process-causas.js 10`

---

## 📝 Ejemplo Completo

```bash
# 1. Ir al directorio del proyecto
cd "/Users/diegomartinez/Documents/carpeta sin título/a"

# 2. Ejecutar con Firefox, procesando 5 causas
PLAYWRIGHT_BROWSER=firefox node src/process-causas.js 5
```

---

## 🔗 Archivos Relacionados

- **Script principal**: `src/process-causas.js`
- **Documentación de errores**: `REPORTE_ERRORES_SCRAPING.md`
- **Guía de scraping**: `COMO_EJECUTAR_SCRAPING.md`

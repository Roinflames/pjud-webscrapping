# ❌ Error: Cannot find module 'process-csv-causas.js'

## 🔍 Problema

Estás intentando ejecutar:
```bash
node src/process-csv-causas.js 5
```

Pero ese archivo **ya no existe** porque fue **renombrado** durante la refactorización del Scraping Standard.

---

## ✅ Solución

### El archivo ahora se llama: `process-causas.js`

**Comando correcto:**
```bash
# Opción 1: Usando npm script (recomendado)
npm run scrape:batch

# Opción 2: Directamente con Node.js
node src/process-causas.js 5
```

---

## 📋 Cambios Realizados

### Antes (obsoleto):
- ❌ `src/process-csv-causas.js` - **YA NO EXISTE**

### Ahora (actual):
- ✅ `src/process-causas.js` - **ARCHIVO ACTUAL**

**Razón del cambio:**
- El nombre `process-csv-causas.js` era confuso porque el script no solo lee CSV, también puede leer desde BD
- Se renombró a `process-causas.js` para reflejar mejor su función: procesar causas (desde cualquier fuente)

---

## 🚀 Formas Correctas de Ejecutar

### 1. Procesar N causas desde CSV:
```bash
node src/process-causas.js 5    # Procesa 5 causas
node src/process-causas.js 10   # Procesa 10 causas
```

### 2. Usando npm script:
```bash
npm run scrape:batch            # Procesa 5 causas por defecto
```

### 3. Scraping masivo (todas las causas):
```bash
npm run scrape:masivo
```

### 4. Monitoreo continuo 24/7:
```bash
npm run scrape:monitoreo
```

---

## 🔍 Verificar Archivos Disponibles

Para ver qué archivos de scraping existen:

```bash
ls -la src/process*.js
```

**Deberías ver:**
- ✅ `src/process-causas.js` (el archivo correcto)
- ✅ `src/processRit.js` (shim de compatibilidad)

**NO deberías ver:**
- ❌ `src/process-csv-causas.js` (ya no existe)

---

## 📝 Resumen

| Comando Antiguo (❌ No funciona) | Comando Nuevo (✅ Funciona) |
|-----------------------------------|----------------------------|
| `node src/process-csv-causas.js 5` | `node src/process-causas.js 5` |
| `node src/process-csv-causas.js 10` | `node src/process-causas.js 10` |
| - | `npm run scrape:batch` |

---

## 🎯 Próximos Pasos

1. **Usa el nombre correcto**: `process-causas.js` en lugar de `process-csv-causas.js`
2. **O usa npm scripts**: `npm run scrape:batch` (más fácil)
3. **Consulta la documentación**: Ver `COMO_EJECUTAR_SCRAPING.md` para más opciones

---

## 📚 Documentación Relacionada

- `COMO_EJECUTAR_SCRAPING.md` - Guía completa de cómo ejecutar scraping
- `CASOS_USO_SCRAPING.md` - Los 3 casos de uso principales
- `docs/scraping-standard.md` - Estándar de scraping

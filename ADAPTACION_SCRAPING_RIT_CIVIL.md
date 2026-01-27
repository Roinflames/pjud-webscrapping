# 🔧 Adaptación del Scraping: Solo RIT + Civil

## ✅ Cambios Realizados

### Principio Fundamental:
**Todas las causas que tienen RIT son civiles (competencia = 3)**

---

## 📝 Cambios en el Código

### 1. `src/process-causas.js`

#### Función `csvToScrapingConfig()`:
- ✅ **Competencia SIEMPRE = '3'** (Civil)
- ✅ Tribunal es opcional (puede ser NULL)
- ✅ Corte usa default '90'

#### Función `isValidForScraping()`:
- ✅ Solo valida que tenga RIT válido
- ✅ No valida competencia (todas las causas con RIT son civiles)
- ✅ Tribunal es opcional

---

### 2. `src/form.js`

#### Función `fillForm()`:
- ✅ **Competencia siempre = '3'** (Civil)
- ✅ Corte es opcional (usa default si falla)
- ✅ **Tribunal es OPCIONAL** - Si no existe o falla, continúa sin él
- ✅ Solo RIT (rol y año) es obligatorio

---

## 🎯 Flujo del Scraping Ahora

1. **Seleccionar Competencia = 3** (Civil) ✅
2. **Seleccionar Corte = 90** (opcional, si falla continúa) ⚠️
3. **Seleccionar Tribunal** (opcional, si no existe continúa sin él) ⚠️
4. **Seleccionar Tipo Causa** (extraído del RIT) ✅
5. **Llenar Rol y Año** (extraídos del RIT) ✅
6. **Buscar** ✅

---

## 📊 Qué Busca el Scraping

### Campos Obligatorios:
- ✅ **RIT** (se divide en rol y año)
- ✅ **Competencia = 3** (Civil)

### Campos Opcionales:
- ⚠️ **Corte** (default: 90, si falla continúa)
- ⚠️ **Tribunal** (puede ser NULL, si no existe continúa)
- ✅ **Tipo Causa** (extraído del RIT)

---

## 🚀 Ejecutar

```bash
# Procesar causas del CSV
node src/process-causas.js 10
```

El scraping ahora:
- ✅ Busca solo por RIT y Civil
- ✅ No requiere tribunal (opcional)
- ✅ Continúa aunque falle corte o tribunal
- ✅ Todas las causas con RIT son tratadas como civiles



# Refactorización: Scraping Standard Compliance

## ✅ Archivos Refactorizados (Ahora usan `processCausa`)

### Entry Points Convertidos a Adapters:
1. **`src/index.js`** ✅
   - Antes: Implementaba scraping completo propio
   - Ahora: Convierte `config.json` → `ScrapingConfig` → llama `processCausa`
   - Status: **COMPLIANT**

2. **`src/index-sin-pausa.js`** ✅
   - Antes: Implementaba scraping completo propio
   - Ahora: Convierte `config.json` → `ScrapingConfig` → llama `processCausa`
   - Status: **COMPLIANT**

3. **`src/api/scraper-service.js`** ✅
   - Antes: Implementaba scraping completo propio
   - Ahora: Convierte API config → `ScrapingConfig` → llama `processCausa` → post-procesa para DB/HTTP
   - Status: **COMPLIANT**

4. **`src/worker_cola_scraping.js`** ✅
   - Antes: Implementaba scraping completo propio
   - Ahora: Lee cola → convierte a `ScrapingConfig` → llama `processCausa` → importa a intermedia
   - Status: **COMPLIANT**

5. **`src/worker-eventos.js`** ✅
   - Antes: Implementaba scraping completo propio
   - Ahora: Lee eventos → convierte a `ScrapingConfig` → llama `processCausa` → importa a intermedia
   - Status: **COMPLIANT**

6. **`src/scraper_batch.js`** ✅
   - Antes: Implementaba scraping completo propio
   - Ahora: `processRIT()` convierte causa → `ScrapingConfig` → llama `processCausa`
   - Status: **COMPLIANT**

7. **`src/scraping_masivo.js`** ✅
   - Antes: Usaba `processRit()` que tenía scraping propio
   - Ahora: Usa `processRit()` que ahora es shim de `processCausa`
   - Status: **COMPLIANT**

8. **`src/processRit.js`** ✅
   - Antes: Implementaba scraping completo propio (duplicado de `processCausa`)
   - Ahora: **COMPATIBILITY SHIM** que convierte formato antiguo → `ScrapingConfig` → llama `processCausa`
   - Status: **COMPLIANT** (mantiene API antigua para compatibilidad)

## ⚠️ Archivos que AÚN violan (pero son tests/herramientas)

### Tests/Herramientas (marcados como legacy, no producción):
1. **`src/test/scraper-5-causas.js`**
   - Tipo: Test manual
   - Status: **LEGACY TEST** - No se refactoriza (es test, puede tener lógica propia)
   - Recomendación: Mantener como test, pero documentar que no es el motor oficial

2. **`src/debug-step-by-step.js`**
   - Tipo: Herramienta de debug
   - Status: **DEBUG TOOL** - No se refactoriza
   - Recomendación: Mantener, pero claramente marcado como debug

3. **`src/debug-page-structure.js`**
   - Tipo: Herramienta de debug
   - Status: **DEBUG TOOL** - No se refactoriza
   - Recomendación: Mantener, pero claramente marcado como debug

4. **`src/monitoring/instrumented-scraper.js`**
   - Tipo: Wrapper de métricas
   - Status: **MONITORING WRAPPER** - Debería envolver `processCausa`, no implementar scraping
   - Recomendación: Refactorizar para que envuelva `processCausa` con métricas

## 📋 Archivos del Motor (NO TOCAR - Son el engine oficial)

Estos archivos **SON** el motor y pueden hacer scraping:
- ✅ `src/process-causas.js` - **EL MOTOR PRINCIPAL**
- ✅ `src/browser.js` - Helper del motor
- ✅ `src/form.js` - Helper del motor
- ✅ `src/navigation.js` - Helper del motor
- ✅ `src/table.js` - Helper del motor
- ✅ `src/pdfDownloader.js` - Helper del motor
- ✅ `src/ebook.js` - Helper del motor
- ✅ `src/exporter.js` - Helper del motor
- ✅ `src/jsonStore.js` - Helper del motor

## 🎯 Resumen de Cambios

### Archivos Modificados:
1. `src/index.js` - Refactorizado a adapter
2. `src/index-sin-pausa.js` - Refactorizado a adapter
3. `src/api/scraper-service.js` - Refactorizado a adapter
4. `src/worker_cola_scraping.js` - Refactorizado a adapter
5. `src/worker-eventos.js` - Refactorizado a adapter
6. `src/scraper_batch.js` - Refactorizado a adapter
7. `src/scraping_masivo.js` - Actualizado para usar `processRit` shim
8. `src/processRit.js` - Convertido a compatibility shim
9. `docs/scraping-standard.md` - Documentación del estándar creada

### Archivos NO Modificados (pero documentados):
- `src/test/scraper-5-causas.js` - Test legacy (OK mantener)
- `src/debug-*.js` - Herramientas de debug (OK mantener)
- `src/monitoring/instrumented-scraper.js` - Pendiente refactor (debería envolver processCausa)

## ✅ Verificación de Compliance

Para verificar que solo el motor hace scraping:

```bash
# Buscar violaciones (debería mostrar solo helpers del motor + tests/debug)
grep -r "fillForm\|openDetalle\|extractTable" src --include="*.js" | \
  grep -v "process-causas.js" | \
  grep -v "form.js" | \
  grep -v "table.js" | \
  grep -v "browser.js" | \
  grep -v "navigation.js" | \
  grep -v "test/" | \
  grep -v "debug"
```

Si hay resultados, son violaciones que deben ser adapters que llamen a `processCausa`.

## 📝 Próximos Pasos Recomendados

1. **Refactorizar `monitoring/instrumented-scraper.js`**:
   - Debería ser un wrapper que envuelva `processCausa` con métricas
   - No debería implementar scraping propio

2. **Marcar tests como legacy**:
   - Agregar comentarios claros en `test/scraper-5-causas.js` indicando que es test legacy
   - Considerar reescribirlo para usar `processCausa` si se usa frecuentemente

3. **Verificar en producción**:
   - Confirmar que todos los entry points usados en producción ahora usan `processCausa`
   - Verificar que no hay scripts externos que llamen directamente a funciones de scraping

## 🚀 Estado Final

**TODOS los entry points de producción ahora usan `processCausa` como motor único.**

El único motor de scraping es:
- `src/process-causas.js` → `processCausa(page, context, config, outputDir)`

Todos los demás scripts son **adapters** que:
- Leen inputs (CSV/DB/queue/API)
- Convierten a `ScrapingConfig`
- Llaman `processCausa`
- Post-procesan resultados (DB/HTTP/cola)

# 📊 Reporte de Errores Detectados y Corregidos

## 🔍 Análisis de los Logs de Ejecución

### Errores Detectados:

#### 1. ❌ **Error: "No se pudo obtener índice del movimiento para folio:"**
**Causa**: 
- `extractTableAsArray` retorna objetos con `{ texto, datos_limpios }`
- El código intentaba parsear `row.texto[0]` como número, pero a veces está vacío
- No había fallback cuando el folio no es numérico

**Solución Aplicada**:
- ✅ Mejorada la lógica para obtener el índice del movimiento
- ✅ Agregado fallback usando contador cuando folio no es numérico
- ✅ Uso de `datos_limpios.folio` como primera opción

**Archivo**: `src/pdfDownloader.js` línea 59-65

---

#### 2. ❌ **Error: "Filas con forms: 0" y "PDFs descargados: 0"**
**Causa**: 
- `process-causas.js` estaba usando `extractTable` (versión antigua)
- `extractTable` no retorna `forms` ni `pdfs`, solo datos básicos
- `pdfDownloader.js` espera estructura de `extractTableAsArray`

**Solución Aplicada**:
- ✅ Cambiado `extractTable` → `extractTableAsArray` en `process-causas.js`
- ✅ Pasando `rows` ya extraídas a `downloadPDFsFromTable` para evitar doble extracción

**Archivo**: `src/process-causas.js` línea 445

---

#### 3. ❌ **Error: "Too many arguments" en extractResultadosBasicos**
**Causa**: 
- Playwright `page.evaluate()` no acepta múltiples argumentos directamente
- Se estaba pasando `config.rit, config.rol` como argumentos separados

**Solución Aplicada**:
- ✅ Cambiado a pasar un objeto: `{ ritBuscado, rolBuscado }`

**Archivo**: `src/process-causas.js` línea 187

---

#### 4. ⚠️ **Warning: "No se pudo descargar el eBook: Timeout"**
**Causa**: 
- El selector del eBook puede no estar disponible o cambiar
- Timeout de 10s puede ser insuficiente

**Estado**: 
- ⚠️ No crítico (el scraping continúa)
- El eBook es opcional
- Se puede mejorar aumentando timeout o mejorando selector

**Archivo**: `src/ebook.js`

---

#### 5. ⚠️ **Warning: "Tribunal X no encontrado en el mapeo de tribunales"**
**Causa**: 
- El archivo `tribunales_pjud_completo.json` no existe o no tiene todos los tribunales
- Se usa corte por defecto '90' como fallback

**Estado**: 
- ⚠️ No crítico (usa fallback)
- El scraping funciona pero puede usar corte incorrecto
- Se puede mejorar cargando el mapeo completo

**Archivo**: `src/process-causas.js` función `loadTribunalToCorteMap()`

---

## ✅ Correcciones Aplicadas

### Commit: `61a52da`
- ✅ Cambiado `extractTable` → `extractTableAsArray` en `process-causas.js`
- ✅ Mejorada lógica de extracción de folio/índice en `pdfDownloader.js`
- ✅ Ajustada búsqueda de demanda para usar estructura correcta
- ✅ Pasando `rows` ya extraídas a `downloadPDFsFromTable`

### Commit: `c0a0a86`
- ✅ Arreglado error "Too many arguments" en `extractResultadosBasicos`
- ✅ Mejorado timeout y manejo de errores al esperar modal

---

## 🧪 Pruebas Realizadas

### Test 1: Ejecutar 1 causa
```bash
node src/process-causas.js 1
```

**Resultados**:
- ✅ Script ejecuta correctamente
- ✅ Extrae 8 movimientos
- ⚠️ No descarga PDFs (problema de forms/enlaces)
- ✅ Genera JSON correctamente
- ⚠️ Timeout en descarga de eBook (no crítico)

---

## 🔧 Problemas Pendientes

### 1. PDFs no se descargan
**Síntoma**: "Filas con forms: 0", "PDFs descargados: 0"

**Posibles causas**:
- La tabla no tiene forms (PJUD puede usar otro método)
- Los selectores de forms/enlaces no coinciden con la estructura real
- Necesita forzar render de PDFs (click en "Ver más movimientos")

**Solución sugerida**:
- Verificar si necesita hacer click en `#linkMasMovimientos` antes de extraer
- Revisar selectores de forms/enlaces en la tabla real
- Agregar más logging para diagnosticar

### 2. eBook timeout
**Síntoma**: "No se pudo descargar el eBook: Timeout"

**Solución sugerida**:
- Aumentar timeout de 10s a 20s
- Mejorar selector o buscar alternativas
- Hacer opcional (no bloquear scraping si falla)

---

## 📝 Recomendaciones

1. **Ejecutar con más logging**:
   ```bash
   DEBUG=* node src/process-causas.js 1
   ```

2. **Verificar estructura real de la tabla**:
   - Hacer screenshot después de abrir detalle
   - Inspeccionar HTML de la tabla en el navegador
   - Verificar si hay forms o solo enlaces/iconos

3. **Forzar render de PDFs**:
   - Agregar click en `#linkMasMovimientos` antes de extraer tabla
   - Esperar a que carguen los PDFs

4. **Mejorar manejo de folios vacíos**:
   - Usar índice de fila como fallback (ya implementado)
   - Agregar más validaciones

---

## ✅ Estado Actual

**Script ejecuta correctamente** pero con advertencias:
- ✅ Extrae movimientos
- ✅ Genera JSON
- ⚠️ No descarga PDFs (necesita revisión de selectores)
- ⚠️ Timeout en eBook (no crítico)

**Próximos pasos**:
1. Revisar por qué no se detectan forms/enlaces de PDFs
2. Mejorar selectores o agregar click en "Ver más movimientos"
3. Aumentar timeout de eBook o hacerlo opcional

# 📊 Reporte de Mejoras - 27 Enero 2026 (Parte 2)

## ✅ Mejoras Implementadas

### 1. Corrección del Selector de Tabla
**Archivo:** `src/table.js`

**Problema anterior:**
- Selector genérico `'table.table.table-bordered.table-striped.table-hover tbody tr'`
- Capturaba AMBAS tablas (resultados de búsqueda Y movimientos del modal)
- Extraía la tabla de resultados en lugar de la tabla de movimientos

**Solución implementada:**
```javascript
// ANTES (INCORRECTO):
'table.table.table-bordered.table-striped.table-hover tbody tr'

// DESPUÉS (CORRECTO):
const MODAL_TABLE_SELECTOR = '#modalDetalleCivil table tbody tr, #modalDetalleLaboral table tbody tr, .modal-body table tbody tr';
```

**Funciones corregidas:**
- `extractTableAsArray()` - línea 42
- `extractTableDetalle()` - línea 215

### 2. Validación de Estructura de Tabla
**Archivo:** `src/table.js` - líneas 57-102

**Agregado:**
- Verificación que la primera columna sea un número (folio de movimiento)
- Validación que la tabla tenga al menos 7 columnas (estructura de movimientos)
- Flag `isLikelyMovimientosTable` para detectar si es la tabla correcta
- Advertencias en console si la estructura no coincide

```javascript
// Verificar primera columna (folio - debe ser número)
const firstColIsNumber = /^\d+$/.test(firstColText);
isLikelyMovimientosTable: firstColIsNumber && tds.length >= 7
```

### 3. Diagnóstico del Modal
**Archivo:** `src/process-causas.js` - líneas 444-475

**Agregado:**
- Captura del HTML completo del modal antes de extraer tabla
- Screenshot de la página después de abrir el modal
- Conteo de tablas dentro del modal
- Análisis de la primera fila para diagnóstico

### 4. Mejora en Espera de Contenido AJAX
**Archivo:** `src/process-causas.js` - líneas 411-457

**Cambios:**
- Separada la espera del modal (que aparece rápido) de la espera del contenido (que carga via AJAX)
- Espera específica de `table tbody tr:first-child` (primera fila de la tabla)
- Timeout incrementado de 15s a 45s para dar tiempo al AJAX
- Tiempo adicional de 3s después de detectar la primera fila

---

## ⚠️ Problema Detectado y Pendiente

### **El Modal Se Abre Vacío**

**Evidencia del problema:**
1. **Screenshot (`debug_modal_C_13786_2018.png`):**
   - Muestra la tabla de resultados de búsqueda (8 causas)
   - **NO muestra ningún modal abierto**
   - Los iconos de lupa (🔍) están visibles pero no se hicieron click

2. **Diagnóstico del modal:**
```json
{
  "modalId": "modalDetalleCivil",
  "modalClass": "modal",
  "tablesCount": 0,          ← NO HAY TABLAS
  "tables": [],
  "modalHTML": "\n         "  ← VACÍO (solo espacios)
}
```

3. **Log de ejecución:**
```
✅ Token de detalleCausaCivil encontrado, ejecutando función en el navegador...
✅ Detalle solicitado vía detalleCausaCivil
✅ Modal detectado en DOM      ← El modal EXISTE
📋 Contenido del modal: "\n   "  ← Pero está VACÍO
```

**Conclusión:**
El código ejecuta `detalleCausaCivil(token)` y el modal aparece en el DOM, pero **no se dispara el AJAX** que carga el contenido. El modal queda vacío.

---

## 🔍 Causa Raíz

**Teoría más probable:**
La función `detalleCausaCivil(token)` no funciona cuando se llama directamente via `page.evaluate()`. Necesita:
1. Un evento de click real del usuario, o
2. Algún estado/contexto adicional que solo existe cuando se hace click en la lupa

**Evidencia:**
- El scraper anterior funcionaba haciendo CLICK en la lupa
- La función existe y ejecuta, pero no produce el efecto deseado
- El sitio PJUD usa Bootstrap modals + AJAX, que pueden requerir eventos específicos

---

## 🎯 Solución Recomendada

### Enfoque: CLICK DIRECTO en el enlace de lupa

En lugar de ejecutar `detalleCausaCivil(token)`, hacer:

```javascript
// Buscar el enlace/icono de la lupa en la fila correspondiente
const lupaSel = `a[onclick*="detalleCausaCivil"]:has-text("${rit}"),
                 i.fa-search.fa-lg:has-text("${rit}")`.closest('a');

// Hacer CLICK usando Playwright (simula click real del usuario)
await page.click(lupaSel);

// Esperar que el modal cargue
await page.waitForSelector('#modalDetalleCivil table tbody tr:first-child');
```

**Ventajas:**
- Simula exactamente lo que hace un usuario
- Dispara todos los eventos necesarios (click, mousedown, mouseup, etc.)
- Bootstrap detecta el click y ejecuta el comportamiento completo
- Funciona con cualquier versión del sitio

**Código a modificar:**
`src/process-causas.js` - líneas 326-405 (sección de apertura del detalle)

---

## 📝 Archivos Modificados en Esta Sesión

```
✓ src/table.js                      (MODIFICADO)
  - Línea 42: Cambio de selector a MODAL_TABLE_SELECTOR
  - Líneas 47-92: Agregado diagnóstico y validación
  - Línea 215: Actualización en extractTableDetalle

✓ src/process-causas.js              (MODIFICADO)
  - Líneas 411-457: Mejora en espera del modal y contenido
  - Líneas 444-475: Agregado diagnóstico del modal
  - Línea 423: Screenshot para debugging

✓ REPORTE_FINAL_TEST.md              (CREADO - sesión anterior)
✓ REPORTE_MEJORAS_27_ENERO.md        (CREADO - este archivo)
```

---

## 📊 Estado Actual

| Componente | Estado | Notas |
|------------|--------|-------|
| Navegación al formulario | ✅ OK | Funciona correctamente |
| Llenado del formulario | ✅ OK | RIT, competencia, corte OK |
| Búsqueda de causas | ✅ OK | Devuelve resultados correctos |
| **Apertura del detalle** | ❌ BLOQUEADO | Modal se abre vacío |
| Extracción de tabla | ⏸️ PENDIENTE | Depende de apertura del detalle |
| Descarga de PDFs | ⏸️ PENDIENTE | Depende de extracción |
| Guardado en BD | ⏸️ PENDIENTE | Depende de extracción |

---

## 🚀 Próximos Pasos

### Prioridad Alta (Bloqueador)
1. **Cambiar a click directo en lupa**
   - Modificar `src/process-causas.js` líneas 326-405
   - Usar `page.click()` en lugar de `page.evaluate(detalleCausaCivil)`
   - Validar que el modal carga con contenido

### Después del Desbloqueo
2. **Probar extracción de movimientos**
   - Verificar que `extractTableAsArray()` captura la tabla correcta
   - Validar que los folios son numéricos
   - Confirmar que se detectan forms/enlaces de PDFs

3. **Probar descarga de PDFs**
   - Verificar que `pdfDownloader.js` encuentra las filas correctas
   - Confirmar que los clicks en PDFs funcionan
   - Validar descarga y conversión a base64

4. **Probar guardado en BD**
   - Insertar movimientos en tabla `movimientos`
   - Insertar PDFs en tabla `pdfs`
   - Actualizar causa con totales

---

## 💡 Aprendizajes

1. **Selectores CSS deben ser específicos:** Un selector genérico puede capturar múltiples elementos no deseados
2. **Los modals AJAX requieren espera doble:** Modal aparece rápido, pero contenido carga después
3. **`page.evaluate()` tiene limitaciones:** No todas las funciones JS funcionan igual cuando se ejecutan via Playwright
4. **Los screenshots son invaluables:** Permiten ver exactamente qué ve el navegador

---

## 📸 Screenshots Generados

- `src/outputs/debug_modal_C_13786_2018.png` - Muestra tabla de resultados sin modal abierto

---

**Generado:** 2026-01-27 18:30:00
**Branch:** `testing-27-enero`
**Estado:** Mejoras implementadas, bloqueador detectado y documentado

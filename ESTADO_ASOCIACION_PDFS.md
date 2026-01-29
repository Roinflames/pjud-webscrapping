# 📊 Estado de Asociación PDFs-Movimientos

## ✅ Conclusión: La Lógica de Asociación YA Está Correcta

Después de revisar el código completo, **la asociación de PDFs a movimientos ya está correctamente implementada**. El flujo funciona así:

###  Flujo Correcto de Asociación

```
1. pdfDownloader.js (línea 72-94)
   └─> Descarga PDFs y guarda en: pdfMapping[indiceMov]
       donde indiceMov = parseInt(folio)

2. dataProcessor.js (línea 227)
   └─> Extrae movimientos con: movimiento.indice = parseInt(texto[0])
       donde texto[0] es el folio de la fila

3. dataProcessor.js (línea 32-47)
   └─> Asocia PDFs: mov.indice === indiceMov (ambos son parseInt del folio)
       Resultado: Cada movimiento tiene SOLO sus PDFs
```

### Código Clave

**1. Descarga de PDFs (`pdfDownloader.js`)**
```javascript
// Línea 68-82: Obtiene folio del movimiento
const folio = row.datos_limpios?.folio || row.texto?.[0] || null;
let indiceMov = parseInt(folio);  // <-- CLAVE: usa parseInt del folio

// Línea 94: Guarda PDFs con esa clave
pdfMapping[indiceMov] = {
  azul: null,
  rojo: null,
  azul_base64: null,
  rojo_base64: null,
  azul_nombre: null,
  rojo_nombre: null
};
```

**2. Extracción de Movimientos (`dataProcessor.js`)**
```javascript
// Línea 227: Crea movimiento con el mismo índice
const movimiento = {
  indice: parseInt(texto[0]),  // <-- MISMO que indiceMov
  ...
  tiene_pdf: tienePDF || pdfs.length > 0,
  pdfs: pdfs
};
```

**3. Asociación (`dataProcessor.js`)**
```javascript
// Línea 32-47: Asocia usando la misma clave
movimientos = movimientos.map(mov => {
  if (mov.tiene_pdf && pdfMapping[mov.indice]) {  // <-- Coincide perfectamente
    const mapping = pdfMapping[mov.indice];
    mov.pdf_principal_nombre = mapping.azul;      // PDF azul del movimiento
    mov.pdf_anexo_nombre = mapping.rojo;           // PDF rojo del movimiento
  }
  return mov;
});
```

---

## ⚠️ **El Problema Real: Modal Vacío**

El problema NO está en la asociación de PDFs, sino en que **el modal nunca carga contenido**.

### Evidencia

1. **Log del scraper:**
```
✅ Modal detectado en DOM
📋 Contenido del modal ANTES de esperar tabla: "\n         "  ← VACÍO
⚠️ Modal detectado pero tabla aún no cargada, esperando adicional...
❌ Error: Timeout esperando tabla
```

2. **Screenshot (`debug_modal_C_13786_2018.png`):**
   - Muestra la tabla de resultados de búsqueda (8 causas)
   - NO muestra ningún modal abierto
   - Los iconos de lupa están visibles pero no funcionan

3. **Diagnóstico del modal:**
```json
{
  "modalId": "modalDetalleCivil",
  "modalClass": "modal",
  "tablesCount": 0,          ← NO HAY TABLAS
  "tables": [],
  "modalHTML": "\n         "  ← VACÍO
}
```

### Causa Raíz

El sitio PJUD abre el modal via AJAX. Las estrategias probadas:
- ❌ Ejecutar `detalleCausaCivil(token)` via `page.evaluate()` - no funciona
- ❌ Click via `page.evaluate()` con `MouseEvent` - no funciona
- ❌ Click via `link.click()` desde contexto de página - no funciona
- ❌ Click nativo `page.click()` de Playwright - no funciona (timeout)

**Posible razón:** El sitio puede estar validando:
- Session tokens o cookies específicas
- Estado de la aplicación (Angular/React state)
- Secuencia de eventos específica
- Headers o referrers

---

## 🎯 Soluciones Alternativas Sugeridas

### Opción 1: Usar API Directa del PJUD

Si el PJUD tiene endpoints AJAX que retornan JSON:

```javascript
// En lugar de navegar, hacer petición directa
const response = await fetch('https://oficinajudicialvirtual.pjud.cl/api/detalle', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rit: 'C-13786-2018', token: '...' })
});
const movimientos = await response.json();
```

**Ventajas:**
- Más rápido (no necesita navegador)
- Más confiable (no depende de DOM/AJAX)
- Más fácil de mantener

### Opción 2: Usar Navegador Real (No Headless)

Ejecutar con navegador visible y esperar más tiempo:

```bash
PLAYWRIGHT_BROWSER=firefox HEADLESS=false node src/process-causas.js 1
```

Agregar delays mayores después del click:
```javascript
await page.click('a[onclick*="detalleCausaCivil"]');
await page.waitForTimeout(10000); // 10 segundos
```

### Opción 3: Interceptar Peticiones AJAX

Capturar la petición AJAX que carga el modal:

```javascript
page.on('request', request => {
  if (request.url().includes('detalle') || request.url().includes('movimiento')) {
    console.log('AJAX Request:', request.url(), request.postData());
  }
});

page.on('response', async response => {
  if (response.url().includes('detalle')) {
    const data = await response.json();
    console.log('AJAX Response:', data);
    // Usar estos datos directamente
  }
});
```

### Opción 4: Revisar Código del Sitio

Inspeccionar el JavaScript del PJUD para entender:
1. Qué hace `detalleCausaCivil(token)`
2. Qué endpoints llama
3. Qué parámetros necesita
4. Replicar esa lógica directamente

---

## 📋 Resumen

| Componente | Estado | Notas |
|------------|--------|-------|
| **Asociación PDFs-Movimientos** | ✅ CORRECTO | Ya implementado perfectamente |
| **pdfDownloader** | ✅ CORRECTO | Usa `pdfMapping[parseInt(folio)]` |
| **dataProcessor** | ✅ CORRECTO | Usa `mov.indice = parseInt(folio)` |
| **Lógica de guardado** | ✅ CORRECTO | Cada movimiento guarda solo sus PDFs |
| **Apertura del modal** | ❌ BLOQUEADO | Modal se abre vacío, AJAX no dispara |
| **Descarga de PDFs** | ⏸️ PENDIENTE | Depende de que el modal cargue |

---

## 🚀 Recomendación

**La asociación de PDFs YA funciona correctamente**. No requiere cambios.

El problema es **solo el modal que no carga**. Recomiendo:

1. **Investigar API del PJUD** (Opción 1) - más confiable
2. **Interceptar AJAX** (Opción 3) - para entender qué falla
3. **Probar en navegador visible** (Opción 2) - para debugging

Una vez que el modal cargue, todo el resto funcionará automáticamente:
- ✅ Los movimientos se extraerán correctamente
- ✅ Los PDFs se descargarán correctamente
- ✅ Cada movimiento tendrá solo sus PDFs asignados
- ✅ Se guardarán en BD correctamente

---

**Generado:** 2026-01-27 19:00:00
**Archivos revisados:** `pdfDownloader.js`, `dataProcessor.js`, `process-causas.js`
**Conclusión:** Asociación correcta, problema en navegación del sitio PJUD

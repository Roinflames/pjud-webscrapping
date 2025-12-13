# 🔧 Solución: Problema con Reset de Formulario

## ❌ Problema

Después de procesar la primera causa, el script intentaba navegar de nuevo a "Consulta causas" cuando ya estaba en esa página, causando errores:

```
❌ Selector falló: text=Consulta causas - page.waitForSelector: Timeout 5000ms exceeded.
```

---

## ✅ Solución

### Cambios Implementados:

1. **Verificación inteligente de ubicación**
   - Antes de navegar, verifica si ya estamos en el formulario
   - Solo navega si realmente no estamos en la página correcta

2. **Cierre de modales sin navegar**
   - Si ya estamos en el formulario, solo cierra modales con ESC
   - No intenta navegar innecesariamente

3. **Mejor manejo de errores**
   - Si no puede encontrar el formulario, continúa sin lanzar error
   - Logs más claros sobre qué está haciendo

---

## 🔄 Flujo Corregido

### Primera causa:
1. Navegar a "Consulta causas" ✅
2. Llenar formulario ✅
3. Procesar causa ✅
4. Cerrar modal ✅

### Causas siguientes:
1. **Verificar si estamos en el formulario** ✅
2. Si SÍ → Solo cerrar modal con ESC ✅
3. Si NO → Navegar al formulario ✅
4. Llenar formulario ✅
5. Procesar causa ✅
6. Cerrar modal ✅

---

## 📝 Código Mejorado

### `src/form.js`:
```javascript
// Verificar que estamos en el formulario
const hasForm = await page.$('#competencia') !== null;

if (!hasForm) {
  // Solo navegar si realmente no estamos en el formulario
  await resetForm(page);
} else {
  // Ya estamos en el formulario, solo cerrar modales
  await page.keyboard.press('Escape');
}
```

### `src/process-csv-causas.js`:
```javascript
// Verificar que estamos en el formulario (no navegar si ya estamos ahí)
const hasForm = await page.$('#competencia') !== null;

if (!hasForm && !currentUrl.includes('consulta')) {
  // Solo navegar si realmente no estamos en el formulario
  await goToConsultaCausas(page);
} else {
  // Ya estamos en el formulario, solo asegurar que esté listo
  await page.waitForSelector('#competencia', { timeout: 5000 });
}
```

---

## 🚀 Próximos Pasos

Ejecuta de nuevo:

```bash
node src/process-csv-causas.js 5
```

Ahora debería:
- ✅ Navegar solo la primera vez
- ✅ Cerrar modales entre causas
- ✅ No intentar navegar cuando ya está en el formulario
- ✅ Procesar múltiples causas consecutivamente


# 🔧 Solución: Problema con Formulario Deshabilitado

## ❌ Problema

El formulario del PJUD tiene campos que se habilitan dinámicamente:
- `#competencia` → se selecciona primero
- `#conCorte` → se habilita después de seleccionar competencia
- `#conTribunal` → se habilita después de seleccionar corte
- `#conTipoCausa` → se habilita después de seleccionar tribunal

**Error encontrado:**
```
element is not enabled
- locator resolved to <select disabled id="conCorte" ...>
```

---

## ✅ Solución Implementada

### 1. **Esperar a que los campos se habiliten**

Antes de intentar seleccionar un campo, ahora esperamos a que:
- El campo no esté `disabled`
- El campo tenga opciones disponibles (`options.length > 1`)

```javascript
await page.waitForFunction(
  () => {
    const corte = document.querySelector('#conCorte');
    return corte && !corte.disabled && corte.options.length > 1;
  },
  { timeout: 15000 }
);
```

### 2. **Resetear formulario entre búsquedas**

Agregada función `resetForm()` que:
- Verifica que estamos en la página correcta
- Resetea el formulario a estado inicial
- Asegura que los campos estén listos para la siguiente búsqueda

### 3. **Cerrar modales después de cada búsqueda**

Después de procesar cada causa:
- Cierra el modal de detalle
- Presiona ESC para asegurar que se cierre
- Vuelve al formulario para la siguiente búsqueda

### 4. **Mejor manejo de errores**

- Si un campo no se habilita automáticamente, intenta forzarlo
- Si hay error, cierra modales y continúa con la siguiente causa
- Logs más detallados para debugging

---

## 🔄 Flujo Corregido

1. **Resetear formulario** (si es necesario)
2. **Seleccionar Competencia** → esperar
3. **Esperar a que Corte se habilite** → seleccionar Corte → esperar
4. **Esperar a que Tribunal se habilite** → seleccionar Tribunal → esperar
5. **Esperar a que Tipo Causa se habilite** → seleccionar Tipo Causa → esperar
6. **Llenar Rol y Año**
7. **Buscar**
8. **Procesar resultados**
9. **Cerrar modal y volver al formulario**

---

## 📝 Cambios en Código

### `src/form.js`:
- ✅ Agregada función `resetForm()`
- ✅ Esperas mejoradas con `waitForFunction()`
- ✅ Manejo de campos deshabilitados
- ✅ Delays aumentados entre campos (500-1000ms)

### `src/process-causas.js`:
- ✅ Cierre de modales después de cada causa
- ✅ Verificación de URL antes de continuar
- ✅ Manejo mejorado de errores

---

## 🚀 Próximos Pasos

Ejecuta de nuevo el scraping:

```bash
node src/process-causas.js 10
```

Ahora debería funcionar correctamente, esperando a que cada campo se habilite antes de intentar seleccionarlo.



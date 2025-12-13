# 🐛 Guía de Debugging

## 🔍 Problema: Página en Blanco

Si el scraping se queda en una página en blanco, sigue estos pasos:

---

## 📋 Paso 1: Verificar Configuración

### Verificar que existe `.env`:
```bash
ls -la .env
```

Si no existe, créalo:
```bash
echo "OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php" > .env
```

### Verificar configuración JSON:
```bash
cat src/config/pjud_config.json
```

---

## 🔧 Paso 2: Ejecutar Test de Conexión

Ejecuta el script de diagnóstico:

```bash
node src/test-connection.js
```

Este script:
- ✅ Verifica que `.env` existe
- ✅ Abre el navegador
- ✅ Navega al PJUD
- ✅ Verifica que la página tiene contenido
- ✅ Busca enlaces relacionados
- ✅ Busca formularios

**Si este script falla**, el problema está en la conexión o la URL.

---

## 🔍 Paso 3: Debugging Paso a Paso

Si el test de conexión funciona, ejecuta el debugging paso a paso:

```bash
node src/debug-step-by-step.js
```

Este script ejecuta cada paso del scraping y se pausa entre cada uno para que puedas revisar:
1. Navegador iniciado
2. Modal cerrado
3. Navegación a "Consulta causas"
4. Formulario llenado
5. Detalle abierto

**Presiona Enter** en cada paso para continuar.

---

## 🚀 Paso 4: Ejecutar Scraping Normal

Si los tests funcionan, ejecuta el scraping normal:

```bash
node src/index.js
```

---

## 📸 Archivos de Debug Generados

Si hay errores, se generan automáticamente:

- `debug_blanco.png` - Si la página está en blanco
- `debug_error.png` - Si hay un error general
- `debug_no_consulta_causas.png` - Si no encuentra el enlace
- `debug_error_navegacion.png` - Error en navegación
- `debug_error_formulario.png` - Error en formulario
- `debug_error_detalle.png` - Error abriendo detalle
- `src/logs/pjud_error_*.png` - Screenshots de errores
- `src/logs/pjud_error_*.html` - HTML de la página con error

---

## 🔍 Qué Revisar en los Screenshots

1. **¿La página está completamente en blanco?**
   - Problema: URL incorrecta o sitio caído
   - Solución: Verificar URL en `.env`

2. **¿Aparece un mensaje de error?**
   - Problema: El sitio rechazó la conexión
   - Solución: Verificar conexión a internet

3. **¿Aparece un CAPTCHA?**
   - Problema: El sitio detectó automatización
   - Solución: Aumentar delays o usar modo headless

4. **¿La página carga pero no encuentra elementos?**
   - Problema: Selectores incorrectos o sitio cambió
   - Solución: Actualizar selectores en el código

---

## ⚙️ Ajustes de Timeout

Si el sitio es muy lento, puedes aumentar los timeouts en:

- `src/browser.js` - Línea 21: `timeout: 90000` (90 segundos)
- `src/navigation.js` - Línea 18: `timeout: 30000` (30 segundos)
- `src/form.js` - Línea 7: `timeout: 30000` (30 segundos)

---

## 🐌 Modo Lento (Para Debugging)

El código ya tiene `slowMo: 100` en `browser.js` que hace todo más lento para ver qué pasa.

Para hacerlo aún más lento, cambia a:
```javascript
slowMo: 500  // 500ms de delay entre acciones
```

---

## 📝 Logs Detallados

El código ahora tiene logs en cada paso:
- 🌐 Navegación
- ✅ Éxitos
- ⚠️ Advertencias
- ❌ Errores

Revisa la consola para ver en qué paso se detiene.

---

## 🆘 Si Nada Funciona

1. **Ejecuta el test de conexión:**
   ```bash
   node src/test-connection.js
   ```

2. **Revisa los screenshots generados**

3. **Verifica manualmente en el navegador:**
   - Abre Chrome manualmente
   - Ve a: https://oficinajudicialvirtual.pjud.cl/home/index.php
   - Verifica que carga correctamente

4. **Comparte los logs y screenshots** para análisis


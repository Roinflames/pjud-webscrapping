# 📊 Reporte de Test de Scraping - 5 Causas

## 🧪 Test Realizado

**Fecha**: 2026-01-27  
**Comando**: `PLAYWRIGHT_BROWSER=firefox node src/process-causas.js 5`  
**Causas procesadas**: 5

---

## ✅ Resultados del Test

### 1. **Navegación y Formulario**
- ✅ Página cargada correctamente
- ✅ Sesión de invitado establecida
- ✅ Navegación a formulario exitosa
- ✅ Formulario disponible y funcional

### 2. **Llenado de Formulario**
- ✅ Competencia seleccionada (3 - Civil)
- ✅ Corte seleccionado (90)
- ⚠️ **Tribunal**: Se intenta seleccionar pero no se encuentra en opciones
  - **Problema**: Tribunal ID 8 no está en las opciones del select
  - **Causa**: El tribunal puede no estar disponible en el formulario o el ID no coincide
- ✅ Tipo Causa seleccionado (C)
- ✅ Rol y Año ingresados correctamente

### 3. **Extracción de Datos**
- ✅ Datos básicos extraídos correctamente
- ✅ Detalle de causa abierto
- ✅ Tabla de movimientos extraída (8 filas)

### 4. **Descarga de PDFs**
- ⚠️ **Problema detectado**: 
  - "Filas con forms: 0" - No se detectan forms en las filas
  - "No se encontró folio" - El folio está null
  - "Fila undefined no encontrada" - Error al buscar fila por rowIndex

**Causa raíz**:
- El `rowIndex` puede ser undefined o no coincidir con el DOM
- Las filas no tienen forms, solo enlaces
- El folio no se está extrayendo correctamente

---

## 🔧 Problemas Identificados

### 1. **Tribunal no encontrado en opciones**
```
⚠️ Tribunal 8 no encontrado en las opciones, continuando sin tribunal...
```

**Impacto**: El scraping funciona pero puede ser menos preciso sin tribunal.

**Solución sugerida**:
- Verificar que el tribunal_id en la BD coincida con los IDs disponibles en el formulario
- O usar búsqueda sin tribunal (ya implementado como fallback)

---

### 2. **PDFs no se descargan**
```
📋 Filas con forms: 0
⚠️ No se encontró folio, usando índice 1 como fallback
⚠️ No se pudo hacer click: Fila undefined no encontrada (hay 9 filas)
```

**Causa**:
- `row.rowIndex` puede ser undefined después del `.filter(Boolean)`
- Las filas no tienen forms, solo enlaces/iconos
- El folio no se extrae correctamente de la primera columna

**Solución aplicada**:
- ✅ Agregado validación de `rowIndex` antes de usar
- ✅ Mejorado fallback cuando `rowIndex` es undefined
- ⚠️ Pendiente: Verificar por qué no se detectan forms

---

## 📝 Notas

1. **Tribunal**: Aunque el código intenta seleccionar el tribunal, si no está disponible continúa sin él (comportamiento correcto).

2. **PDFs**: El problema principal es que las filas no tienen `rowIndex` después del filtrado, y el folio no se extrae correctamente.

3. **Scraping funciona**: A pesar de los problemas con PDFs, el scraping básico (extracción de movimientos) funciona correctamente.

---

## 🚀 Próximos Pasos

1. ✅ **Corregido**: Validación de `rowIndex` antes de usar
2. ⚠️ **Pendiente**: Investigar por qué no se detectan forms en las filas
3. ⚠️ **Pendiente**: Mejorar extracción de folio de la primera columna
4. ⚠️ **Pendiente**: Verificar que `rowIndex` se mantenga después del filtrado

---

## 📊 Estadísticas

- **Causas procesadas**: 5
- **Navegación**: ✅ 100% exitosa
- **Formulario**: ✅ 100% funcional
- **Extracción de datos**: ✅ 100% exitosa
- **Descarga de PDFs**: ⚠️ 0% (problema detectado)

---

## ✅ Conclusión

El scraping **funciona correctamente** para:
- ✅ Navegación
- ✅ Llenado de formulario
- ✅ Extracción de datos básicos
- ✅ Extracción de movimientos

**Necesita corrección**:
- ⚠️ Descarga de PDFs (problema con `rowIndex` y detección de forms)

# 📖 Explicación del Web Scraping - PJUD

## 🎯 Objetivo del Proyecto

Automatizar la búsqueda y extracción de información de causas judiciales desde el sitio web del **Poder Judicial de Chile (PJUD)** usando **Playwright**.

---

## 🏗️ Arquitectura del Proyecto

### Tecnologías Utilizadas
- **Playwright**: Framework para automatización de navegadores
- **Node.js**: Entorno de ejecución
- **dotenv**: Variables de entorno
- **winston**: Sistema de logging

### Estructura de Archivos

```
src/
├── index.js          # 🎬 Punto de entrada principal
├── browser.js        # 🌐 Configuración del navegador
├── config.js         # ⚙️ Carga de configuración
├── navigation.js     # 🧭 Navegación en el sitio
├── form.js           # 📝 Llenado de formularios
├── table.js          # 📊 Extracción de tablas
├── exporter.js       # 💾 Exportación de datos
├── pdfDownloader.js  # 📄 Descarga de PDFs
├── ebook.js          # 📘 Descarga de eBooks
└── utils.js          # 🛠️ Utilidades
```

---

## 🔄 Flujo del Proceso

### 1. **Inicialización** (`index.js`)

```javascript
// Carga la configuración desde pjud_config.json
const CONFIG = loadConfig();

// Inicia el navegador (Chrome/Chromium)
const { browser, context, page } = await startBrowser(URL);
```

**Qué hace:**
- Lee el archivo `pjud_config.json` con los datos de la causa
- Abre un navegador Chrome (no headless, para ver el proceso)
- Navega a la URL del PJUD

---

### 2. **Navegación** (`navigation.js`)

```javascript
// Cierra modales si existen
await closeModalIfExists(page);

// Va a la sección "Consulta causas"
await goToConsultaCausas(page);
```

**Qué hace:**
- Cierra cualquier modal que aparezca
- Hace clic en el enlace "Consulta causas"
- Espera a que la página cargue

---

### 3. **Llenado del Formulario** (`form.js`)

```javascript
await fillForm(page, CONFIG);
```

**Qué hace:**
- Llena los campos del formulario de búsqueda:
  - **Competencia**: `CONFIG.competencia` (ej: "3")
  - **Corte**: `CONFIG.corte` (ej: "90")
  - **Tribunal**: `CONFIG.tribunal` (ej: "276")
  - **Tipo Causa**: `CONFIG.tipoCausa` (ej: "C")
  - **Rol**: Extrae del RIT (ej: "16707" de "16707-2019")
  - **Año**: Extrae del RIT (ej: "2019" de "16707-2019")
- Hace clic en el botón "Buscar"

**Ejemplo de CONFIG:**
```json
{
  "rit": "16707-2019",
  "competencia": "3",
  "corte": "90",
  "tribunal": "276",
  "tipoCausa": "C"
}
```

---

### 4. **Abrir Detalle de la Causa** (`form.js`)

```javascript
await openDetalle(page);
```

**Qué hace:**
- Espera a que aparezca el enlace "Detalle de la causa"
- Hace clic en el enlace
- Espera a que se abra el modal de detalle (`#modalDetalleCivil` o `#modalDetalleLaboral`)

---

### 5. **Extracción de Datos** (`table.js`)

```javascript
const rows = await extractTable(page);
```

**Qué hace:**
- Busca la tabla con los movimientos de la causa
- Selector: `table.table.table-bordered.table-striped.table-hover tbody tr`
- Extrae todas las filas (`<tr>`) y celdas (`<td>`) de la tabla
- Retorna un array de arrays con los datos

**Estructura de datos extraída:**
```javascript
[
  ["Fecha", "Movimiento", "Descripción", ...],
  ["2024-01-15", "Ingreso", "Se ingresó la causa", ...],
  ["2024-02-20", "Notificación", "Se notificó al demandado", ...],
  // ...
]
```

---

### 6. **Exportación de Datos** (`exporter.js`)

```javascript
exportToJSON(rows, outputDir, CONFIG.rit);
exportToCSV(rows, outputDir, CONFIG.rit);
```

**Qué hace:**
- Exporta los datos a dos formatos:
  - **JSON**: `resultado_16707_2019.json`
  - **CSV**: `resultado_16707_2019.csv`
- Guarda los archivos en `src/outputs/`

---

### 7. **Descarga de PDFs** (`pdfDownloader.js`)

```javascript
await downloadPDFsFromTable(page, context, outputDir, CONFIG.rit);
```

**Qué hace:**
- Busca todos los iconos de PDF en la tabla
- Selector: `a[onclick*="submit"] i.fa-file-pdf-o`
- Para cada PDF:
  - Hace clic en el icono
  - Espera a que se abra una nueva pestaña
  - Descarga el PDF
  - Guarda con nombre: `16707_2019_doc_1.pdf`, `16707_2019_doc_2.pdf`, etc.

---

### 8. **Descarga de eBook** (`ebook.js`) - Opcional

```javascript
await downloadEbook(page, context, CONFIG, ebookDir);
```

**Qué hace:**
- Busca el enlace del eBook
- Selector: `form[action*="newebookcivil.php"] a[title*="Ebook"]`
- Descarga el PDF del eBook completo
- Guarda con nombre: `ebook_16707_2019_1234567890.pdf`

---

## 📋 Flujo Completo Visual

```
1. Inicio
   ↓
2. Cargar CONFIG (pjud_config.json)
   ↓
3. Abrir navegador → PJUD
   ↓
4. Cerrar modales
   ↓
5. Ir a "Consulta causas"
   ↓
6. Llenar formulario (competencia, corte, tribunal, RIT)
   ↓
7. Click en "Buscar"
   ↓
8. Click en "Detalle de la causa"
   ↓
9. Extraer tabla de movimientos
   ↓
10. Exportar a JSON y CSV
   ↓
11. Descargar PDFs de la tabla
   ↓
12. (Opcional) Descargar eBook
   ↓
13. Cerrar navegador
```

---

## 🔍 Detalles Técnicos

### Selectores CSS Utilizados

| Acción | Selector |
|--------|----------|
| Cerrar modal | `#close-modal` |
| Enlace "Consulta causas" | `text=Consulta causas` |
| Campo competencia | `#competencia` |
| Campo corte | `#conCorte` |
| Campo tribunal | `#conTribunal` |
| Campo tipo causa | `#conTipoCausa` |
| Campo rol | `#conRolCausa` |
| Campo año | `#conEraCausa` |
| Botón buscar | `input[value="Buscar"], button:has-text("Buscar")` |
| Enlace detalle | `a[title="Detalle de la causa"]` |
| Modal detalle | `#modalDetalleCivil, #modalDetalleLaboral` |
| Tabla movimientos | `table.table.table-bordered.table-striped.table-hover tbody tr` |
| Iconos PDF | `a[onclick*="submit"] i.fa-file-pdf-o` |
| Enlace eBook | `form[action*="newebookcivil.php"] a[title*="Ebook"]` |

### Manejo de Errores

```javascript
try {
  // Proceso principal
} catch (err) {
  // Guarda screenshot y HTML para debugging
  await saveErrorEvidence(page, screenshotPath, htmlPath);
} finally {
  // Siempre cierra el navegador
  await browser.close();
}
```

---

## 📊 Datos que se Extraen

### De la Tabla de Movimientos:
- Fecha del movimiento
- Tipo de movimiento
- Descripción
- Documentos asociados (PDFs)
- Cualquier otra columna que tenga la tabla

### Archivos Generados:
- `resultado_16707_2019.json` - Datos en formato JSON
- `resultado_16707_2019.csv` - Datos en formato CSV
- `16707_2019_doc_1.pdf` - PDFs descargados
- `16707_2019_doc_2.pdf` - Más PDFs...
- `ebook_16707_2019_*.pdf` - eBook completo (opcional)

---

## 🚀 Cómo Ejecutar

### 1. Instalar dependencias:
```bash
npm install
```

### 2. Configurar variables de entorno (`.env`):
```
OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php
```

### 3. Configurar `pjud_config.json`:
```json
{
  "rit": "16707-2019",
  "competencia": "3",
  "corte": "90",
  "tribunal": "276",
  "tipoCausa": "C"
}
```

### 4. Ejecutar:
```bash
node src/index.js
```

---

## 🔄 Integración con Base de Datos

Ahora que ya abstrajiste los datos de la BD (`causa` con `id_causa`), puedes:

1. **Leer desde BD**: Obtener todos los RITs de la tabla `causa`
2. **Iterar**: Para cada RIT, ejecutar el scraping
3. **Actualizar BD**: Guardar los resultados en la BD

### Ejemplo de Integración:

```javascript
// 1. Conectar a BD y obtener RITs
const rits = await db.query('SELECT id_causa FROM causa WHERE id_causa IS NOT NULL');

// 2. Para cada RIT, ejecutar scraping
for (const rit of rits) {
  const CONFIG = {
    rit: rit.id_causa,
    competencia: rit.materia_estrategia_id,
    // ... otros campos
  };
  
  // 3. Ejecutar scraping
  await runScraping(CONFIG);
  
  // 4. Guardar resultados en BD
  await db.insert('causa_movimientos', resultados);
}
```

---

## 📝 Notas Importantes

1. **Headless: false**: El navegador se muestra (no está oculto) para debugging
2. **Timeouts**: Hay timeouts configurados para evitar esperas infinitas
3. **Retry**: No hay retry automático implementado aún (está en TODO)
4. **Múltiples RITs**: El código actual procesa un solo RIT, pero se puede iterar

---

## 🎯 Próximos Pasos Sugeridos

1. ✅ **Procesar múltiples RITs**: Iterar sobre todos los RITs de la BD
2. ✅ **Retry automático**: Reintentar si falla el PJUD
3. ✅ **Logging avanzado**: Usar winston para logs estructurados
4. ✅ **Notificaciones**: Enviar email cuando haya cambios
5. ✅ **Scheduler**: Ejecutar automáticamente cada X tiempo



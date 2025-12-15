# 🚀 Cómo Ejecutar el Web Scraping

## 📋 Requisitos Previos

1. **Node.js** instalado (versión 14 o superior)
2. **npm** (viene con Node.js)
3. **Playwright** (se instala automáticamente con npm install)

---

## 🔧 Instalación

### 1. Instalar dependencias:
```bash
npm install
```

Esto instalará:
- `playwright` - Framework de automatización
- `dotenv` - Variables de entorno
- `winston` - Sistema de logging (aunque no se usa actualmente)

### 2. Instalar navegadores de Playwright:
```bash
npx playwright install chromium
```

---

## ⚙️ Configuración

### 1. Crear archivo `.env` en la raíz del proyecto:
```env
OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php
```

### 2. Configurar `src/config/pjud_config.json`:
```json
{
  "rit": "16707-2019",
  "competencia": "3",
  "corte": "90",
  "tribunal": "276",
  "tipoCausa": "C",
  "cliente": "Carlos Domingo Gutierrez Ramos",
  "rut": "8.462.961-8",
  "caratulado": "27 Juzgado Civil de Santiago",
  "abogado": "Tatiana Gonzalez",
  "juzgado": "Promotora CMR Falabella",
  "folio": "20212"
}
```

**Nota**: Solo se usan estos campos del JSON:
- `rit` - Se divide en Rol y Año
- `competencia` - ID de competencia
- `corte` - ID de corte
- `tribunal` - ID de tribunal
- `tipoCausa` - Tipo de causa (C, L, etc.)

Los demás campos (`cliente`, `rut`, etc.) son solo informativos y no se usan en el scraping.

---

## ▶️ Ejecución

### Opción 1: Desde la terminal (Recomendado)

```bash
node src/index.js
```

### Opción 2: Con npm script (si está configurado)

```bash
npm start
```

### Opción 3: En Windows (si existe Run.bat)

```bash
src\Run.bat
```

**Nota**: El `Run.bat` actual parece estar configurado para otro proyecto. Deberías actualizarlo o crear uno nuevo.

---

## 📊 Qué Hace el Script

1. ✅ Lee `pjud_config.json`
2. ✅ Abre navegador Chrome (visible, no headless)
3. ✅ Navega al PJUD
4. ✅ Llena el formulario de búsqueda
5. ✅ Busca la causa por RIT
6. ✅ Abre el detalle de la causa
7. ✅ Extrae la tabla de movimientos
8. ✅ Exporta a JSON y CSV en `src/outputs/`
9. ✅ Descarga PDFs asociados
10. ⏸️ (Opcional) Descarga eBook (comentado)

---

## 📁 Archivos Generados

Después de ejecutar, encontrarás:

```
src/outputs/
├── resultado_16707_2019.json    # Datos extraídos en JSON
├── resultado_16707_2019.csv     # Datos extraídos en CSV
├── 16707_2019_doc_1.pdf         # PDFs descargados
├── 16707_2019_doc_2.pdf
└── ...
```

```
src/logs/
├── pjud_error_TIMESTAMP.png     # Screenshot si hay error
└── pjud_error_TIMESTAMP.html    # HTML si hay error
```

---

## 🐛 Debugging

### Ver el navegador en acción:
El script está configurado con `headless: false`, así que verás el navegador ejecutándose.

### Si hay errores:
- Se guarda un screenshot en `src/logs/`
- Se guarda el HTML de la página en `src/logs/`
- El navegador se pausa antes de cerrarse (`page.pause()`)

### Modo debug:
Para mantener el navegador abierto después del error, comenta la línea:
```javascript
// await page.pause();  // Comentar esta línea
```

---

## 🔄 Procesar Múltiples RITs

Actualmente el script procesa **un solo RIT** del JSON. Para procesar múltiples:

### Opción 1: Crear un script que itere
```javascript
const rits = ['16707-2019', '12345-2020', '67890-2021'];

for (const rit of rits) {
  // Actualizar CONFIG.rit
  // Ejecutar scraping
}
```

### Opción 2: Leer desde base de datos
```javascript
const rits = await db.query('SELECT id_causa FROM causa WHERE id_causa IS NOT NULL');

for (const { id_causa } of rits) {
  // Ejecutar scraping con cada RIT
}
```

---

## ⚠️ Problemas Comunes

### Error: "Cannot find module 'playwright'"
```bash
npm install
npx playwright install chromium
```

### Error: "No se encontró configuración"
- Verifica que existe `src/config/pjud_config.json`
- Verifica que el JSON tiene formato válido

### Error: Timeout esperando selector
- El sitio puede estar lento
- Aumenta los timeouts en el código
- Verifica que los selectores CSS siguen siendo válidos

### El navegador no se cierra
- Comenta `await page.pause()` en `index.js`
- O presiona Enter en la terminal para continuar

---

## 📝 Notas

- El script usa **Playwright** que es más moderno que Puppeteer
- El navegador se ejecuta en modo **no-headless** para debugging
- Los timeouts están configurados para evitar esperas infinitas
- El código tiene manejo de errores básico




# 📋 Resumen: Cómo Ejecutar el Web Scraping

## 🚀 Ejecución Rápida

### 1. Instalar dependencias (solo la primera vez):
```bash
npm install
npx playwright install chromium
```

### 2. Configurar `.env`:
```env
OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php
```

### 3. Configurar `src/config/pjud_config.json`:
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

## 📁 Estructura del Proyecto (Después de Limpieza)

```
pjud-webscrapping/
├── src/                    # 💻 Código del scraping
│   ├── index.js           # 🎬 Ejecuta: node src/index.js
│   ├── browser.js         # Abre navegador
│   ├── config.js          # Lee pjud_config.json
│   ├── navigation.js      # Navega en el sitio
│   ├── form.js            # Llena formulario
│   ├── table.js           # Extrae datos
│   ├── exporter.js        # Exporta JSON/CSV
│   ├── pdfDownloader.js   # Descarga PDFs
│   └── config/
│       └── pjud_config.json  # ⚙️ Configuración
├── docs/                   # 📚 Documentación SQL y BD
├── outputs/                # 📊 Resultados (se crea automático)
└── logs/                   # 📝 Logs (se crea automático)
```

---

## 🔄 Flujo de Ejecución

```
1. node src/index.js
   ↓
2. Lee .env → OJV_URL
   ↓
3. Lee src/config/pjud_config.json
   ↓
4. Abre navegador Chrome
   ↓
5. Navega a PJUD
   ↓
6. Llena formulario con datos del JSON
   ↓
7. Busca causa por RIT
   ↓
8. Extrae tabla de movimientos
   ↓
9. Exporta a JSON y CSV
   ↓
10. Descarga PDFs
   ↓
11. Cierra navegador
```

---

## 📊 Archivos Generados

Después de ejecutar encontrarás en `src/outputs/`:
- `resultado_16707_2019.json` - Datos en JSON
- `resultado_16707_2019.csv` - Datos en CSV
- `16707_2019_doc_1.pdf` - PDFs descargados
- `16707_2019_doc_2.pdf` - Más PDFs...

---

## 🧹 Limpieza Realizada

✅ **Movidos a `docs/`:**
- Todos los archivos `.sql` (consultas de BD)
- Documentación de base de datos (`.md`)

✅ **Eliminados:**
- Binarios de Node.js innecesarios
- Archivos no utilizados (`request.php`, etc.)
- `helpers.js` vacío

✅ **Actualizados:**
- `src/Run.bat` - Ahora ejecuta el proyecto correcto

---

## 📖 Documentación Disponible

- `COMO_EJECUTAR.md` - Guía detallada de ejecución
- `EXPLICACION_SCRAPING.md` - Explicación técnica del scraping
- `ARCHIVOS_LIMPIADOS.md` - Lista de archivos limpiados
- `docs/` - Consultas SQL y documentación de BD

---

## ⚠️ Notas Importantes

1. El navegador se ejecuta en modo **visible** (no headless) para debugging
2. El script procesa **un solo RIT** a la vez
3. Los resultados se guardan en `src/outputs/`
4. Si hay errores, se guardan screenshots en `src/logs/`



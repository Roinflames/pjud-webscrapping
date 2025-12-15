# 🧹 Archivos Limpiados del Proyecto

## ✅ Archivos Movidos a `docs/`

### SQL (Consultas de Base de Datos)
Todos los archivos `.sql` fueron movidos a `docs/sql/`:
- `analizar_campos_completos.sql`
- `buscar_con_tablas_disponibles.sql`
- `buscar_datos_completos.sql`
- `buscar_datos_json.sql`
- `buscar_datos_produccion.sql`
- `buscar_datos_reales.sql`
- `buscar_en_agenda.sql`
- `buscar_por_rut_folio.sql`
- `buscar_registros_parciales.sql`
- `buscar_sin_folio.sql`
- `buscar_sin_rol_anio.sql`
- `buscar_todas_relaciones_causa.sql`
- `codi_ejamtest.sql`
- `consultas_causa.sql`
- `consultas_tablas_reales.sql`
- `exportar_datos_limpios.sql`
- `exportar_todos_los_datos.sql`
- `limpiar_y_reimportar.sql`
- `solucion_importacion.sql`
- `ver_todas_tablas.sql`
- `verificar_estructura_causa.sql`
- `verificar_tablas.sql`

### Documentación de Base de Datos
- `CONSULTA_DATOS_CAUSA.md` → `docs/`
- `GUIA_BUSCAR_DATOS.md` → `docs/`
- `SOLUCION_TABLA_NO_EXISTE.md` → `docs/`

---

## 🗑️ Archivos Eliminados

### Binarios de Node.js (no deberían estar en el proyecto)
- `src/npm`
- `src/npm.cmd`
- `src/npx`
- `src/npx.cmd`
- `src/nodevars.bat`
- `src/node-v16.14.0-x64.msi`
- `src/node_etw_provider.man`

### Archivos no utilizados
- `request.php`
- `assets/request.json`
- `src/utils/helpers.js` (archivo vacío)

---

## 📝 Archivos Actualizados

### `src/Run.bat`
Actualizado para ejecutar el proyecto correcto:
```batch
@echo off
cd /d "%~dp0"
node index.js
pause
```

---

## 📁 Estructura Final del Proyecto

```
pjud-webscrapping/
├── docs/                    # 📚 Documentación y consultas SQL
│   ├── sql/                # Consultas SQL
│   └── *.md                # Documentación de BD
├── src/                    # 💻 Código fuente del scraping
│   ├── config/
│   │   └── pjud_config.json
│   ├── outputs/            # Resultados del scraping
│   ├── logs/               # Logs y errores
│   ├── assets/
│   │   ├── ebook/          # eBooks descargados
│   │   └── img/            # Imágenes de referencia
│   ├── old/                # Versiones antiguas (mantener por ahora)
│   ├── utils/
│   │   └── logger.js
│   ├── browser.js
│   ├── config.js
│   ├── ebook.js
│   ├── exporter.js
│   ├── form.js
│   ├── index.js           # 🎬 Punto de entrada
│   ├── navigation.js
│   ├── pdfDownloader.js
│   ├── table.js
│   └── utils.js
├── prompt/                 # Prompts de desarrollo
├── .env                    # Variables de entorno
├── package.json
├── package-lock.json
├── README.md
├── COMO_EJECUTAR.md        # 📖 Cómo ejecutar el proyecto
├── EXPLICACION_SCRAPING.md # 📖 Explicación del scraping
└── ARCHIVOS_LIMPIADOS.md   # Este archivo
```

---

## ✅ Archivos Esenciales del Scraping

### Archivos principales:
1. `src/index.js` - Punto de entrada
2. `src/browser.js` - Configuración del navegador
3. `src/config.js` - Carga de configuración
4. `src/navigation.js` - Navegación en el sitio
5. `src/form.js` - Llenado de formularios
6. `src/table.js` - Extracción de datos
7. `src/exporter.js` - Exportación de resultados
8. `src/pdfDownloader.js` - Descarga de PDFs
9. `src/ebook.js` - Descarga de eBook (opcional)
10. `src/utils.js` - Utilidades

### Archivos de configuración:
- `src/config/pjud_config.json` - Configuración de la causa
- `.env` - Variables de entorno

### Dependencias:
- `package.json` - Dependencias del proyecto
- `node_modules/` - Paquetes instalados

---

## 📌 Notas

- Los archivos en `src/old/` se mantienen por ahora (versiones antiguas)
- Los archivos SQL están en `docs/sql/` para referencia
- La documentación de BD está en `docs/` para referencia
- El proyecto ahora está más limpio y organizado




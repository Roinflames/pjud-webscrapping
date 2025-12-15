# ⚡ Optimización: Extracción de URLs de PDFs

## 🎯 Cambio Implementado

**Antes:** Se descargaban todos los PDFs (consumía mucho espacio y tiempo)

**Ahora:** Solo se extraen las URLs de los PDFs (optimización de recursos)

---

## 📋 Qué se Guarda Ahora

### Archivo generado: `pdf_urls_C_[RIT].json`

```json
[
  {
    "index": 1,
    "url": "https://oficinajudicialvirtual.pjud.cl/.../documento.pdf",
    "filename": "C_13786_2018_doc_1.pdf",
    "onclick": "submitForm(...)"
  },
  {
    "index": 2,
    "url": "https://oficinajudicialvirtual.pjud.cl/.../documento2.pdf",
    "filename": "C_13786_2018_doc_2.pdf",
    "onclick": "submitForm(...)"
  }
]
```

---

## ✅ Ventajas

1. **Ahorro de espacio**: No descarga archivos PDF grandes
2. **Velocidad**: Proceso mucho más rápido
3. **Flexibilidad**: Puedes descargar los PDFs después si los necesitas
4. **Recursos**: Menor consumo de ancho de banda y almacenamiento

---

## 📁 Archivos Generados por Causa

1. `resultado_C_[RIT].json` - Datos de la tabla (array)
2. `resultado_C_[RIT].csv` - Datos de la tabla (CSV)
3. `movimientos_C_[RIT].json` - Movimientos estructurados
4. **`pdf_urls_C_[RIT].json`** ⭐ NUEVO - URLs de los PDFs

---

## 🔄 Descargar PDFs Después (Opcional)

Si necesitas descargar los PDFs después, puedes usar las URLs guardadas:

```javascript
// Ejemplo de script para descargar PDFs desde URLs
const fs = require('fs');
const https = require('https');
const path = require('path');

const urlsData = JSON.parse(fs.readFileSync('pdf_urls_C_13786_2018.json', 'utf8'));

urlsData.forEach(item => {
  if (item.url) {
    // Descargar PDF usando la URL guardada
    // ... código de descarga ...
  }
});
```

---

## 📊 Estadísticas en el Log

Ahora verás:
```
📄 Se encontraron 20 PDFs.
✅ URL 1/20 extraída: https://oficinajudicialvirtual.pjud.cl/...
✅ URL 2/20 extraída: https://oficinajudicialvirtual.pjud.cl/...
...
📋 URLs guardadas en: pdf_urls_C_13786_2018.json
📊 Resumen URLs: 18 extraídas exitosamente, 2 fallidas
```

---

## 🚀 Ejecución

El comando sigue siendo el mismo:

```bash
node src/process-csv-causas.js 0
```

Ahora será mucho más rápido y eficiente! ⚡



# 🚀 Ejecutar Scraping con TODAS las Causas

## Modo Headless (Sin Vista)

El scraping ahora se ejecuta en **modo headless** (sin abrir ventana del navegador) para mayor velocidad y eficiencia.

---

## 📋 Comandos

### Procesar TODAS las causas:
```bash
node src/process-causas.js 0
```

### Procesar un número específico de causas:
```bash
node src/process-causas.js 100
```

---

## 📊 Resultados

### Archivos Generados:

1. **Log completo**: `src/logs/procesamiento_[timestamp].json`
   - Contiene TODOS los resultados (exitosos y fallidos)

2. **Causas fallidas**: `src/logs/causas_fallidas_[timestamp].json`
   - Contiene SOLO las causas que NO se pudieron buscar
   - También se guarda en: `src/outputs/causas_fallidas.json`

3. **Outputs por causa**:
   - JSON: `src/outputs/resultado_C_[RIT].json`
   - CSV: `src/outputs/resultado_C_[RIT].csv`
   - PDFs: `src/outputs/C_[RIT]_doc_N.pdf`

---

## 📝 Formato del JSON de Causas Fallidas

```json
[
  {
    "causa_id": 11,
    "agenda_id": 75152,
    "rit": "C-13786-2018",
    "caratulado": "PROMOTORA CMR FALABELLA S.A/YÁ",
    "cliente": "...",
    "rut": "...",
    "tribunal": "8",
    "success": false,
    "error": "Mensaje de error aquí"
  }
]
```

---

## ⚙️ Configuración

- **Modo**: Headless (sin vista)
- **Velocidad**: Optimizada para procesamiento masivo
- **Screenshots**: Deshabilitados en modo headless
- **Competencia**: Siempre Civil (3)
- **Tribunal**: Opcional (continúa sin él si no existe)

---

## 📈 Progreso

El script mostrará el progreso en la terminal:
```
[1/3221] Procesando causa ID: 11
[2/3221] Procesando causa ID: 17
...
```

Al finalizar mostrará un resumen:
```
📊 Resumen de procesamiento:
   ✅ Exitosas: 3000
   ❌ Fallidas: 221

❌ Causas fallidas guardadas en: src/outputs/causas_fallidas.json
```



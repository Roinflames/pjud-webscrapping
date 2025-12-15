# 🚀 Mejoras Implementadas en el Scraping

## ✅ Cambios Realizados

### 1. 📊 Progreso en Tiempo Real

Ahora el scraping muestra información detallada del progreso en la terminal:

```
============================================================
[150/3221] Progreso: 4.7%
⏱️  Tiempo estimado restante: 45.2 minutos
📋 Procesando causa ID: 123 | RIT: C-13786-2018
```

**Características:**
- Porcentaje de progreso actualizado
- Tiempo estimado restante calculado dinámicamente
- Resumen parcial cada 10 causas procesadas
- Información clara de cada causa siendo procesada

---

### 2. 🔄 Evitar Descargas Duplicadas de PDFs

El sistema ahora verifica si un PDF ya existe antes de descargarlo:

```
📄 Se encontraron 20 PDFs.
⏭️  PDF 1 ya existe, omitiendo: C_13786_2018_doc_1.pdf
⬇️ Descargando PDF 2/20...
✅ Guardado: C_13786_2018_doc_2.pdf
...
📊 Resumen PDFs: 15 descargados, 5 omitidos (ya existían)
```

**Beneficios:**
- Ahorra tiempo al no descargar PDFs duplicados
- Permite reanudar el scraping sin perder trabajo previo
- Muestra estadísticas claras de descargas vs omitidos

---

### 3. 📋 Abstracción de Movimientos del PJUD

Los movimientos ahora se extraen con estructura clara y se guardan en archivo separado:

**Archivo generado:** `movimientos_C_13786_2018.json`

**Estructura:**
```json
[
  {
    "rit": "C-13786-2018",
    "fecha": "09/05/2018",
    "caratulado": "ITAU CORPBANCA/HERNÁNDEZ",
    "juzgado": "4º Juzgado Civil de Santiago",
    "folio": "",
    "raw": ["", "C-13786-2018", "09/05/2018", "...", "..."]
  }
]
```

**Archivos generados por causa:**
1. `resultado_C_[RIT].json` - Formato array (compatibilidad)
2. `resultado_C_[RIT].csv` - CSV con datos
3. `movimientos_C_[RIT].json` - **NUEVO:** Movimientos estructurados
4. `C_[RIT]_doc_N.pdf` - PDFs descargados

---

## 📈 Mejoras en el Proceso

### Resumen Parcial Cada 10 Causas

```
📊 Resumen parcial (10/3221):
   ✅ Exitosas: 8 | ❌ Fallidas: 2
```

### Información Detallada por Causa

```
📋 Procesando causa: C-13786-2018
   Caratulado: PROMOTORA CMR FALABELLA S.A/YÁ
   ✅ Extraídas 29 movimientos
   📋 Movimientos estructurados guardados en: movimientos_C_13786_2018.json
   📊 Resumen PDFs: 15 descargados, 5 omitidos (ya existían)
```

---

## 🎯 Uso

### Ejecutar con todas las causas:
```bash
node src/process-csv-causas.js 0
```

### Ejecutar con límite:
```bash
node src/process-csv-causas.js 100
```

---

## 📁 Estructura de Archivos Generados

```
src/outputs/
├── resultado_C_[RIT].json          # Array de datos (formato original)
├── resultado_C_[RIT].csv           # CSV de datos
├── movimientos_C_[RIT].json        # Movimientos estructurados (NUEVO)
├── C_[RIT]_doc_N.pdf               # PDFs descargados
└── causas_fallidas.json            # Causas que fallaron (al finalizar)
```

---

## 🔍 Ventajas de las Mejoras

1. **Visibilidad**: Sabes exactamente cuánto falta y cuánto tiempo tomará
2. **Eficiencia**: No descargas PDFs duplicados, ahorras tiempo y ancho de banda
3. **Datos Estructurados**: Los movimientos del PJUD están claramente organizados para análisis posterior
4. **Reanudable**: Puedes detener y reanudar el scraping sin perder trabajo previo



# 🔄 Mapeo CSV → Base de Datos

## 📋 Estructura del CSV (`causa.csv`)

El CSV tiene las siguientes columnas:
- `causa_id` - ID de la causa
- `agenda_id` - ID de la agenda (relación con tabla agenda)
- `rit` - RIT completo (ej: "C-13786-2018")
- `caratulado` - Nombre del caratulado
- `competencia` - ID de competencia (materia_estrategia_id)
- `tribunal` - ID del tribunal (juzgado_cuenta_id)
- `cliente` - Nombre del cliente (puede ser NULL)
- `rut` - RUT del cliente (puede ser NULL)
- `abogado_id` - ID del abogado (puede ser NULL)
- `cuenta_id` - ID de la cuenta (puede ser NULL)

---

## 🗄️ Mapeo a Tablas de BD

### Tabla `causa`
```sql
causa.id              ← causa_id (del CSV)
causa.agenda_id       ← agenda_id (del CSV)
causa.id_causa         ← rit (del CSV) - RIT completo
causa.causa_nombre    ← caratulado (del CSV)
causa.materia_estrategia_id ← competencia (del CSV)
causa.juzgado_cuenta_id ← tribunal (del CSV)
```

### Tabla `agenda` (relación)
```sql
agenda.id             ← agenda_id (del CSV)
agenda.nombre_cliente ← cliente (del CSV, puede ser NULL)
agenda.rut_cliente    ← rut (del CSV, puede ser NULL)
agenda.abogado_id     ← abogado_id (del CSV, puede ser NULL)
agenda.cuenta_id      ← cuenta_id (del CSV, puede ser NULL)
```

---

## 🔍 Extracción de Datos del RIT

### Formato del RIT
El RIT viene en formato: `"C-13786-2018"`

### Extracción:
- **tipoCausa**: Primer parte antes del guión → `"C"`
- **rol**: Segunda parte → `"13786"`
- **año**: Tercera parte → `"2018"`

### Ejemplo:
```javascript
RIT: "C-13786-2018"
  → tipoCausa: "C"
  → rol: "13786"
  → año: "2018"
```

---

## 📊 Estadísticas del CSV

- **Total causas únicas**: 4,198
- **Con RIT**: 4,198 (100%)
- **Con Caratulado**: 4,029 (96%)
- **Con Competencia**: 4,198 (100%)
- **Con Tribunal**: 3,394 (81%)

---

## 🔄 Uso para Scraping

### Configuración para `pjud_config.json`:

```json
{
  "rit": "C-13786-2018",           // Del CSV: rit
  "competencia": "1",               // Del CSV: competencia
  "corte": "90",                    // Default (no está en CSV)
  "tribunal": "8",                  // Del CSV: tribunal
  "tipoCausa": "C",                 // Extraído de rit
  "caratulado": "PROMOTORA CMR...", // Del CSV: caratulado
  "cliente": null,                  // Del CSV: cliente (puede ser NULL)
  "rut": null,                      // Del CSV: rut (puede ser NULL)
  "abogado_id": null,               // Del CSV: abogado_id (puede ser NULL)
  "cuenta_id": null                 // Del CSV: cuenta_id (puede ser NULL)
}
```

---

## 🚀 Procesar Múltiples Causas

### Script creado: `src/process-causas.js`

```bash
# Procesar 5 causas (default)
node src/process-causas.js

# Procesar 10 causas
node src/process-causas.js 10

# Procesar 50 causas
node src/process-causas.js 50
```

**Qué hace:**
1. Lee el CSV `causa.csv`
2. Filtra causas válidas (con RIT, tribunal, competencia)
3. Para cada causa:
   - Llena el formulario con los datos del CSV
   - Busca la causa
   - Extrae la tabla de movimientos
   - Exporta a JSON/CSV
   - Descarga PDFs
4. Genera un log con los resultados

---

## 📝 Relaciones entre Tablas

```
causa (causa_id, agenda_id, id_causa, causa_nombre, ...)
  └── agenda (agenda_id, nombre_cliente, rut_cliente, abogado_id, cuenta_id)
      └── usuario (abogado_id) → nombre del abogado
      └── cuenta (cuenta_id) → nombre del juzgado/compañía
```

---

## ⚠️ Campos NULL en el CSV

Muchos campos pueden ser NULL:
- `cliente`: NULL en la mayoría
- `rut`: NULL en la mayoría
- `abogado_id`: NULL en la mayoría
- `cuenta_id`: NULL en algunos

**Para obtener estos datos**, necesitas hacer JOIN con la tabla `agenda`:

```sql
SELECT 
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.id_causa IS NOT NULL;
```

---

## 🔧 Scripts Disponibles

1. **`src/read-csv.js`** - Lee y analiza el CSV
2. **`src/process-causas.js`** - Procesa múltiples causas del CSV
3. **`src/index.js`** - Procesa una sola causa (desde pjud_config.json)



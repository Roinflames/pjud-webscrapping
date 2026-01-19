# Estructura de JSON Estructurado

Este documento describe la estructura de los archivos `movimientos_*.json` generados por el scraping.

## Formato del Archivo

```json
{
  "causa": {
    "rit": "C-3030-2017",
    "fecha_ingreso": "14/02/2017",
    "caratulado": "BANCO DE CHILE/CEA",
    "juzgado": "19º Juzgado Civil de Santiago"
  },
  "metadata": {
    "fecha_procesamiento": "2026-01-16T12:51:13.483Z",
    "total_movimientos": 20,
    "total_partes": 6,
    "tiene_documentos_pdf": true
  },
  "estado_actual": {
    "estado": "TERMINADA",
    "etapa": "TERMINADA",
    "descripcion": "Archivo del expediente en el Tribunal",
    "ultimo_movimiento": { ... },
    "fecha_ultimo_movimiento": "19/01/2022",
    "indice_ultimo_movimiento": 14
  },
  "movimientos": [...],
  "partes": [...]
}
```

## Sección: `causa`

Información general de la causa judicial.

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `rit` | String | RIT completo de la causa | `"C-3030-2017"` |
| `fecha_ingreso` | String | Fecha de ingreso de la causa | `"14/02/2017"` |
| `caratulado` | String | Caratulado de la causa | `"BANCO DE CHILE/CEA"` |
| `juzgado` | String | Nombre del juzgado | `"19º Juzgado Civil de Santiago"` |

## Sección: `metadata`

Metadatos del procesamiento.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fecha_procesamiento` | String (ISO) | Fecha/hora en que se procesaron los datos |
| `total_movimientos` | Number | Cantidad total de movimientos extraídos |
| `total_partes` | Number | Cantidad total de partes involucradas |
| `tiene_documentos_pdf` | Boolean | Indica si hay al menos un movimiento con PDF |

## Sección: `estado_actual`

Estado actual de la causa determinado automáticamente según los movimientos.

| Campo | Tipo | Descripción | Valores Posibles |
|-------|------|-------------|------------------|
| `estado` | String | Estado general de la causa | `TERMINADA`, `EN_TRAMITE`, `SUSPENDIDA`, `SIN_INFORMACION` |
| `etapa` | String | Etapa procesal actual | `TERMINADA`, `INGRESO`, `INICIO_TRAMITACION`, `NOTIFICACION`, `EXCEPCIONES`, `CONTESTACION_EXCEPCIONES`, `PROBATORIO`, `AUDIENCIA`, `DISCUSION`, `SENTENCIA`, `TRAMITACION`, `SUSPENDIDA` |
| `descripcion` | String | Descripción del estado actual | Texto descriptivo del estado |
| `ultimo_movimiento` | Object | Detalles del último movimiento | Objeto con `indice`, `tipo`, `descripcion`, `fecha`, `folio` |
| `fecha_ultimo_movimiento` | String | Fecha del último movimiento | Formato: DD/MM/YYYY |
| `indice_ultimo_movimiento` | Number | Índice del último movimiento | Número secuencial |

### Lógica de Determinación de Estado

El estado se determina analizando el último movimiento (más reciente por índice):

- **TERMINADA**: Si el tipo contiene "Terminada" o la descripción incluye "archivo del expediente", "archivada", "finalizada"
- **SUSPENDIDA**: Si el tipo o descripción indican suspensión
- **EN_TRAMITE**: Cualquier otro caso (por defecto)

### Ejemplo de `estado_actual`

```json
{
  "estado": "TERMINADA",
  "etapa": "TERMINADA",
  "descripcion": "Archivo del expediente en el Tribunal",
  "ultimo_movimiento": {
    "indice": 14,
    "tipo": "Terminada",
    "descripcion": "Archivo del expediente en el Tribunal",
    "fecha": "19/01/2022",
    "folio": "2"
  },
  "fecha_ultimo_movimiento": "19/01/2022",
  "indice_ultimo_movimiento": 14
}
```

## Sección: `movimientos`

Array de movimientos de la causa, ordenados por índice descendente (más recientes primero).

### Estructura de un Movimiento

```json
{
  "indice": 18,
  "tiene_pdf": true,
  "tipo_movimiento": "Contestación Excepciones",
  "subtipo_movimiento": "Resolución",
  "descripcion": "Archivo del expediente en el Tribunal",
  "fecha": "02/03/2018",
  "folio": "18",
  "observaciones": null
}
```

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `indice` | Number | Número secuencial del movimiento (1, 2, 3...) | `18` |
| `tiene_pdf` | Boolean | Si el movimiento tiene PDF asociado | `true` |
| `tipo_movimiento` | String | Tipo principal del movimiento | `"Contestación Excepciones"` |
| `subtipo_movimiento` | String | Subtipo o categoría del movimiento | `"Resolución"`, `"Escrito"`, `"Actuación Receptor"` |
| `descripcion` | String | Descripción detallada del movimiento | `"Archivo del expediente en el Tribunal"` |
| `fecha` | String | Fecha del movimiento (DD/MM/YYYY) | `"02/03/2018"` |
| `folio` | String | Número de folio del movimiento | `"18"` |
| `observaciones` | String/null | Observaciones adicionales | `null` |
| `pdf_path` | String/null | Nombre del archivo PDF asociado | `"C_3030_2017_doc_1.pdf"` o `null` |
| `pdf_ruta_completa` | String/null | Ruta relativa completa al PDF | `"outputs/C_3030_2017_doc_1.pdf"` o `null` |

### Tipos de Movimientos Comunes

- `"Ingreso"` - Ingreso de la demanda
- `"Inicio de la Tramitación"` - Inicio del proceso
- `"Notificación demanda y su proveído"` - Notificaciones
- `"Excepciones"` - Excepciones presentadas
- `"Contestación Excepciones"` - Contestación a excepciones
- `"Terminada"` - Causa terminada

### Subtipos de Movimientos

- `"Resolución"` - Resolución judicial
- `"Escrito"` - Escrito presentado
- `"Actuación Receptor"` - Actuación del receptor
- `"(CER)Certificacion"` - Certificación
- `null` - Sin subtipo específico

## Sección: `partes`

Array de partes involucradas en la causa (demandantes, demandados, abogados).

### Estructura de una Parte

```json
{
  "rol": "DTE.",
  "rut": "97004000-5",
  "tipo_persona": "JURIDICA",
  "nombre": "BANCO DE CHILE",
  "descripcion": null
}
```

| Campo | Tipo | Descripción | Valores Posibles |
|-------|------|-------------|------------------|
| `rol` | String | Rol de la parte en la causa | `"DDO."` (Demandado), `"DTE."` (Demandante), `"AB.DTE"` (Abogado Demandante), `"AB.DDO"` (Abogado Demandado) |
| `rut` | String | RUT de la parte | `"97004000-5"` |
| `tipo_persona` | String | Tipo de persona | `"NATURAL"`, `"JURIDICA"` |
| `nombre` | String | Nombre completo de la parte | `"BANCO DE CHILE"` |
| `descripcion` | String/null | Información adicional | `"(Poder Simple)"`, `null` |

## Uso para Importar a SQL

Los movimientos pueden importarse directamente a la tabla `movimientos` usando el script:

```bash
npm run importar:movimientos
```

O manualmente:

```bash
node src/importar_movimientos_sql.js
```

El script:
- ✅ Detecta duplicados por `rit` + `indice`
- ✅ Actualiza movimientos existentes
- ✅ Inserta movimientos nuevos
- ✅ Guarda datos raw en formato JSON

## Mapeo a Tabla SQL

| Campo JSON | Campo SQL | Tipo SQL |
|------------|-----------|----------|
| `causa.rit` | `rit` | VARCHAR(255) |
| `movimiento.indice` | `indice` | INT |
| `movimiento.fecha` | `fecha` | VARCHAR(255) |
| `causa.caratulado` | `caratulado` | TEXT |
| `causa.juzgado` | `juzgado` | VARCHAR(255) |
| `movimiento.folio` | `folio` | VARCHAR(255) |
| `movimiento.tipo_movimiento` | `tipo_movimiento` | VARCHAR(255) |
| `movimiento.subtipo_movimiento` | `subtipo_movimiento` | VARCHAR(255) |
| `movimiento.descripcion` | `descripcion` | TEXT |
| `movimiento.tiene_pdf` | `tiene_pdf` | BOOLEAN |
| `movimiento.raw_data` | `raw_data` | JSON |


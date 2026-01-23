# API REST - Documentación Completa

## Base URL
```
http://localhost:3000/api
```

## Autenticación
La mayoría de endpoints son públicos. Algunos endpoints de scraping requieren token (ver `storage/tokens.json`).

---

## 📋 Endpoints de Causas

### GET /api/causas
Lista todas las causas con paginación y filtros.

**Query Parameters:**
- `limit` (opcional): Número de resultados (default: 50, max: 500)
- `offset` (opcional): Offset para paginación (default: 0)
- `estado` (opcional): Filtrar por estado (`EN_TRAMITE`, `TERMINADA`)
- `tribunal` (opcional): Filtrar por tribunal
- `tiene_movimientos` (opcional): `true`/`false` - Solo causas con movimientos
- `tiene_pdfs` (opcional): `true`/`false` - Solo causas con PDFs

**Ejemplo con curl:**
```bash
# Listar primeras 50 causas
curl http://localhost:3000/api/causas

# Con filtros
curl "http://localhost:3000/api/causas?estado=EN_TRAMITE&limit=10&offset=0"

# Solo causas con movimientos
curl "http://localhost:3000/api/causas?tiene_movimientos=true"
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rit": "C-571-2018",
      "caratulado": "PROMOTORA CMR FALABELLA S.A/VALENZUELA",
      "tribunal_nombre": "Juzgado de Letras de Cañete",
      "estado": "EN_TRAMITE",
      "total_movimientos": 29,
      "total_pdfs": 38
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 5,
    "hasMore": false
  }
}
```

### GET /api/causas/:rit
Obtiene una causa específica por RIT.

**Ejemplo:**
```bash
curl http://localhost:3000/api/causas/C-571-2018
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rit": "C-571-2018",
    "caratulado": "PROMOTORA CMR FALABELLA S.A/VALENZUELA",
    "tribunal_nombre": "Juzgado de Letras de Cañete",
    "estado": "EN_TRAMITE",
    "etapa": "TRAMITACION",
    "fecha_ingreso": "2018-11-30",
    "total_movimientos": 29,
    "total_pdfs": 38
  }
}
```

### GET /api/causas/:rit/completa
Obtiene causa completa con movimientos y PDFs (incluye base64).

**Ejemplo:**
```bash
curl http://localhost:3000/api/causas/C-571-2018/completa
```

**Respuesta:** Incluye movimientos con PDFs en base64, cuadernos, y eBook.

### GET /api/causas/:rit/movimientos
Obtiene movimientos de una causa específica.

**Query Parameters:**
- `etapa` (opcional): Filtrar por etapa
- `tiene_pdf` (opcional): `true`/`false` - Solo movimientos con PDF
- `limit` (opcional): Número de resultados (default: 100)
- `offset` (opcional): Offset para paginación

**Ejemplo:**
```bash
curl "http://localhost:3000/api/causas/C-571-2018/movimientos?limit=10"
```

### GET /api/causas/:rit/pdfs
Obtiene lista de PDFs de una causa (solo metadata, sin base64).

**Ejemplo:**
```bash
curl http://localhost:3000/api/causas/C-571-2018/pdfs
```

### GET /api/causas/:rit/ebook
Obtiene metadata del eBook de una causa.

**Ejemplo:**
```bash
curl http://localhost:3000/api/causas/C-571-2018/ebook
```

---

## 📋 Endpoints de Movimientos

### GET /api/movimientos
Lista movimientos con filtros y paginación.

**Query Parameters:**
- `limit` (opcional): Número de resultados (default: 50, max: 500)
- `offset` (opcional): Offset para paginación
- `rit` (opcional): Filtrar por RIT de causa
- `etapa` (opcional): Filtrar por etapa
- `tiene_pdf` (opcional): `true`/`false` - Solo movimientos con PDF
- `fecha_desde` (opcional): Fecha desde (YYYY-MM-DD)
- `fecha_hasta` (opcional): Fecha hasta (YYYY-MM-DD)
- `cuaderno` (opcional): Filtrar por id_cuaderno

**Ejemplo:**
```bash
# Todos los movimientos
curl http://localhost:3000/api/movimientos

# Movimientos de una causa específica
curl "http://localhost:3000/api/movimientos?rit=C-571-2018"

# Movimientos con PDF en los últimos 30 días
curl "http://localhost:3000/api/movimientos?tiene_pdf=true&fecha_desde=2026-01-01"
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "causa_id": 1,
      "rit": "C-571-2018",
      "indice": 1,
      "folio": "1",
      "etapa": "Ingreso",
      "tramite": "Ingreso",
      "descripcion": "Ingreso de demanda",
      "fecha": "30/11/2018",
      "fecha_parsed": "2018-11-30",
      "tiene_pdf": 1,
      "id_cuaderno": "1",
      "cuaderno_nombre": "Principal"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 59,
    "hasMore": true
  }
}
```

### GET /api/movimientos/:id
Obtiene un movimiento específico por ID.

**Ejemplo:**
```bash
curl http://localhost:3000/api/movimientos/1
```

### GET /api/movimientos/:id/pdfs
Obtiene PDFs de un movimiento específico.

**Ejemplo:**
```bash
curl http://localhost:3000/api/movimientos/1/pdfs
```

---

## 📋 Endpoints de PDFs

### GET /api/pdfs
Lista PDFs con filtros.

**Query Parameters:**
- `limit` (opcional): Número de resultados (default: 50, max: 500)
- `offset` (opcional): Offset para paginación
- `rit` (opcional): Filtrar por RIT de causa
- `tipo` (opcional): Filtrar por tipo (`PRINCIPAL`, `ANEXO`)
- `movimiento_id` (opcional): Filtrar por movimiento

**Ejemplo:**
```bash
# Todos los PDFs
curl http://localhost:3000/api/pdfs

# PDFs de una causa
curl "http://localhost:3000/api/pdfs?rit=C-571-2018"

# Solo PDFs principales
curl "http://localhost:3000/api/pdfs?tipo=PRINCIPAL"
```

### GET /api/pdfs/:id/metadata
Obtiene metadata de un PDF (sin base64).

**Ejemplo:**
```bash
curl http://localhost:3000/api/pdfs/1/metadata
```

### GET /api/pdf/:id
Descarga un PDF como archivo binario.

**Ejemplo:**
```bash
curl -O http://localhost:3000/api/pdf/1
# o con nombre específico
curl -o documento.pdf http://localhost:3000/api/pdf/1
```

### GET /api/pdf/:id/base64
Obtiene un PDF en formato base64 (JSON).

**Ejemplo:**
```bash
curl http://localhost:3000/api/pdf/1/base64
```

---

## 📋 Endpoints de Dashboard

### GET /api/dashboard/estadisticas
Obtiene estadísticas relevantes para abogados.

**Ejemplo:**
```bash
curl http://localhost:3000/api/dashboard/estadisticas
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total_causas": 5,
    "causas_en_tramite": 2,
    "causas_terminadas": 1,
    "total_movimientos": 59,
    "movimientos_ultimos_7_dias": 0,
    "movimientos_ultimos_30_dias": 0,
    "causas_con_movimientos_nuevos": 0,
    "total_pdfs": 147,
    "pdfs_pendientes_descarga": 57,
    "causas_sin_scraping": 5,
    "ultimo_scraping": "2026-01-23T02:10:42.000Z"
  }
}
```

### GET /api/dashboard/movimientos-nuevos
Obtiene causas con movimientos nuevos.

**Ejemplo:**
```bash
curl http://localhost:3000/api/dashboard/movimientos-nuevos
```

### POST /api/dashboard/verificar-movimientos/:rit
Verifica movimientos nuevos y envía email si los hay.

**Body:**
```json
{
  "email_cliente": "cliente@ejemplo.com",
  "nombre_cliente": "Juan Pérez"
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/dashboard/verificar-movimientos/C-571-2018 \
  -H "Content-Type: application/json" \
  -d '{"email_cliente":"cliente@ejemplo.com","nombre_cliente":"Juan Pérez"}'
```

---

## 📋 Endpoints de Tribunales

### GET /api/tribunales
Lista todos los tribunales.

### GET /api/tribunales/:id
Obtiene un tribunal por ID.

### GET /api/tribunales/buscar
Búsqueda avanzada de tribunales.

---

## Ejemplos de Uso con Postman

### 1. Obtener todas las causas
```
GET http://localhost:3000/api/causas?limit=10
```

### 2. Obtener causa específica
```
GET http://localhost:3000/api/causas/C-571-2018
```

### 3. Obtener movimientos de una causa
```
GET http://localhost:3000/api/causas/C-571-2018/movimientos?limit=20
```

### 4. Filtrar movimientos con PDF
```
GET http://localhost:3000/api/movimientos?rit=C-571-2018&tiene_pdf=true
```

### 5. Obtener estadísticas
```
GET http://localhost:3000/api/dashboard/estadisticas
```

---

## Códigos de Estado HTTP

- `200 OK` - Solicitud exitosa
- `400 Bad Request` - Parámetros inválidos
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor
- `503 Service Unavailable` - Base de datos no disponible

---

## Formato de Respuesta

Todas las respuestas exitosas siguen este formato:
```json
{
  "success": true,
  "data": { ... }
}
```

Las respuestas de error:
```json
{
  "success": false,
  "error": "Mensaje de error"
}
```

---

## Notas

- Todos los endpoints son GET excepto los de verificación que son POST
- La paginación está disponible en todos los endpoints de listado
- Los PDFs en base64 solo se incluyen en endpoints específicos (`/completa`, `/:id/base64`)
- Los filtros son opcionales y se pueden combinar

# API de Scraping - Documentación

API REST para ejecutar scraping de causas del PJUD y consultar resultados.

## 🔐 Autenticación

La API usa tokens para autenticación. El token debe enviarse en:
- Header: `Authorization: Bearer <token>`
- Header: `x-api-token: <token>`
- Query parameter: `?token=<token>`

### Obtener Token

Al iniciar el servidor por primera vez, se crea automáticamente un token por defecto en `storage/tokens.json`.

Para obtener el token:
```bash
cat src/storage/tokens.json
```

O usa el token configurado en `.env`:
```env
API_TOKEN=tu_token_aqui
```

### Crear Nuevo Token

Los tokens se gestionan en `src/api/auth.js`. Por defecto, se crea uno automáticamente al iniciar.

## 📥 Ejecutar Scraping

### POST /api/scraping/ejecutar

Ejecuta el scraping para una causa específica. **No requiere autenticación**.

**Request:**
```json
{
  "rit": "16707-2019",
  "competencia": "3",
  "corte": "90",
  "tribunal": "276",
  "tipoCausa": "C",
  "headless": false
}
```

**Campos requeridos:**
- `rit` (string): RIT de la causa (formato: `ROL-AÑO`, ej: "16707-2019")
- `competencia` (string): ID de competencia (ej: "3" para Civil)
- `corte` (string): ID de corte (ej: "90" para C.A. de Santiago)
- `tribunal` (string): ID de tribunal
- `tipoCausa` (string): Tipo de causa (ej: "C" para Civil)

**Campos opcionales:**
- `headless` (boolean): Ejecutar navegador en modo headless (default: false)

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/scraping/ejecutar \
  -H "Content-Type: application/json" \
  -d '{
    "rit": "16707-2019",
    "competencia": "3",
    "corte": "90",
    "tribunal": "276",
    "tipoCausa": "C"
  }'
```

**Ejemplo con PHP/Symfony:**
```php
$data = [
    'rit' => '16707-2019',
    'competencia' => '3',
    'corte' => '90',
    'tribunal' => '276',
    'tipoCausa' => 'C'
];

$response = $httpClient->request('POST', 'http://localhost:3000/api/scraping/ejecutar', [
    'json' => $data
]);

$resultado = $response->toArray();
```

**Response (200 OK):**
```json
{
  "success": true,
  "mensaje": "Scraping ejecutado exitosamente",
  "resultado": {
    "rit": "16707-2019",
    "fecha_scraping": "2026-01-16T23:00:00.000Z",
    "total_movimientos": 45,
    "total_pdfs": 12,
    "movimientos": [
      {
        "indice": 1,
        "fecha": "15/01/2024",
        "tipo_movimiento": "Ingreso",
        "descripcion": "Se ingresó la causa",
        "folio": "1",
        "tiene_pdf": true
      }
      // ... más movimientos
    ],
    "cabecera": {
      "caratulado": "Causa ejemplo",
      "juzgado": "1° Juzgado Civil de Santiago"
    },
    "pdfs": {
      "_nota": "Los PDFs están almacenados en base64...",
      "total_archivos": 12,
      "nombres": ["16707_2019_mov_1_azul.pdf", ...]
    },
    "estado": "completado"
  }
}
```

**Errores:**
- `400`: Datos incompletos o formato inválido
- `500`: Error durante el scraping

## 📤 Consultar Resultados

### GET /api/scraping/resultado/:rit

Obtiene el resultado completo de un scraping, incluyendo PDFs en base64. **Requiere autenticación**.

**Ejemplo:**
```bash
curl -X GET "http://localhost:3000/api/scraping/resultado/16707-2019" \
  -H "Authorization: Bearer tu_token_aqui"
```

**Response (200 OK):**
```json
{
  "success": true,
  "resultado": {
    "rit": "16707-2019",
    "fecha_scraping": "2026-01-16T23:00:00.000Z",
    "movimientos": [...],
    "cabecera": {...},
    "pdfs": {
      "16707_2019_mov_1_azul.pdf": "base64_encoded_pdf_content...",
      "16707_2019_mov_1_rojo.pdf": "base64_encoded_pdf_content...",
      "16707_2019_demanda.pdf": "base64_encoded_pdf_content..."
    },
    "total_movimientos": 45,
    "total_pdfs": 12,
    "estado": "completado"
  }
}
```

### GET /api/scraping/listar

Lista todos los RITs que han sido procesados. **Requiere autenticación**.

**Ejemplo:**
```bash
curl -X GET "http://localhost:3000/api/scraping/listar" \
  -H "Authorization: Bearer tu_token_aqui"
```

**Response (200 OK):**
```json
{
  "success": true,
  "total": 5,
  "rits": [
    {
      "rit": "16707-2019",
      "fecha_scraping": "2026-01-16T23:00:00.000Z",
      "total_movimientos": 45,
      "total_pdfs": 12
    },
    {
      "rit": "12345-2020",
      "fecha_scraping": "2026-01-16T23:15:00.000Z",
      "total_movimientos": 30,
      "total_pdfs": 8
    }
  ]
}
```

### DELETE /api/scraping/resultado/:rit

Elimina un resultado de scraping. **Requiere autenticación**.

**Ejemplo:**
```bash
curl -X DELETE "http://localhost:3000/api/scraping/resultado/16707-2019" \
  -H "Authorization: Bearer tu_token_aqui"
```

## 📊 Estructura de Datos

### Movimientos

Cada movimiento contiene:
```json
{
  "indice": 1,
  "fecha": "15/01/2024",
  "tipo_movimiento": "Ingreso",
  "subtipo_movimiento": "",
  "descripcion": "Se ingresó la causa",
  "folio": "1",
  "anexo": "",
  "etapa": "",
  "tramite": "",
  "foja": "1",
  "tiene_pdf": true,
  "pdf_principal": "16707_2019_mov_1_azul.pdf",
  "pdf_anexo": "16707_2019_mov_1_rojo.pdf"
}
```

### PDFs en Base64

Los PDFs se almacenan como strings en base64. Para decodificarlos:

**JavaScript/Node.js:**
```javascript
const pdfBase64 = resultado.pdfs['16707_2019_mov_1_azul.pdf'];
const pdfBuffer = Buffer.from(pdfBase64, 'base64');
fs.writeFileSync('output.pdf', pdfBuffer);
```

**PHP:**
```php
$pdfBase64 = $resultado['pdfs']['16707_2019_mov_1_azul.pdf'];
$pdfContent = base64_decode($pdfBase64);
file_put_contents('output.pdf', $pdfContent);
```

**Python:**
```python
import base64

pdf_base64 = resultado['pdfs']['16707_2019_mov_1_azul.pdf']
pdf_content = base64.b64decode(pdf_base64)
with open('output.pdf', 'wb') as f:
    f.write(pdf_content)
```

## 🔄 Flujo de Uso Completo

1. **Desde PHP/Symfony, enviar datos:**
   ```php
   $response = $httpClient->request('POST', 'http://localhost:3000/api/scraping/ejecutar', [
       'json' => [
           'rit' => $rit,
           'competencia' => $competencia,
           'corte' => $corte,
           'tribunal' => $tribunal,
           'tipoCausa' => $tipoCausa
       ]
   ]);
   ```

2. **El scraping se ejecuta y guarda automáticamente**

3. **Consultar resultado (desde PHP o cualquier cliente):**
   ```php
   $response = $httpClient->request('GET', "http://localhost:3000/api/scraping/resultado/{$rit}", [
       'headers' => [
           'Authorization' => 'Bearer ' . $token
       ]
   ]);
   
   $resultado = $response->toArray();
   $movimientos = $resultado['resultado']['movimientos'];
   $pdfs = $resultado['resultado']['pdfs'];
   ```

4. **Procesar PDFs:**
   ```php
   foreach ($pdfs as $nombreArchivo => $contenidoBase64) {
       $contenidoPDF = base64_decode($contenidoBase64);
       // Guardar o procesar el PDF
       file_put_contents("pdfs/{$nombreArchivo}", $contenidoPDF);
   }
   ```

## 📁 Almacenamiento

Los resultados se guardan en:
- `src/storage/resultados.json` - Base de datos JSON con todos los resultados
- `src/storage/tokens.json` - Tokens de autenticación válidos

## ⚠️ Notas Importantes

1. **Tiempo de ejecución**: El scraping puede tomar 30-60 segundos por causa
2. **PDFs grandes**: Los PDFs en base64 pueden hacer las respuestas muy grandes
3. **Almacenamiento**: Los resultados se almacenan indefinidamente hasta que se eliminen
4. **Concurrencia**: Si se envían múltiples solicitudes simultáneas, cada una abrirá su propio navegador

## 🐛 Solución de Problemas

### Error: "Token inválido"
- Verifica que el token esté en `storage/tokens.json`
- Asegúrate de enviar el token en el header correcto

### Error: "OJV_URL no está configurada"
- Agrega `OJV_URL` a tu archivo `.env`

### Error: "Resultado no encontrado"
- Ejecuta primero el scraping con `POST /api/scraping/ejecutar`
- Verifica que el RIT sea correcto

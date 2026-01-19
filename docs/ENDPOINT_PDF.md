# 📄 Endpoint para Servir PDFs

## 🎯 Problema Resuelto

El endpoint `GET /api/scraping/resultado/{rit}` devolvía los PDFs en base64 dentro de un JSON, lo que no permitía abrirlos directamente en el navegador.

## ✅ Solución

Se agregó un nuevo endpoint que sirve los PDFs directamente con los headers HTTP correctos para que el navegador los muestre o descargue.

---

## 📋 Endpoint

### `GET /api/scraping/pdf/:rit/:archivo`

Sirve un PDF directamente para que el navegador lo muestre/descargue.

**No requiere autenticación** (a diferencia de `/api/scraping/resultado/:rit`)

---

## 🔗 Formatos de URL Soportados

### Formato 1: Nombre completo del archivo
```
GET /api/scraping/pdf/16707-2019/16707_2019_mov_7_rojo.pdf
```

### Formato 2: Formato corto (mov/índice/tipo)
```
GET /api/scraping/pdf/16707-2019/mov/7/rojo
GET /api/scraping/pdf/16707-2019/mov/7/azul
```

---

## 📝 Ejemplos de Uso

### Desde el Navegador

Simplemente abre la URL en el navegador:

```
http://localhost:3000/api/scraping/pdf/16707-2019/16707_2019_mov_7_rojo.pdf
```

O usando el formato corto:

```
http://localhost:3000/api/scraping/pdf/16707-2019/mov/7/rojo
```

### Desde HTML/JavaScript

```html
<!-- Botón que abre el PDF en nueva pestaña -->
<button onclick="window.open('/api/scraping/pdf/16707-2019/16707_2019_mov_7_rojo.pdf', '_blank')">
  Ver PDF
</button>

<!-- Iframe para mostrar el PDF en la misma página -->
<iframe src="/api/scraping/pdf/16707-2019/16707_2019_mov_7_rojo.pdf" width="100%" height="600px"></iframe>

<!-- Enlace directo -->
<a href="/api/scraping/pdf/16707-2019/16707_2019_mov_7_rojo.pdf" target="_blank">
  Abrir PDF
</a>
```

### Desde JavaScript

```javascript
function abrirPDF(rit, nombreArchivo) {
  const url = `/api/scraping/pdf/${rit}/${nombreArchivo}`;
  window.open(url, '_blank');
}

// Ejemplo de uso
abrirPDF('16707-2019', '16707_2019_mov_7_rojo.pdf');

// O usando formato corto
function abrirPDFCorto(rit, indiceMov, tipo) {
  const url = `/api/scraping/pdf/${rit}/mov/${indiceMov}/${tipo}`;
  window.open(url, '_blank');
}

abrirPDFCorto('16707-2019', 7, 'rojo');
```

---

## 🔧 Headers HTTP Configurados

El endpoint configura los siguientes headers para que el navegador muestre el PDF correctamente:

```http
Content-Type: application/pdf
Content-Disposition: inline; filename="nombre_archivo.pdf"
Content-Length: <tamaño_del_archivo>
Cache-Control: public, max-age=3600
```

- **`Content-Type: application/pdf`**: Indica que es un PDF
- **`Content-Disposition: inline`**: Le dice al navegador que muestre el PDF (no descargarlo)
- **`Content-Length`**: Tamaño del archivo
- **`Cache-Control`**: Cache por 1 hora

---

## ⚠️ Errores Posibles

### 404 - PDF no encontrado

```json
{
  "error": "PDF no encontrado",
  "mensaje": "No se encontró el archivo: 16707_2019_mov_7_rojo.pdf",
  "ruta_buscada": "/ruta/completa/src/outputs/16707_2019_mov_7_rojo.pdf",
  "sugerencia": "Verifica que el scraping se haya ejecutado correctamente"
}
```

**Solución**: Asegúrate de que:
1. El scraping se haya ejecutado para ese RIT
2. El archivo existe en `src/outputs/`
3. El nombre del archivo es correcto

### 400 - Archivo no es un PDF válido

```json
{
  "error": "Archivo no es un PDF válido",
  "mensaje": "El archivo nombre_archivo.pdf no es un PDF válido"
}
```

**Solución**: El archivo existe pero no es un PDF válido. Verifica que el scraping descargó correctamente el PDF.

---

## 🔍 Verificar que el PDF Existe

Antes de usar el endpoint, puedes verificar qué PDFs están disponibles:

```bash
# Listar PDFs de un RIT específico
ls src/outputs/16707_2019_*.pdf

# O consultar la API de resultados (requiere token)
curl -H "Authorization: Bearer TU_TOKEN" \
  http://localhost:3000/api/scraping/resultado/16707-2019
```

---

## 📊 Integración con Frontend

### Ejemplo Completo en HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>Ver PDF</title>
</head>
<body>
    <h1>Movimientos de la Causa</h1>
    
    <table>
        <tr>
            <td>Movimiento 7</td>
            <td>
                <button onclick="abrirPDF('16707-2019', '16707_2019_mov_7_rojo.pdf')">
                    Ver PDF Rojo
                </button>
                <button onclick="abrirPDF('16707-2019', '16707_2019_mov_7_azul.pdf')">
                    Ver PDF Azul
                </button>
            </td>
        </tr>
    </table>
    
    <script>
        function abrirPDF(rit, nombreArchivo) {
            const url = `/api/scraping/pdf/${rit}/${nombreArchivo}`;
            window.open(url, '_blank');
        }
    </script>
</body>
</html>
```

### Ejemplo con Modal

```html
<div id="modalPDF" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000;">
    <div style="position: relative; width: 90%; height: 90%; margin: 5% auto; background: white;">
        <button onclick="cerrarPDF()" style="position: absolute; top: 10px; right: 10px; z-index: 1001;">Cerrar</button>
        <iframe id="pdfViewer" src="" style="width: 100%; height: 100%; border: none;"></iframe>
    </div>
</div>

<script>
    function mostrarPDF(rit, nombreArchivo) {
        const url = `/api/scraping/pdf/${rit}/${nombreArchivo}`;
        document.getElementById('pdfViewer').src = url;
        document.getElementById('modalPDF').style.display = 'block';
    }
    
    function cerrarPDF() {
        document.getElementById('modalPDF').style.display = 'none';
        document.getElementById('pdfViewer').src = '';
    }
</script>
```

---

## 🚀 Prueba Rápida

1. **Iniciar el servidor API**:
   ```bash
   npm run api:start
   ```

2. **Abrir en el navegador**:
   ```
   http://localhost:3000/api/scraping/pdf/16707-2019/16707_2019_mov_7_rojo.pdf
   ```

3. **El PDF debería abrirse directamente en el navegador** ✅

---

## 📝 Notas

- El endpoint **no requiere autenticación** (a diferencia de `/api/scraping/resultado/:rit`)
- Los PDFs se buscan en `src/outputs/`
- El formato de nombre es: `{rit}_mov_{indice}_{tipo}.pdf`
  - `rit`: RIT sin guiones (ej: `16707_2019`)
  - `indice`: Número del movimiento (ej: `7`)
  - `tipo`: `azul` (principal) o `rojo` (anexo)
- El endpoint valida que el archivo sea un PDF válido antes de servirlo

---

## 🔄 Actualización de Frontend

Los archivos HTML ya fueron actualizados para usar este endpoint:

- `src/api/public/demo-movimientos-completo.html` - Usa `mostrarMensajePDF()`
- `src/api/public/mvp-dashboard.html` - Usa `verPDF()`

Ambas funciones ahora abren el PDF usando el nuevo endpoint.

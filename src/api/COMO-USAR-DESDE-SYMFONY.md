# 🚀 Cómo Usar la API desde Symfony - Guía Paso a Paso

## ⚠️ IMPORTANTE: Esto es para integrar en TU proyecto Symfony

Los archivos en `src/api/templates/` son **ejemplos para copiar** a tu proyecto Symfony. **NO se ejecutan directamente desde este repositorio**.

---

## 📋 Paso 1: Verificar que el Servidor API esté Corriendo

```bash
# En este proyecto (pjud-webscrapping)
npm run api:start
```

Deberías ver:
```
🚀 API SERVER - Tribunales PJUD
📍 Puerto: 3000
```

---

## 📋 Paso 2: Obtener el Token

```bash
cat src/storage/tokens.json
```

Verás algo como:
```json
{
  "default": {
    "token": "abc123def456...",
    ...
  }
}
```

**Copia ese token** - lo necesitarás para consultar resultados.

---

## 📋 Paso 3: Integrar en tu Proyecto Symfony

### Opción A: Usar HttpClient de Symfony (Recomendado)

#### 3.1. En tu Controlador Symfony existente:

```php
<?php
// src/Controller/TuController.php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class TuController extends AbstractController
{
    private $httpClient;
    private $apiUrl;
    private $apiToken;

    public function __construct(HttpClientInterface $httpClient)
    {
        $this->httpClient = $httpClient;
        // Configurar en .env de Symfony
        $this->apiUrl = $_ENV['API_SCRAPING_URL'] ?? 'http://localhost:3000';
        $this->apiToken = $_ENV['API_SCRAPING_TOKEN'] ?? '';
    }

    /**
     * @Route("/ejecutar-scraping", name="ejecutar_scraping", methods={"POST"})
     */
    public function ejecutarScraping(Request $request): JsonResponse
    {
        // Obtener datos del formulario
        $data = json_decode($request->getContent(), true);
        
        // Validar datos
        if (empty($data['rit']) || empty($data['competencia']) || 
            empty($data['corte']) || empty($data['tribunal']) || 
            empty($data['tipoCausa'])) {
            return new JsonResponse(['error' => 'Datos incompletos'], 400);
        }

        try {
            // Llamar a la API de scraping
            $response = $this->httpClient->request('POST', $this->apiUrl . '/api/scraping/ejecutar', [
                'json' => $data
            ]);

            $resultado = $response->toArray();
            
            return new JsonResponse([
                'success' => true,
                'resultado' => $resultado
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @Route("/ver-movimientos/{rit}", name="ver_movimientos")
     */
    public function verMovimientos(string $rit)
    {
        try {
            // Obtener resultado desde la API
            $response = $this->httpClient->request('GET', 
                $this->apiUrl . '/api/scraping/resultado/' . $rit, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiToken
                ]
            ]);

            $data = $response->toArray();
            $resultado = $data['resultado'];
            
            // Separar PDFs
            $pdfs = $resultado['pdfs'] ?? [];
            unset($resultado['pdfs']); // No enviar PDFs a la vista (muy grandes)

            // Renderizar template (necesitas crear este template)
            return $this->render('movimientos.html.twig', [
                'resultado' => $resultado,
                'pdfs' => $pdfs
            ]);

        } catch (\Exception $e) {
            return $this->render('error.html.twig', [
                'error' => $e->getMessage()
            ]);
        }
    }
}
```

#### 3.2. Crear Template Twig en tu Symfony:

**Archivo: `templates/movimientos.html.twig`**

```twig
<!DOCTYPE html>
<html>
<head>
    <title>Movimientos - {{ resultado.rit }}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-4">
        <h1>Movimientos: {{ resultado.rit }}</h1>
        
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Folio</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Descripción</th>
                </tr>
            </thead>
            <tbody>
                {% for mov in resultado.movimientos %}
                <tr>
                    <td>{{ mov.folio }}</td>
                    <td>{{ mov.fecha }}</td>
                    <td>{{ mov.tipo_movimiento }}</td>
                    <td>{{ mov.descripcion }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
</body>
</html>
```

#### 3.3. Configurar `.env` en tu Symfony:

```env
API_SCRAPING_URL=http://localhost:3000
API_SCRAPING_TOKEN=tu_token_aqui
```

---

### Opción B: Usar cURL directamente (Más simple)

```php
<?php
// En cualquier parte de tu código Symfony

function ejecutarScraping($rit, $competencia, $corte, $tribunal, $tipoCausa) {
    $data = [
        'rit' => $rit,
        'competencia' => $competencia,
        'corte' => $corte,
        'tribunal' => $tribunal,
        'tipoCausa' => $tipoCausa
    ];

    $ch = curl_init('http://localhost:3000/api/scraping/ejecutar');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}

// Usar:
$resultado = ejecutarScraping('16707-2019', '3', '90', '276', 'C');
```

---

## 🧪 Probar desde Línea de Comandos

Para entender cómo funciona, puedes probar este ejemplo PHP:

```bash
# 1. Obtener el token
cat src/storage/tokens.json

# 2. Editar el archivo ejemplo-uso-php.php y poner tu token
nano src/api/ejemplo-uso-php.php

# 3. Ejecutar el ejemplo
php src/api/ejemplo-uso-php.php
```

---

## 📝 Flujo Completo

### 1. Desde tu aplicación Symfony/Bootstrap:

```php
// Obtener datos de tu base de datos SQL
$causa = $em->getRepository(Causa::class)->find($id);

// Ejecutar scraping
$response = $httpClient->request('POST', 'http://localhost:3000/api/scraping/ejecutar', [
    'json' => [
        'rit' => $causa->getIdCausa(), // Desde tu BD
        'competencia' => $causa->getCompetencia(), // Desde tu BD
        'corte' => $causa->getCorte(), // Desde tu BD
        'tribunal' => $causa->getTribunal(), // Desde tu BD
        'tipoCausa' => $causa->getTipoCausa() // Desde tu BD
    ]
]);

// Esperar resultado (puede tardar 30-60 segundos)
$resultado = $response->toArray();
```

### 2. Consultar resultados después:

```php
// Obtener movimientos guardados
$response = $httpClient->request('GET', 
    'http://localhost:3000/api/scraping/resultado/' . $rit, [
    'headers' => [
        'Authorization' => 'Bearer ' . $token
    ]
]);

$datos = $response->toArray();
$movimientos = $datos['resultado']['movimientos'];
$pdfs = $datos['resultado']['pdfs']; // Base64

// Mostrar en tu vista
return $this->render('movimientos.html.twig', [
    'movimientos' => $movimientos,
    'pdfs' => $pdfs
]);
```

---

## 🎯 Resumen Simple

1. **El servidor Node.js** (este proyecto) debe estar corriendo: `npm run api:start`
2. **Desde tu Symfony**, llamas a la API con los 6 campos
3. **El scraping se ejecuta** y guarda los resultados
4. **Puedes consultar** los resultados después con el token

---

## ❓ Preguntas Frecuentes

**P: ¿Dónde ejecuto el código PHP?**
R: En **TU proyecto Symfony**, no en este proyecto Node.js.

**P: ¿Cómo veo los movimientos?**
R: Crea una ruta en tu Symfony que llame a la API y renderice un template.

**P: ¿Puedo probar sin Symfony?**
R: Sí, ejecuta `php src/api/ejemplo-uso-php.php` para ver cómo funciona.

---

¿Necesitas más ayuda? Verifica:
- Que el servidor API esté corriendo: `curl http://localhost:3000/api/health`
- Que tengas el token correcto
- Que tu Symfony tenga HttpClient instalado

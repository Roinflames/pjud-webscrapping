# 🎯 Explicación Simple: Cómo Usar la API desde Symfony

## ❓ ¿Qué es esto?

Este proyecto Node.js tiene una **API REST** que:
1. Recibe datos (RIT, competencia, corte, etc.) desde PHP/Symfony
2. Ejecuta el scraping automáticamente
3. Guarda los resultados (movimientos + PDFs)
4. Te permite consultarlos después

---

## 🚀 Paso a Paso

### PASO 1: Iniciar el Servidor API (en este proyecto)

```bash
# En este proyecto (pjud-webscrapping)
npm run api:start
```

Deberías ver:
```
🚀 API SERVER - Tribunales PJUD
📍 Puerto: 3000
```

**¡Deja esto corriendo!** El servidor debe estar activo para recibir peticiones.

---

### PASO 2: Obtener el Token

```bash
# Opción 1: Usar el script
./src/api/obtener-token.sh

# Opción 2: Ver directamente
cat src/storage/tokens.json
```

Verás algo como:
```json
{
  "default": {
    "token": "abc123def456ghi789..."
  }
}
```

**Copia ese token largo** - lo necesitas para consultar resultados.

---

### PASO 3: Usar desde tu Proyecto Symfony

#### Ejemplo Simple en tu Controlador Symfony:

```php
<?php
// En tu proyecto Symfony
// src/Controller/CausaController.php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class CausaController extends AbstractController
{
    private $httpClient;
    
    public function __construct(HttpClientInterface $httpClient)
    {
        $this->httpClient = $httpClient;
    }

    /**
     * @Route("/causa/{id}/scraping", name="ejecutar_scraping")
     */
    public function ejecutarScraping($id)
    {
        // 1. Obtener datos de tu base de datos SQL
        $causa = $this->getDoctrine()
            ->getRepository(Causa::class)
            ->find($id);
        
        // 2. Ejecutar scraping llamando a la API Node.js
        $response = $this->httpClient->request('POST', 
            'http://localhost:3000/api/scraping/ejecutar', 
            [
                'json' => [
                    'rit' => $causa->getIdCausa(),
                    'competencia' => $causa->getCompetenciaId(),
                    'corte' => $causa->getCorteId(),
                    'tribunal' => $causa->getTribunalId(),
                    'tipoCausa' => $causa->getTipoCausa()
                ]
            ]
        );
        
        $resultado = $response->toArray();
        
        // 3. Redirigir a ver movimientos
        return $this->redirectToRoute('ver_movimientos', [
            'rit' => $causa->getIdCausa()
        ]);
    }

    /**
     * @Route("/causa/movimientos/{rit}", name="ver_movimientos")
     */
    public function verMovimientos($rit)
    {
        // Configurar token (poner en .env de Symfony)
        $token = $_ENV['API_SCRAPING_TOKEN'] ?? 'tu_token_aqui';
        
        // Obtener resultado desde la API
        $response = $this->httpClient->request('GET',
            'http://localhost:3000/api/scraping/resultado/' . $rit,
            [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token
                ]
            ]
        );
        
        $data = $response->toArray();
        $resultado = $data['resultado'];
        
        // Separar PDFs (no enviarlos a la vista completa porque son muy grandes)
        $pdfs = $resultado['pdfs'] ?? [];
        unset($resultado['pdfs']);
        
        // Renderizar tu vista
        return $this->render('causa/movimientos.html.twig', [
            'resultado' => $resultado,
            'pdfs' => $pdfs  // Para mostrar PDFs después si quieres
        ]);
    }
}
```

---

### PASO 4: Crear Vista en tu Symfony

**Archivo: `templates/causa/movimientos.html.twig`**

Puedes copiar el contenido de `src/api/templates/movimientos.html.twig` o crear tu propia vista:

```twig
{% extends 'base.html.twig' %}

{% block body %}
<div class="container">
    <h1>Movimientos: {{ resultado.rit }}</h1>
    
    {% if resultado.cabecera %}
    <div class="alert alert-info">
        <strong>Caratulado:</strong> {{ resultado.cabecera.caratulado }}<br>
        <strong>Juzgado:</strong> {{ resultado.cabecera.juzgado }}
    </div>
    {% endif %}
    
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
{% endblock %}
```

---

## 🧪 Probar sin Symfony (Solo para entender)

Si quieres ver cómo funciona sin tocar Symfony, puedes probar:

```bash
# Ejecutar ejemplo PHP
php src/api/ejemplo-uso-php.php
```

Esto te mostrará cómo se hacen las llamadas a la API.

---

## 📋 Resumen Visual

```
┌─────────────────────┐
│  TU PROYECTO        │
│  SYMFONY            │
│                     │
│  - CausaController  │  ────┐
│  - Base de Datos    │      │
│  - Vista Twig       │      │
└─────────────────────┘      │
                             │
                             │ HTTP POST
                             │ http://localhost:3000
                             │ /api/scraping/ejecutar
                             │
                             ▼
                    ┌─────────────────────┐
                    │  SERVICIO API       │
                    │  Node.js            │
                    │                     │
                    │  - Recibe datos     │
                    │  - Ejecuta scraping │
                    │  - Guarda resultados│
                    └─────────────────────┘
                             │
                             │ HTTP GET
                             │ Con token
                             │
                             ▼
                    ┌─────────────────────┐
                    │  RESULTADOS         │
                    │  - Movimientos JSON │
                    │  - PDFs en base64   │
                    └─────────────────────┘
```

---

## ⚠️ Importante

1. **El servidor Node.js DEBE estar corriendo** siempre que uses la API
2. **Los templates en `src/api/templates/`** son ejemplos - cópialos a tu Symfony
3. **La URL `http://tu-app.local`** es solo un ejemplo - usa la URL de TU Symfony

---

## 🆘 ¿Tienes dudas?

1. **¿Dónde va el código PHP?** → En tu proyecto Symfony, no aquí
2. **¿Cómo pruebo?** → `php src/api/ejemplo-uso-php.php`
3. **¿Necesito modificar algo aquí?** → Solo asegúrate de que el servidor esté corriendo

---

## 📞 Flujo Real de Uso

1. Usuario en tu app Symfony hace clic en "Ver Movimientos"
2. Tu Symfony llama: `POST http://localhost:3000/api/scraping/ejecutar`
3. La API ejecuta scraping y guarda resultado
4. Tu Symfony llama: `GET http://localhost:3000/api/scraping/resultado/{rit}` (con token)
5. Tu Symfony muestra los datos en tu vista Twig

¡Eso es todo! 🎉

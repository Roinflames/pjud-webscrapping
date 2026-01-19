# Guía de Integración - Symfony 5.0.2 + Bootstrap 4.6

Esta guía explica cómo integrar la visualización de movimientos del PJUD en tu aplicación Symfony.

## 📁 Archivos Creados

1. **`movimientos_pjud.php`** - Template PHP puro (si no usas Twig)
2. **`movimientos.html.twig`** - Template Twig para Symfony
3. **`ScrapingController.php`** - Controlador Symfony de ejemplo

## 🔧 Instalación en Symfony

### Paso 1: Copiar Archivos

#### Si usas Twig (Recomendado):
```bash
# Copiar template Twig
cp src/api/templates/movimientos.html.twig templates/scraping/

# Copiar controlador
cp src/api/templates/ScrapingController.php src/Controller/
```

#### Si usas PHP puro:
```bash
# Copiar template PHP
cp src/api/templates/movimientos_pjud.php templates/scraping/
```

### Paso 2: Configurar Variables de Entorno

Agregar a tu `.env`:
```env
API_SCRAPING_URL=http://localhost:3000
API_SCRAPING_TOKEN=tu_token_aqui
```

Para obtener el token:
```bash
cat src/storage/tokens.json
```

### Paso 3: Configurar Rutas

#### Opción A: Usando Anotaciones (ya incluido en ScrapingController.php)

Asegúrate de tener configurado el paquete de anotaciones:
```yaml
# config/packages/annotations.yaml
annotations:
    enabled: true
```

#### Opción B: Usando YAML

Crear `config/routes/scraping.yaml`:
```yaml
scraping_movimientos:
    path: /scraping/movimientos/{rit}
    controller: App\Controller\ScrapingController::mostrarMovimientos
    methods: [GET]

scraping_ejecutar:
    path: /scraping/ejecutar
    controller: App\Controller\ScrapingController::ejecutarScraping
    methods: [POST]

scraping_listar:
    path: /scraping/listar
    controller: App\Controller\ScrapingController::listarRITs
    methods: [GET]
```

### Paso 4: Instalar HttpClient (si no está instalado)

Symfony 5.0.2 incluye HttpClient, pero asegúrate de tenerlo:

```bash
composer require symfony/http-client
```

### Paso 5: Adaptar el Controlador (si es necesario)

Si tu estructura de Symfony es diferente, ajusta los namespaces y rutas en `ScrapingController.php`.

## 📝 Uso Básico

### Visualizar Movimientos de un RIT

```php
// En tu controlador Symfony
use Symfony\Component\HttpFoundation\Response;

public function verMovimientos(string $rit): Response
{
    // El controlador ScrapingController ya hace esto
    // Solo llama a la ruta: /scraping/movimientos/{rit}
    return $this->redirectToRoute('scraping_movimientos', ['rit' => $rit]);
}
```

### Ejecutar Scraping desde PHP

```php
use Symfony\Component\HttpClient\HttpClient;

$client = HttpClient::create();
$response = $client->request('POST', 'http://localhost:3000/api/scraping/ejecutar', [
    'json' => [
        'rit' => '16707-2019',
        'competencia' => '3',
        'corte' => '90',
        'tribunal' => '276',
        'tipoCausa' => 'C'
    ]
]);

$resultado = $response->toArray();
```

### Enlace en tu Vista

```twig
{# En cualquier template Twig #}
<a href="{{ path('scraping_movimientos', {rit: '16707-2019'}) }}" class="btn btn-primary">
    Ver Movimientos
</a>
```

## 🎨 Personalización

### Modificar Estilos

El template incluye Bootstrap 4.6 y estilos personalizados. Puedes modificar los estilos CSS en la sección `<style>` del template.

### Ajustar Columnas de la Tabla

Edita la sección `<thead>` y `<tbody>` en el template para agregar/quitar columnas.

### Cambiar Colores

Modifica las clases CSS:
- `.header-pjud` - Color del encabezado
- `.table-pjud thead` - Color de encabezado de tabla
- `.badge-folio` - Color del badge de folio

## 🔗 Ejemplo Completo: Desde Base de Datos

```php
<?php
// En tu controlador existente

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Doctrine\ORM\EntityManagerInterface;

class CausaController extends AbstractController
{
    /**
     * @Route("/causa/{id}/movimientos", name="causa_movimientos")
     */
    public function verMovimientos(int $id, EntityManagerInterface $em)
    {
        // Obtener causa desde BD
        $causa = $em->getRepository(Causa::class)->find($id);
        
        if (!$causa) {
            throw $this->createNotFoundException('Causa no encontrada');
        }
        
        // Redirigir al controlador de scraping
        return $this->redirectToRoute('scraping_movimientos', [
            'rit' => $causa->getIdCausa() // Asumiendo que tienes este campo
        ]);
    }
    
    /**
     * @Route("/causa/{id}/ejecutar-scraping", name="causa_ejecutar_scraping", methods={"POST"})
     */
    public function ejecutarScraping(int $id, EntityManagerInterface $em)
    {
        $causa = $em->getRepository(Causa::class)->find($id);
        
        // Ejecutar scraping (ver ScrapingController para implementación completa)
        // ...
        
        // Redirigir a ver movimientos
        return $this->redirectToRoute('causa_movimientos', ['id' => $id]);
    }
}
```

## 🐛 Solución de Problemas

### Error: "Class 'App\Controller\ScrapingController' not found"
- Verifica que el namespace sea correcto
- Ejecuta `composer dump-autoload`

### Error: "Route not found"
- Verifica las rutas en `config/routes.yaml`
- Ejecuta `php bin/console debug:router` para ver todas las rutas

### Error: "Connection refused" al llamar a la API
- Asegúrate de que el servidor Node.js esté corriendo: `npm run api:start`
- Verifica `API_SCRAPING_URL` en `.env`

### Los PDFs no se muestran
- Verifica que el token sea correcto
- Asegúrate de que los PDFs estén en base64 en la respuesta de la API

## 📚 Recursos Adicionales

- [Documentación API de Scraping](../README-SCRAPING.md)
- [Bootstrap 4.6 Documentation](https://getbootstrap.com/docs/4.6/)
- [Symfony HttpClient Documentation](https://symfony.com/doc/5.0/components/http_client.html)

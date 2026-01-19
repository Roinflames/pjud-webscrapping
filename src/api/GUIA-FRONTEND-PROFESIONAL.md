# 🎨 Guía Completa: Frontend Profesional Estilo PJUD

## 📋 ¿Qué se creó?

Un frontend profesional que replica exactamente la visualización del **PJUD (Poder Judicial de Chile)** y sistemas similares como **LegalFlow** o **Case Tracking**, diseñado para uso profesional en despachos legales.

---

## 🎯 Características del Frontend

### ✅ Diseño Visual

- **Estilo idéntico al PJUD**: Colores, tipografía y layout corporativo
- **Interfaz profesional**: Diseñada para abogados y gestores legales
- **Responsive**: Funciona en desktop, tablet y móvil
- **Colores corporativos**: Azul del Poder Judicial (#1e3a8a)

### ✅ Funcionalidades

- **Tabla de movimientos procesales**: Exactamente como en el PJUD
- **Información de causa**: RIT, caratulado, juzgado
- **Estado actual**: Badges con estado de la causa
- **Documentos PDF**: Visualización de PDFs (Principal/Azul y Anexo/Rojo)
- **Filtros en tiempo real**: Por fecha, descripción, etapa
- **Estadísticas**: Total de movimientos, documentos, etc.
- **Exportación**: Imprimir o exportar datos

---

## 📁 Archivos Creados

### 1. `movimientos-pjud-profesional.html` (24KB)
Template PHP puro - Estilo profesional completo
- Puede usarse directamente o convertir a Twig
- Incluye todos los estilos CSS integrados
- JavaScript para filtros y visualización de PDFs

### 2. `movimientos-profesional.html.twig` (17KB)
Template Twig para Symfony - Versión optimizada
- Listo para copiar a `templates/scraping/`
- Compatible con Symfony 5.0.2
- Bootstrap 4.6 integrado

### 3. `README-FRONTEND-PROFESIONAL.md`
Documentación completa del frontend

---

## 🚀 Cómo Usar en Symfony

### Opción 1: Copiar Template Twig (Recomendado)

```bash
# 1. Copiar template a tu Symfony
cp src/api/templates/movimientos-profesional.html.twig /ruta/tu/symfony/templates/scraping/movimientos.html.twig

# 2. Crear controlador (ver ejemplo abajo)
# 3. Agregar ruta
# 4. ¡Listo!
```

### Opción 2: Ver Demo en el Servidor

```bash
# Reiniciar servidor para cargar /demo
./src/api/gestionar-servidor.sh restart

# Abrir en navegador
open http://localhost:3000/demo
```

---

## 💻 Controlador Symfony Completo

```php
<?php
// src/Controller/CausaController.php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class CausaController extends AbstractController
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
     * @Route("/causa/{rit}/movimientos", name="causa_movimientos")
     */
    public function verMovimientos(string $rit)
    {
        try {
            // 1. Obtener datos desde la API Node.js
            $response = $this->httpClient->request('GET',
                $this->apiUrl . '/api/scraping/resultado/' . $rit,
                [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $this->apiToken,
                        'Accept' => 'application/json'
                    ],
                    'timeout' => 30
                ]
            );

            $data = $response->toArray();
            
            if (!isset($data['resultado'])) {
                throw new \Exception('No se encontraron datos para el RIT: ' . $rit);
            }

            $resultado = $data['resultado'];
            
            // 2. Separar PDFs (son muy grandes para enviar a la vista)
            $pdfs = $resultado['pdfs'] ?? [];
            unset($resultado['pdfs']); // No enviar PDFs completos a la vista

            // 3. Renderizar template profesional
            return $this->render('scraping/movimientos.html.twig', [
                'resultado' => $resultado,
                'pdfs' => $pdfs  // Solo nombres de archivos, no contenido base64
            ]);

        } catch (\Exception $e) {
            // Manejar errores
            return $this->render('scraping/error.html.twig', [
                'error' => $e->getMessage(),
                'rit' => $rit
            ]);
        }
    }

    /**
     * @Route("/causa/{rit}/pdf/{nombreArchivo}", name="causa_ver_pdf")
     */
    public function verPDF(string $rit, string $nombreArchivo)
    {
        // Obtener PDF específico desde la API
        $response = $this->httpClient->request('GET',
            $this->apiUrl . '/api/scraping/resultado/' . $rit,
            [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiToken
                ]
            ]
        );

        $data = $response->toArray();
        $pdfs = $data['resultado']['pdfs'] ?? [];
        
        if (!isset($pdfs[$nombreArchivo])) {
            throw $this->createNotFoundException('PDF no encontrado');
        }

        // Decodificar base64 y enviar como respuesta
        $pdfContent = base64_decode($pdfs[$nombreArchivo]);
        
        return new Response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $nombreArchivo . '"'
        ]);
    }
}
```

---

## 📊 Estructura de Datos

### Datos que Recibe el Template

```php
// Desde la API: GET /api/scraping/resultado/{rit}
$resultado = [
    'rit' => '16707-2019',
    'fecha_scraping' => '2026-01-19T...',
    'cabecera' => [
        'caratulado' => 'Juan Pérez vs Empresa XYZ',
        'juzgado' => '1° Juzgado Civil de Santiago',
        'fecha_ingreso' => '15/01/2024'
    ],
    'estado_actual' => [
        'estado' => 'EN_TRAMITE',
        'descripcion' => 'En trámite - Ingreso',
        'etapa' => 'INGRESO',
        'ultimo_movimiento' => [
            'fecha' => '15/01/2024',
            'tipo' => 'Ingreso',
            'descripcion' => 'Se ingresó la causa'
        ]
    ],
    'movimientos' => [
        [
            'indice' => 1,
            'folio' => '1',
            'fecha' => '15/01/2024',
            'etapa' => 'Ingreso',
            'tramite' => 'Ingreso',
            'descripcion' => 'Se ingresó la causa al tribunal',
            'foja' => '1',
            'tiene_pdf' => true,
            'pdf_principal' => '16707_2019_mov_1_azul.pdf',
            'pdf_anexo' => null
        ],
        // ... más movimientos
    ],
    'total_movimientos' => 45,
    'total_pdfs' => 12
];

// PDFs separados (base64)
$pdfs = [
    '16707_2019_mov_1_azul.pdf' => 'base64_encoded_content...',
    '16707_2019_mov_1_rojo.pdf' => 'base64_encoded_content...'
];
```

---

## 🎨 Columnas de la Tabla (Idéntico al PJUD)

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| **Folio** | Número de folio del movimiento | 1, 2, 3... |
| **Documentos** | Iconos PDF (Azul=Principal, Rojo=Anexo) | 🟦 🟥 |
| **Fecha** | Fecha del movimiento | 15/01/2024 |
| **Etapa** | Etapa procesal | Ingreso, Notificación, etc. |
| **Trámite** | Tipo de trámite | Ingreso, Contestación, etc. |
| **Descripción** | Descripción completa del trámite | "Se ingresó la causa..." |
| **Foja** | Número de foja | 1, 2, 3... |

---

## 🔄 Flujo Completo de Uso

### 1. Desde tu Aplicación Symfony/Bootstrap:

```php
// Usuario hace clic en "Ver Movimientos" de una causa
// Tu código obtiene datos de tu BD SQL:
$causa = $em->getRepository(Causa::class)->find($id);

// Redirige al controlador
return $this->redirectToRoute('causa_movimientos', [
    'rit' => $causa->getIdCausa()
]);
```

### 2. El Controlador Llama a la API:

```php
// El controlador llama a tu API Node.js
$response = $httpClient->request('GET',
    'http://localhost:3000/api/scraping/resultado/' . $rit,
    ['headers' => ['Authorization' => 'Bearer ' . $token]]
);
```

### 3. La API Devuelve Datos:

```json
{
  "success": true,
  "resultado": {
    "rit": "16707-2019",
    "movimientos": [...],
    "pdfs": {...}
  }
}
```

### 4. Symfony Renderiza el Template:

```php
return $this->render('scraping/movimientos.html.twig', [
    'resultado' => $resultado,
    'pdfs' => $pdfs
]);
```

### 5. El Usuario Ve:

- ✅ Tabla profesional igual al PJUD
- ✅ Filtros funcionando
- ✅ PDFs visualizables
- ✅ Información completa de la causa

---

## 🎯 Comparación Visual

### PJUD Oficial muestra:
```
| Folio | Doc. | Fecha | Etapa | Trámite | Descripción | Foja |
```

### Este Template muestra:
```
| Folio | Doc. | Fecha | Etapa | Trámite | Descripción | Foja |
```
**¡Exactamente igual!** Con estilos profesionales adicionales.

---

## 🧪 Probar Ahora

### 1. Verificar Servidor:

```bash
./src/api/gestionar-servidor.sh status
```

### 2. Obtener Token:

```bash
./src/api/obtener-token.sh
```

### 3. Probar con cURL:

```bash
# Obtener resultado de un RIT (necesitas haber ejecutado scraping primero)
curl -H "Authorization: Bearer TU_TOKEN" \
     http://localhost:3000/api/scraping/resultado/16707-2019
```

### 4. Ver Demo:

```bash
# Reiniciar servidor
./src/api/gestionar-servidor.sh restart

# Abrir en navegador
open http://localhost:3000/demo
```

---

## 📝 Notas Importantes

1. **Los PDFs en base64 son muy grandes** - No los envíes completos a la vista Twig. En su lugar:
   - Envía solo los nombres de archivo
   - Crea un endpoint separado para obtener cada PDF cuando se necesite

2. **El template está optimizado** - Incluye solo lo necesario para mostrar los datos

3. **Bootstrap 4.6** - Compatible con tu versión de Symfony

4. **Responsive** - Se adapta automáticamente a móviles

---

## 🎉 Resultado Final

Tendrás un frontend profesional que:
- ✅ Se ve igual al PJUD
- ✅ Funciona en Symfony
- ✅ Muestra todos los datos del scraping
- ✅ Permite visualizar PDFs
- ✅ Tiene filtros y búsqueda
- ✅ Es responsive y profesional

---

## 📚 Más Información

- `src/api/README-FRONTEND-PROFESIONAL.md` - Documentación detallada
- `src/api/templates/movimientos-pjud-profesional.html` - Template completo
- `src/api/templates/movimientos-profesional.html.twig` - Template Twig

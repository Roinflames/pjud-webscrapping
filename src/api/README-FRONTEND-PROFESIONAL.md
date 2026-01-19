# 🎨 Frontend Profesional - Estilo PJUD/LegalFlow/Case Tracking

## 📋 Descripción

Frontend profesional que replica la visualización exacta del **PJUD (Poder Judicial de Chile)** y sistemas similares como **LegalFlow** o **Case Tracking**. Diseñado para uso profesional en despachos legales y gestorías.

---

## 🎯 Características

✅ **Diseño Profesional**
- Estilo similar al PJUD oficial
- Colores corporativos del Poder Judicial
- Interfaz limpia y profesional

✅ **Visualización Completa**
- Tabla de movimientos procesales idéntica al PJUD
- Información de la causa (RIT, caratulado, juzgado)
- Estado actual de la causa
- Documentos PDF (Principal/Azul y Anexo/Rojo)

✅ **Funcionalidades Avanzadas**
- Filtros en tiempo real (fecha, descripción, etapa)
- Visualizador de PDFs integrado
- Estadísticas de movimientos
- Diseño responsive (móvil y desktop)
- Exportación/Impresión

---

## 📁 Archivos

### Templates Disponibles

1. **`movimientos-pjud-profesional.html`**
   - Template PHP puro (HTML + PHP)
   - Listo para usar directamente o convertir a Twig

2. **`movimientos-profesional.html.twig`**
   - Template Twig para Symfony
   - Copiar a: `templates/scraping/movimientos.html.twig`

---

## 🚀 Uso en Symfony

### Paso 1: Copiar Template

```bash
# Desde este proyecto
cp src/api/templates/movimientos-profesional.html.twig /ruta/a/tu/symfony/templates/scraping/movimientos.html.twig
```

### Paso 2: Usar en Controlador

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
    private $apiUrl = 'http://localhost:3000';
    private $apiToken; // Configurar en .env

    public function __construct(HttpClientInterface $httpClient)
    {
        $this->httpClient = $httpClient;
        $this->apiToken = $_ENV['API_SCRAPING_TOKEN'] ?? '';
    }

    /**
     * @Route("/causa/{rit}/movimientos", name="causa_movimientos")
     */
    public function verMovimientos(string $rit)
    {
        // Obtener datos desde la API
        $response = $this->httpClient->request('GET',
            $this->apiUrl . '/api/scraping/resultado/' . $rit,
            [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiToken
                ]
            ]
        );

        $data = $response->toArray();
        $resultado = $data['resultado'];

        // Separar PDFs
        $pdfs = $resultado['pdfs'] ?? [];
        unset($resultado['pdfs']);

        // Renderizar template profesional
        return $this->render('scraping/movimientos.html.twig', [
            'resultado' => $resultado,
            'pdfs' => $pdfs
        ]);
    }
}
```

### Paso 3: Agregar Ruta

```yaml
# config/routes.yaml
causa_movimientos:
    path: /causa/{rit}/movimientos
    controller: App\Controller\CausaController::verMovimientos
    methods: [GET]
```

---

## 🎨 Estructura Visual

### Header
- Color azul corporativo del PJUD
- RIT destacado en badge
- Botón de impresión

### Información de la Causa
- RIT/Rol
- Caratulado
- Juzgado/Tribunal
- Última actualización

### Estado Actual
- Badge de estado (En Trámite/Terminada/Suspendida)
- Color según estado
- Último movimiento

### Tabla de Movimientos
Columnas idénticas al PJUD:
1. **Folio** - Badge azul con número
2. **Documentos** - Iconos PDF (azul=principal, rojo=anexo)
3. **Fecha** - Formato DD/MM/YYYY
4. **Etapa** - Badge con etapa procesal
5. **Trámite** - Tipo de movimiento
6. **Descripción** - Texto completo del trámite
7. **Foja** - Número de foja

### Filtros
- Búsqueda por fecha
- Búsqueda por descripción
- Filtro por etapa

### Estadísticas
- Total de movimientos
- Movimientos con documentos
- PDFs descargados

---

## 🔧 Personalización

### Cambiar Colores

Edita las variables CSS en `<style>`:

```css
:root {
    --pjud-primary: #1e3a8a;  /* Color principal */
    --pjud-secondary: #3b82f6; /* Color secundario */
    /* ... más colores */
}
```

### Modificar Columnas

Edita la sección `<thead>` y `<tbody>` para agregar/quitar columnas:

```html
<th>Nueva Columna</th>
```

### Agregar Funcionalidades

Ejemplo: Exportar a Excel

```javascript
function exportarExcel() {
    // Implementar exportación
}
```

---

## 📱 Responsive

El diseño es completamente responsive:
- ✅ Desktop (1920px+)
- ✅ Tablet (768px - 1920px)
- ✅ Móvil (< 768px)

---

## 🔐 Integración con Autenticación

Si necesitas agregar autenticación en el frontend:

```twig
{% if app.user %}
    {# Mostrar datos #}
{% else %}
    {# Redirigir a login #}
    {{ redirect(path('login')) }}
{% endif %}
```

---

## 📊 Datos Requeridos

El template espera esta estructura:

```php
$resultado = [
    'rit' => '16707-2019',
    'cabecera' => [
        'caratulado' => 'Nombre causa',
        'juzgado' => '1° Juzgado Civil de Santiago'
    ],
    'estado_actual' => [
        'estado' => 'EN_TRAMITE',
        'descripcion' => 'En trámite - Ingreso'
    ],
    'movimientos' => [
        [
            'indice' => 1,
            'folio' => '1',
            'fecha' => '15/01/2024',
            'etapa' => 'Ingreso',
            'tramite' => 'Ingreso',
            'descripcion' => 'Se ingresó la causa',
            'foja' => '1',
            'pdf_principal' => 'archivo.pdf',
            'pdf_anexo' => null
        ]
    ]
];

$pdfs = [
    'archivo.pdf' => 'base64_encoded_content...'
];
```

---

## 🆚 Comparación con PJUD Real

| Característica | PJUD Oficial | Este Template |
|---------------|--------------|---------------|
| Tabla de movimientos | ✅ | ✅ |
| Columna Folio | ✅ | ✅ |
| Iconos PDF | ✅ | ✅ (Azul/Rojo) |
| Filtros | ✅ | ✅ (Avanzados) |
| Estado de causa | ✅ | ✅ |
| Información causa | ✅ | ✅ |
| Responsive | ✅ | ✅ |
| Exportar/Imprimir | ⚠️ | ✅ |

---

## 💡 Mejoras Futuras

- [ ] Timeline visual de movimientos
- [ ] Gráficos de progreso de causa
- [ ] Notificaciones de nuevos movimientos
- [ ] Comparación entre causas
- [ ] Exportación a Excel/PDF
- [ ] Búsqueda avanzada
- [ ] Modo oscuro

---

## 📸 Preview

El diseño incluye:
- Header azul corporativo
- Cards informativas blancas
- Tabla profesional con hover
- Modal de PDF elegante
- Filtros en tiempo real
- Estadísticas visuales

---

## 🐛 Solución de Problemas

### Los PDFs no se muestran
- Verifica que los PDFs estén en base64 en `$pdfs`
- Verifica el token de autenticación

### Filtros no funcionan
- Verifica que jQuery esté cargado
- Revisa la consola del navegador

### Diseño se ve mal
- Verifica que Bootstrap 4.6 esté cargado
- Verifica que Font Awesome esté cargado

---

## 📚 Recursos

- [Bootstrap 4.6 Docs](https://getbootstrap.com/docs/4.6/)
- [Font Awesome 4.7](https://fontawesome.com/v4.7/icons/)
- [PJUD Oficial](https://oficinajudicialvirtual.pjud.cl/)

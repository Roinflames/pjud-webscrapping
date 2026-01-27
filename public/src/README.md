# Estructura del Proyecto

Este proyecto utiliza el patrón arquitectónico **Controller-Entity-Form-Repository**.

## Estructura de Directorios

```
src/
├── Config/          # Configuración (conexión a base de datos)
├── Entity/          # Entidades de dominio (Causa, Movimiento, PDF, Ebook)
├── Repository/      # Acceso a datos (CausaRepository, MovimientoRepository, etc.)
├── Form/            # Validación de formularios (CausaForm)
├── Controller/      # Controladores (CausaController)
└── autoload.php     # Autoloader para cargar clases automáticamente
```

## Componentes

### Config
- **Database.php**: Gestiona la conexión a la base de datos usando PDO (patrón Singleton)

### Entity
Representan las entidades de dominio del sistema:
- **Causa.php**: Entidad que representa una causa judicial
- **Movimiento.php**: Entidad que representa un movimiento de una causa
- **PDF.php**: Entidad que representa un documento PDF
- **Ebook.php**: Entidad que representa un ebook

Cada entidad tiene:
- Propiedades privadas con getters/setters
- Método `toArray()` para convertir a array
- Método estático `fromArray()` para crear desde array

### Repository
Contienen la lógica de acceso a datos:
- **CausaRepository.php**: Operaciones con causas (findByRit, findAll)
- **MovimientoRepository.php**: Operaciones con movimientos (findByRit, getCuadernosByRit)
- **PDFRepository.php**: Operaciones con PDFs (findByRitIndiceTipo, findByMovimientoId)
- **EbookRepository.php**: Operaciones con ebooks (findByRit)

### Form
- **CausaForm.php**: Valida y procesa parámetros de peticiones relacionadas con causas
  - Valida RIT, action, índices, tipos, formatos
  - Retorna errores de validación

### Controller
- **CausaController.php**: Maneja las peticiones HTTP relacionadas con causas
  - `handleRequest()`: Punto de entrada principal
  - `handlePdfRequest()`: Maneja peticiones de PDFs
  - `handleMovimientosRequest()`: Maneja peticiones de movimientos
  - `formatResponse()`: Formatea la respuesta JSON

## Uso

### Ejemplo de uso en un endpoint:

```php
<?php
require_once __DIR__ . '/../src/autoload.php';

use App\Controller\CausaController;

$controller = new CausaController();
$controller->handleRequest($_GET);
```

## Flujo de Datos

1. **Request** → El endpoint recibe parámetros GET
2. **Form** → CausaForm valida los parámetros
3. **Controller** → CausaController procesa la petición
4. **Repository** → Los repositories obtienen datos de la base de datos
5. **Entity** → Los datos se convierten en entidades
6. **Response** → El controller formatea y retorna la respuesta JSON

## Ventajas de esta Estructura

- **Separación de responsabilidades**: Cada clase tiene una responsabilidad única
- **Reutilización**: Los repositories pueden ser usados por múltiples controllers
- **Testabilidad**: Fácil de testear cada componente por separado
- **Mantenibilidad**: Código organizado y fácil de mantener
- **Escalabilidad**: Fácil agregar nuevas entidades, repositories o controllers

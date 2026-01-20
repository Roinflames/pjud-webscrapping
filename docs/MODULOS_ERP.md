# 📦 Módulos ERP - Integración PJUD

## 🎯 Descripción

Sistema modular reutilizable para integrar funcionalidades de scraping PJUD en un ERP existente. Los módulos están diseñados con **Bootstrap 4.6** y son completamente independientes.

---

## 📋 Módulos Disponibles

### 1. **Visualización de Casos** (`visualizacion-casos.js`)

Módulo completo para visualizar y filtrar causas procesadas.

#### Características:
- ✅ Filtros por RIT, Abogado ID, Competencia, Tribunal
- ✅ Filtros de estado (válidas, con movimientos)
- ✅ Tabla responsiva con Bootstrap 4.6
- ✅ Modal de movimientos procesales
- ✅ Vista de PDFs directamente en el navegador
- ✅ Completamente modular y reutilizable

#### Uso:

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
</head>
<body>
    <div id="mi-contenedor-casos"></div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/modules/visualizacion-casos.js"></script>
    
    <script>
        const viewer = new VisualizacionCasos({
            apiBase: '/api/mvp'
        });
        viewer.render('#mi-contenedor-casos');
    </script>
</body>
</html>
```

#### API Endpoints Utilizados:
- `GET /api/mvp/causas` - Listar causas con filtros
- `GET /api/mvp/movimientos/:rit` - Obtener movimientos de un RIT

---

### 2. **Crear Evento de Scraping** (`crear-evento-scraping.js`)

Formulario para solicitar scraping específico mediante eventos en MariaDB.

#### Características:
- ✅ Formulario completo con validación
- ✅ Campos: RIT, Competencia, Corte, Tribunal, Tipo Causa, Abogado ID
- ✅ Prioridad configurable (1-10)
- ✅ Metadata adicional en JSON
- ✅ Feedback visual de éxito/error

#### Uso:

```html
<div id="mi-formulario-scraping"></div>

<script src="/modules/crear-evento-scraping.js"></script>
<script>
    const eventoCreator = new CrearEventoScraping({
        apiBase: '/api/erp',
        onEventoCreado: function(resultado) {
            console.log('Evento creado:', resultado.evento_id);
            // Actualizar lista, notificar al usuario, etc.
        }
    });
    eventoCreator.render('#mi-formulario-scraping');
</script>
```

#### API Endpoints Utilizados:
- `POST /api/erp/eventos/crear` - Crear evento de scraping

---

## 🔗 Comunicación con ERP

### Sistema de Eventos en MariaDB

El ERP se comunica con el sistema de scraping mediante eventos almacenados en la tabla `pjud_eventos_scraping`.

#### Flujo de Trabajo:

1. **ERP solicita scraping** → Crea evento en `pjud_eventos_scraping`
2. **Worker procesa eventos** → Lee eventos pendientes una vez al día
3. **Worker ejecuta scraping** → Procesa RIT según prioridad
4. **Worker actualiza evento** → Marca como completado o error
5. **ERP consulta estado** → Verifica resultado del scraping

#### Crear Evento desde ERP:

```javascript
// Opción 1: Usar API REST
const response = await fetch('/api/erp/eventos/crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        rit: 'C-12345-2020',
        competencia_id: 3,
        corte_id: 90,
        tribunal_id: 276,
        tipo_causa: 'C',
        abogado_id: 123,
        prioridad: 7,
        erp_origen: 'ERP_NOMBRE',
        erp_usuario_id: 456,
        metadata: {
            cliente_id: 789,
            nota: 'Causa importante'
        }
    })
});

// Opción 2: Usar procedimiento almacenado directamente
CALL sp_crear_evento_scraping(
    'C-12345-2020',  -- rit
    3,               -- competencia_id
    90,              -- corte_id
    276,             -- tribunal_id
    'C',             -- tipo_causa
    123,             -- abogado_id
    NULL,            -- causa_id
    NULL,            -- agenda_id
    'ERP_NOMBRE',    -- erp_origen
    456,             -- erp_usuario_id
    7,               -- prioridad
    '{"nota": "..."}' -- metadata (JSON)
);
```

#### Consultar Estado del Evento:

```javascript
// Consultar por ID
const response = await fetch('/api/erp/eventos/123');
const data = await response.json();

console.log(data.evento.estado); // PENDIENTE, PROCESANDO, COMPLETADO, ERROR
console.log(data.evento.resultado_movimientos); // Cantidad de movimientos
console.log(data.evento.resultado_pdfs); // Cantidad de PDFs descargados
console.log(data.evento.resultado_error); // Mensaje de error si falló
```

#### Listar Eventos con Filtros:

```javascript
// Listar eventos pendientes de un abogado
const response = await fetch('/api/erp/eventos?estado=PENDIENTE&abogado_id=123');
const data = await response.json();

data.eventos.forEach(evento => {
    console.log(`RIT: ${evento.rit}, Estado: ${evento.estado}`);
});
```

---

## 📊 Estructura de la Tabla de Eventos

```sql
CREATE TABLE pjud_eventos_scraping (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_tipo ENUM('SCRAPING_ESPECIFICO', 'SCRAPING_MASIVO', 'CONSULTA_ESTADO'),
  rit VARCHAR(50) NOT NULL,
  competencia_id INT,
  corte_id INT,
  tribunal_id INT,
  tipo_causa VARCHAR(10) DEFAULT 'C',
  abogado_id INT,
  causa_id INT,
  agenda_id INT,
  estado ENUM('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR', 'CANCELADO'),
  prioridad INT DEFAULT 5,
  erp_origen VARCHAR(100),
  erp_usuario_id INT,
  erp_metadata TEXT,
  resultado_rit VARCHAR(50),
  resultado_movimientos INT,
  resultado_pdfs INT,
  resultado_error TEXT,
  resultado_data JSON,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_procesamiento DATETIME,
  fecha_completado DATETIME
);
```

---

## 🚀 Instalación

### 1. Crear Tabla de Eventos

```bash
mysql -u root -p codi_ejamtest < docs/sql/tabla_eventos_scraping.sql
```

### 2. Incluir Módulos en tu ERP

```html
<!-- En el HTML de tu ERP -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">

<!-- Incluir módulos desde tu servidor -->
<script src="https://tu-servidor-pjud/modules/visualizacion-casos.js"></script>
<script src="https://tu-servidor-pjud/modules/crear-evento-scraping.js"></script>
```

### 3. Inicializar Módulos

```javascript
// En tu JavaScript del ERP
const visualizacionCasos = new VisualizacionCasos({
    apiBase: 'https://tu-servidor-pjud/api/mvp'
});
visualizacionCasos.render('#contenedor-casos');

const crearEvento = new CrearEventoScraping({
    apiBase: 'https://tu-servidor-pjud/api/erp',
    onEventoCreado: function(resultado) {
        // Callback cuando se crea un evento
        alert(`Evento creado: ${resultado.evento_id}`);
    }
});
crearEvento.render('#contenedor-formulario');
```

---

## 📝 Ejemplo Completo de Integración

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ERP - Integración PJUD</title>
    
    <!-- Bootstrap 4.6 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
</head>
<body>
    <nav class="navbar navbar-dark bg-dark">
        <span class="navbar-brand">Tu ERP</span>
    </nav>

    <div class="container-fluid mt-4">
        <!-- Módulo de Visualización de Casos -->
        <div class="row mb-4">
            <div class="col-12">
                <h2>Causas Procesadas</h2>
                <div id="module-casos"></div>
            </div>
        </div>

        <!-- Módulo de Crear Evento -->
        <div class="row">
            <div class="col-12">
                <h2>Solicitar Scraping</h2>
                <div id="module-crear-evento"></div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Módulos PJUD -->
    <script src="https://tu-servidor-pjud/modules/visualizacion-casos.js"></script>
    <script src="https://tu-servidor-pjud/modules/crear-evento-scraping.js"></script>
    
    <script>
        // Configuración
        const PJUD_API = 'https://tu-servidor-pjud/api';

        // Inicializar módulos
        const viewer = new VisualizacionCasos({
            apiBase: `${PJUD_API}/mvp`
        });
        viewer.render('#module-casos');

        const eventoCreator = new CrearEventoScraping({
            apiBase: `${PJUD_API}/erp`,
            onEventoCreado: function(resultado) {
                // Recargar visualización
                viewer.recargar();
                
                // Mostrar notificación
                alert(`Evento de scraping creado: ${resultado.evento_id}`);
            }
        });
        eventoCreator.render('#module-crear-evento');
    </script>
</body>
</html>
```

---

## 🔧 Configuración del Worker

El worker debe procesar eventos una vez al día (o en tiempo real). Ver `src/worker_eventos.js` (pendiente de implementar).

---

## ✅ Checklist de Integración

- [ ] Tabla `pjud_eventos_scraping` creada en MariaDB
- [ ] Procedimientos almacenados creados
- [ ] Módulos JS accesibles desde el ERP
- [ ] API `/api/erp` configurada y accesible
- [ ] Worker configurado para procesar eventos
- [ ] Filtros por RIT y abogado_id funcionando
- [ ] Modal de movimientos funcionando
- [ ] PDFs se visualizan correctamente

---

## 📚 Documentación Adicional

- `docs/sql/tabla_eventos_scraping.sql` - Script SQL completo
- `src/modules/visualizacion-casos.js` - Código fuente del módulo
- `src/modules/crear-evento-scraping.js` - Código fuente del módulo
- `src/api/erp-api.js` - Endpoints de la API ERP

# Estructura del Proyecto PJUD Web Scraping

## Estructura de Carpetas

```
pjud-webscrapping/
│
├── 📁 database/                    # Base de datos
│   └── schema_mariadb_5.5.sql     # Schema compatible con MariaDB 5.5.68
│
├── 📁 src/                         # Código fuente principal
│   │
│   ├── 📁 api/                     # API REST
│   │   ├── server.js              # Servidor Express
│   │   ├── scraping-api.js        # Endpoints de scraping
│   │   ├── mvp-api.js             # API MVP
│   │   ├── erp-api.js             # Integración ERP
│   │   ├── storage.js             # Almacenamiento de resultados
│   │   ├── db-service.js          # Servicio de base de datos
│   │   ├── auth.js                # Autenticación
│   │   ├── 📁 public/             # Frontend estático
│   │   │   ├── mvp-dashboard.html
│   │   │   ├── demo-movimientos.html
│   │   │   ├── 📁 css/
│   │   │   └── 📁 js/
│   │   ├── 📁 views/              # Vistas HTML
│   │   └── 📁 templates/          # Templates para integración
│   │
│   ├── 📁 config/                  # Configuración
│   │   ├── pjud_config.json       # Config de causa individual
│   │   └── causas_test.json       # 5 causas de prueba
│   │
│   ├── 📁 database/                # Servicios de BD
│   │   └── db-mariadb.js          # Servicio MariaDB 5.5
│   │
│   ├── 📁 test/                    # Pruebas
│   │   ├── run-tests.js           # Runner de pruebas
│   │   ├── scraper-5-causas.js    # Test de 5 causas
│   │   └── 📁 unit/               # Pruebas unitarias
│   │       ├── test-data-processor.js
│   │       ├── test-error-registry.js
│   │       └── test-etapas-juicio.js
│   │
│   ├── 📁 outputs/                 # Resultados del scraping
│   │   ├── 📁 pdfs/               # PDFs descargados
│   │   └── 📁 ebooks/             # eBooks descargados
│   │
│   ├── 📁 logs/                    # Logs y evidencia de errores
│   │   └── errores_scraping.json  # Registro de errores
│   │
│   ├── 📁 modules/                 # Módulos auxiliares
│   ├── 📁 monitoring/              # Monitoreo y métricas
│   ├── 📁 mvp/                     # Componentes MVP
│   ├── 📁 utils/                   # Utilidades
│   │
│   │── # Archivos principales de scraping
│   ├── index.js                   # Entrada principal
│   ├── browser.js                 # Configuración del navegador
│   ├── form.js                    # Llenado de formularios
│   ├── navigation.js              # Navegación
│   ├── table.js                   # Extracción de tablas
│   ├── pdfDownloader.js           # Descarga de PDFs
│   ├── ebook.js                   # Descarga de eBooks
│   ├── exporter.js                # Exportación de datos
│   ├── dataProcessor.js           # Procesamiento de datos
│   ├── scraper_batch.js           # Scraping por lotes
│   └── scraping_masivo.js         # Scraping masivo
│
├── 📁 scripts/                     # Scripts de administración
│   ├── control-servicios.sh       # Control de servicios
│   ├── monitor-recursos.sh        # Monitoreo de recursos
│   ├── setup-server.sh            # Setup del servidor
│   └── test-carga.js              # Tests de carga
│
├── 📁 docs/                        # Documentación
│   └── 📁 sql/                    # Scripts SQL adicionales
│
├── 📁 grafana/                     # Configuración Grafana
├── 📁 assets/                      # Recursos estáticos
├── 📁 backups/                     # Backups
│
├── # Archivos de configuración
├── .env                           # Variables de entorno (no en git)
├── .env.example                   # Ejemplo de variables
├── .gitignore
├── package.json
├── docker-compose.yml
│
├── # Archivos de datos
├── causa.csv                      # CSV completo de causas
├── causa_validas.csv              # CSV de causas válidas
└── causa_invalidas.csv            # CSV de causas inválidas
```

## Scripts Disponibles

### Pruebas
```bash
npm test                    # Ejecutar todas las pruebas unitarias
npm run test:unit           # Alias de npm test
npm run test:5causas        # Ejecutar scraping de 5 causas de prueba
npm run test:5causas:dry    # Dry-run (sin ejecutar scraping real)
```

### Scraping
```bash
npm run scrape              # Scraping de una causa (config/pjud_config.json)
npm run scrape:batch        # Scraping por lotes desde CSV
npm run scrape:masivo       # Scraping masivo
npm run scrape:test         # Alias de test:5causas
```

### Base de Datos
```bash
npm run db:setup            # Crear schema en MySQL/MariaDB
npm run db:test             # Probar conexión a BD
npm run importar:movimientos # Importar movimientos a BD
```

### API
```bash
npm run api:start           # Iniciar servidor API (puerto 3000)
npm run api:listener        # Iniciar listener de eventos
```

### Servicios
```bash
npm run services:start      # Iniciar servicios
npm run services:stop       # Detener servicios
npm run services:status     # Ver estado de servicios
npm run monitor             # Monitorear recursos
```

## Configuración

### Variables de Entorno (.env)
```env
# URL del PJUD
OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php

# Base de datos (MariaDB 5.5.68)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=pjud_scraping

# API
API_PORT=3000
API_HOST=0.0.0.0

# Scraper
SCRAPER_HEADLESS=true
SCRAPER_SLOWMO=100
SCRAPER_DELAY_MS=2500
SCRAPER_DELAY_JITTER_MS=2000
SCRAPER_CAPTURE=false
```

## 5 Causas de Prueba

Las causas de prueba están definidas en `src/config/causas_test.json`:

| RIT | Tribunal | Corte |
|-----|----------|-------|
| C-3030-2017 | 3º Juzgado Civil de Viña del Mar | C.A. de Valparaíso |
| C-27311-2019 | 3º Juzgado de Letras de Iquique | C.A. de Iquique |
| C-571-2019 | 3º Juzgado de Letras de Talca | C.A. de Talca |
| C-9473-2019 | 1º Juzgado de Letras de Copiapó | C.A. de Copiapó |
| C-16322-2017 | 1º Juzgado de Letras de Vallenar | C.A. de Copiapó |

## Etapas del Juicio

Los movimientos se clasifican automáticamente en las siguientes etapas:

1. **INGRESO** - Ingreso de la demanda
2. **INICIO_TRAMITACION** - Inicio formal del proceso
3. **NOTIFICACION** - Notificación de demanda
4. **EXCEPCIONES** - Presentación de excepciones
5. **CONTESTACION** - Contestación de la demanda
6. **CONCILIACION** - Audiencia de conciliación
7. **PROBATORIO** - Período probatorio
8. **AUDIENCIA** - Audiencias del proceso
9. **DISCUSION** - Alegatos y discusión
10. **SENTENCIA** - Dictación de sentencia
11. **RECURSOS** - Recursos procesales
12. **CUMPLIMIENTO** - Etapa de cumplimiento
13. **TERMINADA** - Causa terminada

## Sistema de Registro de Errores

El sistema registra errores para evitar loops infinitos:

- Archivo: `src/logs/errores_scraping.json`
- Máximo de reintentos: 3 por defecto
- Los errores se marcan como resueltos automáticamente tras un scraping exitoso

## Compatibilidad

- **Node.js**: 14+
- **MariaDB**: 5.5.68 (CentOS 7.9)
- **Apache**: 2.4.6
- **PHP**: 7.4.33 (para integración con ERP)

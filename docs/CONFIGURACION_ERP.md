# 🔌 Configuración de Integración con ERP

## Descripción General

Este sistema permite que el ERP se comunique con el sistema de scraping del PJUD mediante eventos en MariaDB. Cuando el ERP inserta un nuevo contrato, automáticamente se inicia el proceso de scraping y los resultados se entregan vía API.

## Arquitectura

```
ERP Base de Datos (MariaDB)
    ↓
[Nuevo contrato insertado]
    ↓
[Trigger o Listener ERP detecta] → Crea evento en pjud_eventos_scraping
    ↓
[Worker Eventos procesa scraping]
    ↓
[Resultados guardados]
    ↓
[ERP consulta resultados vía API]
```

## Componentes

### 1. Listener ERP (`listener-erp.js`)
- Se conecta a la base de datos del ERP
- Monitorea la tabla de contratos (configurable)
- Detecta nuevos contratos (`contrato_id`)
- Crea eventos en `pjud_eventos_scraping`

### 2. Worker de Eventos (`worker-eventos.js`)
- Procesa eventos pendientes de `pjud_eventos_scraping`
- Ejecuta el scraping del PJUD
- Actualiza el estado del evento con los resultados

### 3. API ERP (`erp-api.js`)
- Endpoints para consultar estado de eventos
- Endpoints para obtener resultados del scraping
- Endpoints para listar eventos con filtros

## Configuración

### Variables de Entorno (.env)

```env
# Base de datos del ERP
ERP_DB_HOST=localhost
ERP_DB_USER=erp_user
ERP_DB_PASSWORD=erp_password
ERP_DB_NAME=erp_database
ERP_DB_PORT=3306

# Base de datos PJUD (nuestra BD)
DB_HOST=localhost
DB_USER=pjud_user
DB_PASSWORD=pjud_password
DB_NAME=codi_ejamtest
DB_PORT=3306
```

### Tabla del ERP

El listener espera una tabla con los siguientes campos (ajustables según tu esquema):

- `id` o `contrato_id` - ID único del contrato
- `id_causa` o `rit` - RIT de la causa (obligatorio)
- `competencia_id` o `materia_estrategia_id` - ID de competencia
- `corte_id` - ID de la corte
- `tribunal_id` o `juzgado_id` - ID del tribunal
- `tipo_causa` o `letra` - Tipo de causa (ej: 'C' para Civil)
- `abogado_id` o `usuario_id` - ID del abogado
- `causa_id` - ID de la causa relacionada
- `created_at` o `fecha_creacion` - Fecha de creación

## Opciones de Implementación

### Opción A: Trigger en MariaDB (Recomendado si ambas BD están en el mismo servidor)

Si ambas bases de datos están en el mismo servidor MariaDB, puedes usar un trigger:

1. Ejecuta el script SQL del trigger:
```bash
mysql -u root -p erp_database < docs/sql/trigger-erp-contrato.sql
```

El trigger automáticamente creará un evento cuando se inserte un nuevo contrato.

### Opción B: Listener con Polling (Recomendado si las BD están en servidores diferentes)

Si las bases de datos están en servidores diferentes, usa el listener:

1. Configura las variables `ERP_DB_*` en `.env`
2. Inicia el listener:
```bash
pm2 start ecosystem.config.js --only listener-erp
```

El listener consulta periódicamente la tabla de contratos del ERP.

## Iniciar Servicios

```bash
# Iniciar todos los servicios
pm2 start ecosystem.config.js

# Iniciar solo los servicios de ERP
pm2 start ecosystem.config.js --only listener-erp worker-eventos

# Ver logs
pm2 logs listener-erp
pm2 logs worker-eventos
```

## Endpoints de API

### Obtener Estado de un Evento

```http
GET /api/erp/eventos/:id
```

**Respuesta:**
```json
{
  "success": true,
  "evento": {
    "id": 1,
    "rit": "C-12345-2020",
    "estado": "COMPLETADO",
    "resultado_movimientos": 18,
    "resultado_pdfs": 21,
    "fecha_completado": "2025-01-19T10:30:00.000Z"
  },
  "resultado": {
    "rit": "C-12345-2020",
    "total_movimientos": 18,
    "movimientos": [...]
  }
}
```

### Obtener Resultado por RIT

```http
GET /api/erp/eventos/resultado/:rit
```

**Respuesta:**
```json
{
  "success": true,
  "resultado": {
    "rit": "C-12345-2020",
    "movimientos": [...],
    "cabecera": {...},
    "estado_actual": {...},
    "total_movimientos": 18,
    "total_pdfs": 21
  }
}
```

### Listar Eventos

```http
GET /api/erp/eventos?estado=COMPLETADO&rit=C-12345-2020
```

## Flujo Completo

1. **ERP inserta contrato** → Se inserta registro en tabla `contrato` del ERP
2. **Trigger/Listener detecta** → Crea evento en `pjud_eventos_scraping` (estado: PENDIENTE)
3. **Worker procesa evento** → Ejecuta scraping del PJUD (estado: PROCESANDO)
4. **Worker completa** → Actualiza evento con resultados (estado: COMPLETADO)
5. **ERP consulta API** → Obtiene resultados del scraping completado

## Validación de Datos

El sistema valida que el contrato tenga los 6 campos requeridos del PJUD:

- ✅ `rit` (obligatorio)
- ✅ `competencia` (obligatorio)
- ✅ `corte` (obligatorio)
- ✅ `tribunal` (obligatorio)
- ✅ `tipoCausa` (obligatorio)
- ✅ `caratulado` (se obtiene del scraping)

Si faltan campos, el evento se descarta con un mensaje de error detallado.

## Solución de Problemas

### El listener no detecta nuevos contratos

1. Verifica las variables `ERP_DB_*` en `.env`
2. Verifica que la tabla existe en el ERP: `SHOW TABLES LIKE 'contrato';`
3. Revisa los logs: `pm2 logs listener-erp`

### Los eventos no se procesan

1. Verifica que el worker de eventos está corriendo: `pm2 status worker-eventos`
2. Revisa los logs: `pm2 logs worker-eventos`
3. Verifica eventos pendientes: `SELECT * FROM pjud_eventos_scraping WHERE estado = 'PENDIENTE';`

### No se pueden obtener resultados

1. Verifica que el scraping se completó: `SELECT * FROM pjud_eventos_scraping WHERE rit = 'TU-RIT';`
2. Verifica que los archivos existen: `ls src/outputs/movimientos_TU_RIT.json`
3. Revisa los logs del worker para errores

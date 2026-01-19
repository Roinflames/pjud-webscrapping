# API y Listener Automático - Sistema PJUD

Este directorio contiene el servidor API para exponer datos de tribunales y un listener que detecta automáticamente nuevos contratos en la base de datos.

## 📋 Componentes

### 1. **API Server** (`server.js`)
Servidor Express que expone los datos de tribunales extraídos mediante endpoints REST.

### 2. **Database Listener** (`listener.js`)
Listener que monitorea cambios en la base de datos y automáticamente agrega nuevos contratos/causas a la cola de scraping.

---

## 🚀 Instalación

Primero, instala las dependencias necesarias:

```bash
npm install
```

Esto instalará:
- `express` - Servidor HTTP
- `cors` - Soporte CORS para la API

---

## 🎯 Uso de la API

### Iniciar el Servidor

```bash
npm run api:start
```

O directamente:

```bash
node src/api/server.js
```

El servidor se iniciará en el puerto **3000** por defecto (configurable con `API_PORT` en `.env`).

### Acceder a la Interfaz Web

Una vez iniciado el servidor, abre tu navegador en:
```
http://localhost:3000
```

Podrás ver:
- Dashboard con estadísticas
- Interfaz para exportar datos (JSON/CSV)
- Enlaces a todos los endpoints
- Documentación integrada

### Endpoints Disponibles

#### Health Check
```http
GET /api/health
```

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "2024-01-16T12:00:00.000Z",
  "tribunales_cargados": 1500
}
```

#### Listar Competencias
```http
GET /api/competencias
```

Respuesta:
```json
{
  "competencias": [
    { "id": "1", "nombre": "Corte Suprema" },
    { "id": "3", "nombre": "Civil" },
    ...
  ],
  "total": 7
}
```

#### Listar Cortes
```http
GET /api/cortes
```

#### Listar Todos los Tribunales
```http
GET /api/tribunales
GET /api/tribunales?competencia_id=3
GET /api/tribunales?corte_id=90
GET /api/tribunales?nombre=Santiago
GET /api/tribunales?page=1&limit=50
```

#### Obtener Tribunal por ID
```http
GET /api/tribunales/276
```

#### Buscar Tribunales
```http
GET /api/tribunales/buscar?q=Santiago
GET /api/tribunales/buscar?competencia_id=3&corte_id=90
```

#### Tribunales por Corte
```http
GET /api/tribunales/por-corte/90
```

#### Tribunales por Competencia
```http
GET /api/tribunales/por-competencia/3
```

#### Recargar Datos
```http
POST /api/tribunales/recargar
```

#### Exportar Datos (Nuevo)
```http
GET /api/exportar/json?competencia_id=3&corte_id=90
GET /api/exportar/csv?competencia_id=3&corte_id=90
```

**Parámetros opcionales:**
- `competencia_id` - Filtrar por competencia
- `corte_id` - Filtrar por corte

**Respuesta:**
- JSON: Archivo descargable en formato JSON
- CSV: Archivo descargable en formato CSV (compatible con Excel)

---

## 🌐 Interfaz Web

El servidor incluye una interfaz web para facilitar la exportación de datos.

### Acceder a la Interfaz

Simplemente abre en tu navegador:
```
http://localhost:3000
```

### Funcionalidades de la Interfaz

- **Dashboard**: Muestra estadísticas de tribunales, competencias y cortes
- **Exportación de Datos**: 
  - Exportar todos los tribunales en JSON o CSV
  - Filtrar por competencia y/o corte antes de exportar
- **Enlaces Rápidos**: Acceso directo a los endpoints principales
- **Documentación**: Lista completa de endpoints disponibles

---

## 👂 Uso del Listener

El listener monitorea la base de datos para detectar nuevos contratos/causas y automáticamente los agrega a la cola de scraping.

### Iniciar Listener (tabla `causa` por defecto)

```bash
npm run api:listener
```

O directamente:

```bash
node src/api/listener.js
```

### Configurar Tabla a Monitorear

```bash
# Monitorear tabla 'causa'
npm run api:listener:causa

# Monitorear tabla 'agenda'
npm run api:listener:agenda

# O especificar manualmente
node src/api/listener.js --table nombre_tabla
```

### Configurar Intervalo de Verificación

```bash
# Verificar cada 5 segundos
node src/api/listener.js --interval 5000

# Verificar cada 30 segundos
node src/api/listener.js --interval 30000
```

### Configurar Campo de Fecha

Si tu tabla usa un campo diferente para la fecha:

```bash
node src/api/listener.js --table causa --date-field fecha_creacion
```

---

## 🔧 Configuración

### Variables de Entorno

Asegúrate de tener configurado tu archivo `.env`:

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=codi_ejamtest
DB_PORT=3306

# API
API_PORT=3000
```

### Estructura de Tabla Esperada

El listener espera que la tabla monitoreada tenga:

- Campo de fecha: `created_at`, `updated_at`, o el especificado con `--date-field`
- Campos para RIT: `id_causa`, `rit`, o `rol` + `anio`/`ano`
- Campos opcionales: `competencia_id`, `corte_id`, `tribunal_id`, `tipo_causa`

---

## 📊 Flujo Completo

1. **Extraer Tribunales** (una vez):
   ```bash
   node src/extraer-tribunales-http.js
   ```

2. **Iniciar API** (opcional, para consultar tribunales):
   ```bash
   npm run api:start
   ```

3. **Iniciar Listener** (monitorea BD y agrega a cola):
   ```bash
   npm run api:listener
   ```

4. **Iniciar Worker** (procesa la cola de scraping):
   ```bash
   node src/worker_cola_scraping.js
   ```

---

## 🔍 Ejemplos de Uso

### Ejemplo 1: Consultar Tribunales por API

```bash
# Iniciar API
npm run api:start

# En otra terminal, consultar tribunales
curl http://localhost:3000/api/tribunales?competencia_id=3
curl http://localhost:3000/api/tribunales/por-corte/90
```

### Ejemplo 2: Detección Automática de Nuevos Contratos

```bash
# Terminal 1: Iniciar listener (monitorea tabla 'causa')
npm run api:listener

# Terminal 2: Iniciar worker (procesa cola de scraping)
node src/worker_cola_scraping.js

# Cuando se inserte un nuevo contrato en la tabla 'causa',
# el listener lo detectará y lo agregará automáticamente a la cola.
```

### Ejemplo 3: Monitorear Tabla Personalizada

```bash
# Monitorear tabla 'agenda' cada 5 segundos
node src/api/listener.js --table agenda --interval 5000
```

---

## 🐛 Solución de Problemas

### Error: "Datos de tribunales no disponibles"

**Solución**: Ejecuta primero el script de extracción:
```bash
node src/extraer-tribunales-http.js
```

### Error: "Table doesn't exist"

**Solución**: 
1. Verifica que la tabla exista: `SHOW TABLES;`
2. Especifica la tabla correcta: `--table nombre_tabla`
3. Verifica el campo de fecha: `--date-field nombre_campo`

### El listener no detecta nuevos registros

**Solución**:
1. Verifica que la tabla tenga un campo de fecha (`created_at`, `updated_at`, etc.)
2. Verifica que el intervalo de verificación sea adecuado
3. Verifica los logs del listener para ver qué está buscando

### Puerto 3000 ya está en uso

**Solución**: Cambia el puerto en `.env`:
```env
API_PORT=3001
```

---

## 📝 Notas

- El listener usa **polling** para detectar cambios (verifica periódicamente)
- Los registros procesados se mantienen en memoria para evitar duplicados
- El listener se reinicia al reiniciar el proceso
- La API carga los datos de tribunales al iniciar (usa `POST /api/tribunales/recargar` para recargar)

---

## 🔐 Seguridad

Por defecto, la API acepta peticiones desde cualquier origen (CORS habilitado). Para producción, considera:

1. Configurar CORS específico
2. Agregar autenticación (API keys, JWT, etc.)
3. Implementar rate limiting
4. Usar HTTPS


# Integración MySQL con Puerto 8000

## Resumen de Cambios

Se ha completado exitosamente la integración de MySQL con el frontend del puerto 8000, manteniendo su diseño original mientras se pobla desde la base de datos.

## Arquitectura

### Puerto 3000 (API Node.js)
- **Fuente de datos**: Archivos JSON en `src/outputs/`
- **Servidor**: Express.js
- **Endpoint demo**: `http://localhost:3000/demo`

### Puerto 8000 (Frontend PHP)
- **Fuente de datos**: Base de datos MySQL `codi_ejamtest`
- **Servidor**: PHP built-in server
- **Frontend**: `public/index.php`

## Archivos Modificados

### 1. Base de Datos
- **Archivo**: `database/schema_mariadb_5.5.sql`
- **Acción**: Se importó el schema completo con las tablas:
  - `causas` - Información principal de cada causa
  - `movimientos` - Movimientos procesales de cada causa
  - `pdfs` - PDFs asociados a movimientos
  - `ebooks` - eBooks de causas completas

### 2. Script de Población
- **Archivo**: `poblar_datos_prueba.sql`
- **Acción**: Script SQL que pobla la BD con 2 causas de prueba:
  - C-16707-2019 (10 movimientos)
  - C-13786-2018 (8 movimientos)

### 3. API PHP - Listar Causas
- **Archivo**: `public/api/listar_causas.php` (NUEVO)
- **Función**: Devuelve todas las causas desde MySQL
- **Formato de salida**:
```json
{
  "success": true,
  "causas": [
    {
      "id": 6,
      "rit": "C-16707-2019",
      "folio": 20212,
      "cliente": "GUTIERREZ RAMOS CARLOS DOMINGO",
      "rut": "8.462.961-8",
      "abogado": "Tatiana Gonzalez",
      "juzgado": "PROMOTORA CMR FALABELLA",
      "tribunal_nombre": "27 Juzgado Civil de Santiago",
      "fecha_ingreso": "02/07/2019",
      "estado": "TERMINADA",
      "total_movimientos": 10,
      "total_pdfs": 5
    }
  ],
  "total": 2
}
```

### 4. API PHP - Detalle Causa
- **Archivo**: `public/api/causa.php` (MODIFICADO)
- **Cambios**:
  - Se mantiene compatibilidad con formato legacy (array de arrays)
  - Se agregó nueva estructura con formato `legacy` y formato estructurado
  - Se corrigieron warnings de PHP 8 con `fgetcsv`
  - Prioriza MySQL sobre archivos JSON

- **Formato de salida**:
```json
{
  "legacy": [
    [],
    ["", "C-16707-2019", "02/07/2019", "PROMOTORA...", "27 Juzgado..."],
    ["1", "Descargar Documento", "1", "Ejecución", "Sentencia", "..."]
  ],
  "causa": {
    "rit": "C-16707-2019",
    "caratulado": "PROMOTORA CMR...",
    "tribunal": "27 Juzgado Civil...",
    "estado": "TERMINADA"
  },
  "movimientos": [...]
}
```

### 5. Frontend HTML/JavaScript
- **Archivo**: `public/index.php` (MODIFICADO)
- **Cambios**:
  1. Tabla de causas ahora se carga dinámicamente desde MySQL
  2. Se agregó función `cargarCausas()` que hace fetch a `/api/listar_causas.php`
  3. Se modificó `buscarCausa()` para usar el formato `legacy` de la nueva API
  4. Se mantiene 100% del diseño original (CSS, estructura HTML, modal)

## Flujo de Datos

```
MySQL (codi_ejamtest)
    ↓
public/api/listar_causas.php → JSON
    ↓
public/index.php (JavaScript fetch)
    ↓
Renderiza tabla <tbody id="tablaCausas">
    ↓
Click en botón 👁 (ver causa)
    ↓
public/api/causa.php?rol=RIT → JSON (formato legacy)
    ↓
Modal muestra movimientos
```

## Comandos de Ejecución

### 1. Crear/Poblar Base de Datos
```bash
# Crear BD y schema
mysql -u root -e "CREATE DATABASE IF NOT EXISTS codi_ejamtest DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;"
mysql -u root codi_ejamtest < database/schema_mariadb_5.5.sql

# Poblar datos de prueba
mysql -u root codi_ejamtest < poblar_datos_prueba.sql
```

### 2. Iniciar Servidor PHP (Puerto 8000)
```bash
php -S localhost:8000 -t public
```

### 3. Iniciar Servidor Node.js (Puerto 3000)
```bash
node src/api/server.js
```

## Verificación

### 1. Verificar BD
```bash
mysql -u root codi_ejamtest -e "SELECT rit, total_movimientos FROM causas;"
```

### 2. Verificar API
```bash
# Listar causas
curl http://localhost:8000/api/listar_causas.php | jq '.'

# Ver detalle de causa
curl "http://localhost:8000/api/causa.php?rol=C-16707-2019" | jq '.legacy | length'
```

### 3. Verificar Frontend
- Abrir navegador: `http://localhost:8000/`
- Deberían aparecer 2 causas en la tabla
- Click en botón 👁 debe mostrar movimientos en modal

## Compatibilidad

### Formato Legacy (Array de Arrays)
Se mantiene compatibilidad 100% con el formato original esperado por el frontend:

```javascript
[
  [],  // Fila vacía
  ["", "RIT", "Fecha", "Caratulado", "Tribunal"],  // Cabecera
  ["Folio", "PDF?", "Anexo", "Etapa", "Trámite", "Descripción", "Fecha", "Foja", "Georef"]  // Movimiento
]
```

### Dual Source (MySQL + Archivos)
La API mantiene fallback a archivos JSON si:
- MySQL no está disponible
- No hay datos en BD para el RIT solicitado
- Ocurre error de conexión

## Próximos Pasos (Opcional)

1. **Migrar datos reales**: Importar las 3,221 causas del CSV a MySQL
2. **Sincronización**: Script que sincronice scraping Node.js → MySQL
3. **PDFs**: Implementar descarga de PDFs desde MySQL (tabla `pdfs`)
4. **Filtros**: Agregar filtros funcionales en frontend (Compañía, Folio, Cliente, RIT)
5. **Paginación**: Implementar paginación para más de 100 causas

## Variables de Entorno

Crear archivo `.env` con:
```env
DB_HOST=localhost
DB_NAME=codi_ejamtest
DB_USER=root
DB_PASS=
```

## Estado Actual

✅ Base de datos creada y poblada
✅ API PHP retornando datos desde MySQL en formato compatible
✅ Frontend cargando causas dinámicamente
✅ Modal de detalle mostrando movimientos correctamente
✅ Diseño original 100% preservado
✅ Compatibilidad con archivos JSON como fallback

---

**Fecha de integración**: 2026-01-26
**Puerto 3000**: API JSON (archivos)
**Puerto 8000**: Frontend PHP + MySQL

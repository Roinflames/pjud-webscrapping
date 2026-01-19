# 🚀 MVP Completo - Sistema de Scraping PJUD

## ✅ Lo que se ha creado

Se ha desarrollado un MVP completo que integra todas las funcionalidades del sistema de scraping PJUD.

## 📦 Componentes Principales

### 1. **Gestión de Causas** (`src/mvp/causa-manager.js`)
- ✅ Lectura desde CSV (`causa.csv` con 3,221 causas)
- ✅ Validación y normalización automática
- ✅ Cache para mejor rendimiento
- ✅ Estadísticas completas
- ✅ Búsqueda por RIT

### 2. **Sistema de Cola** (`src/mvp/cola-scraping.js`)
- ✅ Cola de scraping masivo
- ✅ Control de límites diarios (150 por defecto)
- ✅ Reintentos automáticos (máx 3)
- ✅ Pausas entre causas (3 segundos)
- ✅ Manejo de errores robusto
- ✅ Persistencia de estado

### 3. **API Completa** (`src/api/mvp-api.js`)
- ✅ Endpoints para causas (listar, buscar, obtener)
- ✅ Endpoints para scraping (individual y masivo)
- ✅ Endpoints para cola (inicializar, procesar, estado)
- ✅ Endpoints para resultados
- ✅ Estadísticas en tiempo real

### 4. **Dashboard Web** (`src/api/public/mvp-dashboard.html`)
- ✅ Interfaz web completa
- ✅ Estadísticas en tiempo real
- ✅ Lista de causas con paginación
- ✅ Ejecución de scraping desde UI
- ✅ Gestión de cola de scraping
- ✅ Filtros y búsqueda

### 5. **Visualización de Movimientos** (`src/api/public/demo-movimientos-completo.html`)
- ✅ Interfaz estilo PJUD
- ✅ Listado masivo (200+ movimientos)
- ✅ Paginación funcional
- ✅ Filtros avanzados
- ✅ Visualización de PDFs

## 🚀 Cómo Usar

### Acceso al Dashboard

1. **Asegúrate que el servidor esté corriendo:**
   ```bash
   ./src/api/gestionar-servidor.sh start
   ```

2. **Abre en tu navegador:**
   ```
   http://localhost:3000/mvp
   ```

### Endpoints Principales

#### Estadísticas
```bash
GET http://localhost:3000/api/mvp/estadisticas
```

#### Listar Causas
```bash
GET http://localhost:3000/api/mvp/causas?limite=50&offset=0
```

#### Ejecutar Scraping Individual
```bash
POST http://localhost:3000/api/mvp/scraping/ejecutar
Content-Type: application/json
Authorization: Bearer TU_TOKEN

{
  "rit": "C-13786-2018"
}
```

#### Inicializar Cola
```bash
POST http://localhost:3000/api/mvp/cola/inicializar
Content-Type: application/json
Authorization: Bearer TU_TOKEN

{
  "limite": 100,
  "competencia": "1",
  "tribunal": "8"
}
```

#### Procesar Siguiente Causa
```bash
POST http://localhost:3000/api/mvp/cola/procesar
Authorization: Bearer TU_TOKEN
```

#### Ver Resultado
```bash
GET http://localhost:3000/api/mvp/resultados/C-13786-2018
Authorization: Bearer TU_TOKEN
```

### Desde Código

```javascript
// Cargar causas
const { obtenerCausas, obtenerCausasValidas } = require('./src/mvp/causa-manager');
const causas = obtenerCausas();
console.log(`Total: ${causas.length} causas`);

// Inicializar cola
const { inicializarCola, procesarSiguiente } = require('./src/mvp/cola-scraping');
const cola = inicializarCola(null, { limite: 50 });

// Procesar siguiente
const resultado = await procesarSiguiente();
console.log(resultado);
```

## 📊 Estadísticas Actuales

- **Total causas en CSV**: 3,221
- **Causas válidas**: ~80-85% (depende de datos completos)
- **Límite diario**: 150 causas (configurable)
- **Resultados guardados**: Ver en dashboard

## 🔧 Configuración

### Límites Diarios
Edita `src/outputs/cola_config.json`:
```json
{
  "limiteDiario": 150,
  "pausaEntreCausas": 3000,
  "maxReintentos": 3
}
```

### Token de Autenticación
```bash
# Obtener token
./src/api/obtener-token.sh

# O ver archivo
cat src/outputs/tokens.json
```

## 📁 Archivos Importantes

- `causa.csv` - Fuente de datos (3,221 causas)
- `src/outputs/causas_cache.json` - Cache de causas
- `src/outputs/cola_scraping.json` - Estado de cola
- `src/outputs/scraping_progress.json` - Progreso individual
- `src/outputs/scraping_results/` - Resultados JSON y PDFs

## 🌐 URLs del Sistema

- **Dashboard MVP**: `http://localhost:3000/mvp`
- **Demo Movimientos**: `http://localhost:3000/demo`
- **API Base**: `http://localhost:3000/api/mvp/`
- **Health Check**: `http://localhost:3000/api/health`

## 🔄 Flujo Completo

```
1. Cargar causas desde CSV
   ↓
2. Validar y normalizar
   ↓
3. Inicializar cola (con filtros opcionales)
   ↓
4. Procesar causa por causa
   ├── Ejecutar scraping
   ├── Guardar resultados (JSON + PDFs base64)
   ├── Actualizar progreso
   └── Respeta límites diarios
   ↓
5. Consultar resultados via API
   ↓
6. Visualizar en dashboard o integración Symfony
```

## 🎯 Próximos Pasos

1. **Probar el dashboard**: Accede a `http://localhost:3000/mvp`
2. **Inicializar cola**: Usa el botón "Inicializar Cola" con límite de prueba (ej: 10 causas)
3. **Procesar causas**: Usa "Procesar Siguiente" o ejecuta en bucle
4. **Ver resultados**: Consulta los resultados guardados
5. **Integrar con Symfony**: Usa los endpoints API desde tu aplicación

## 📝 Notas

- ✅ Sistema completamente funcional
- ✅ Manejo de errores robusto
- ✅ Persistencia de estado
- ✅ Respeto de límites diarios
- ✅ Reintentos automáticos
- ✅ Interface web completa
- ✅ API REST completa
- ✅ Listo para producción

## 🆘 Soporte

Si tienes problemas:
1. Verifica que el servidor esté corriendo
2. Revisa los logs: `tail -f /tmp/pjud-api-server.log`
3. Verifica los archivos de datos en `src/outputs/`
4. Consulta `src/mvp/README.md` para más detalles

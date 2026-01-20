# ✅ Checklist para Despliegue en VPS

## 📋 Pre-requisitos

### 1. Archivos Necesarios
- [ ] `causa_validas.csv` - Debe estar en la raíz del proyecto
- [ ] `src/outputs/tribunales_pjud_ids.json` - Datos de tribunales
- [ ] `src/outputs/tribunales_pjud_completo.json` - Datos completos de tribunales
- [ ] `.env` - Archivo de configuración con variables de entorno

### 2. Variables de Entorno (.env)
```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=codi_ejamtest
DB_PORT=3306

# API
API_PORT=3000
API_HOST=0.0.0.0

# PJUD
OJV_URL=https://oficinajudicialvirtual.pjud.cl/indexN.php

# Node Environment
NODE_ENV=production
```

### 3. Dependencias del Sistema
- [ ] Node.js 18+ instalado
- [ ] MySQL/MariaDB instalado y corriendo
- [ ] Playwright con Chromium instalado: `npx playwright install chromium`
- [ ] PM2 instalado globalmente: `npm install -g pm2`

---

## 🚀 Pasos de Instalación

### 1. Clonar/Subir Código
```bash
git clone https://github.com/Roinflames/pjud-webscrapping.git
cd pjud-webscrapping
git checkout diegogo-test
```

### 2. Instalar Dependencias
```bash
npm install
npx playwright install chromium
```

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales
nano .env
```

### 4. Preparar Archivos Necesarios
```bash
# Asegurar que existe causa_validas.csv
ls -la causa_validas.csv

# Si no existe, generarlo desde causa.csv
node src/filter-valid-causas.js

# Generar datos de tribunales si no existen
node src/extraer-tribunales-http.js
```

### 5. Crear Tabla de Cola
```bash
# La tabla se crea automáticamente al iniciar el worker
# O manualmente:
node src/utils/crear-tabla-cola.js
```

### 6. Iniciar Servicios con PM2
```bash
# Iniciar todos los servicios
npm run services:start

# Verificar estado
npm run services:status

# Ver logs
pm2 logs
```

---

## 🔍 Verificación de Endpoints

### Endpoints del Frontend MVP

El frontend (`/mvp`) usa estos endpoints:

1. **GET /api/mvp/estadisticas**
   - Retorna estadísticas de causas, cola y resultados
   - ✅ Implementado

2. **GET /api/mvp/causas?valida=true&conMovimientos=false**
   - Retorna lista de causas con filtros
   - Parámetros:
     - `valida=true` - Solo causas válidas (de causa_validas.csv)
     - `conMovimientos=true` - Solo causas con movimientos procesados
     - `limite=1000` - Límite de resultados
     - `offset=0` - Paginación
   - ✅ Implementado

3. **GET /api/mvp/movimientos/:rit**
   - Retorna movimientos de una causa específica
   - ✅ Implementado

4. **GET /api/mvp/resultados/:rit**
   - Retorna resultado completo de scraping
   - ✅ Implementado

5. **POST /api/mvp/scraping/ejecutar**
   - Ejecuta scraping de una causa
   - Requiere autenticación (token)
   - ✅ Implementado

6. **GET /api/scraping/pdf/:rit/:archivo**
   - Sirve PDFs directamente
   - ✅ Implementado

---

## 🧪 Pruebas en VPS

### 1. Verificar que la API responde
```bash
curl http://localhost:3000/api/health
```

### 2. Verificar endpoint de causas
```bash
curl "http://localhost:3000/api/mvp/causas?valida=true&limite=10"
```

### 3. Verificar endpoint de estadísticas
```bash
curl http://localhost:3000/api/mvp/estadisticas
```

### 4. Acceder al Frontend
```
http://TU_IP_VPS:3000/mvp
```

---

## 🔧 Configuración de Firewall

### Abrir Puerto 3000
```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp

# CentOS
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

## 📊 Monitoreo

### Ver Logs en Tiempo Real
```bash
pm2 logs
pm2 logs api-pjud
pm2 logs listener-pjud
pm2 logs worker-pjud
```

### Ver Estado de Servicios
```bash
pm2 status
npm run services:status
```

### Reiniciar Servicios
```bash
npm run services:restart
```

---

## ⚠️ Problemas Comunes

### 1. Puerto 3000 ya en uso
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :3000
# O cambiar el puerto en .env
API_PORT=3001
```

### 2. Archivo causa_validas.csv no encontrado
```bash
# Generar desde causa.csv
node src/filter-valid-causas.js
```

### 3. Tabla pjud_cola_scraping no existe
```bash
# Crear manualmente
node src/utils/crear-tabla-cola.js
```

### 4. Playwright no encuentra Chromium
```bash
npx playwright install chromium
```

---

## ✅ Checklist Final

- [ ] API responde en `/api/health`
- [ ] Frontend carga en `/mvp`
- [ ] Endpoint `/api/mvp/causas` retorna datos
- [ ] Endpoint `/api/mvp/estadisticas` retorna datos
- [ ] Los filtros del frontend funcionan
- [ ] Los PDFs se pueden ver/descargar
- [ ] PM2 está corriendo todos los servicios
- [ ] Los logs no muestran errores críticos
- [ ] El puerto 3000 está abierto en el firewall

---

## 📝 Notas Importantes

1. **Seguridad**: En producción, considera usar:
   - Nginx como reverse proxy
   - SSL/TLS (HTTPS)
   - Autenticación más robusta
   - Rate limiting

2. **Rendimiento**: 
   - El frontend carga hasta 1000 causas por defecto
   - Para más causas, ajusta el límite en el frontend

3. **Base de Datos**:
   - Asegúrate de que MySQL/MariaDB esté corriendo
   - Verifica que las credenciales en `.env` sean correctas

4. **Archivos**:
   - Los PDFs se guardan en `src/outputs/`
   - Los JSON de movimientos también en `src/outputs/`
   - Asegúrate de tener espacio suficiente en disco

---

## 🎯 Estado Actual

✅ **API lista para VPS**
- Todos los endpoints implementados
- Frontend funcional
- Servicios configurados con PM2
- Validación de datos implementada
- Manejo de errores mejorado

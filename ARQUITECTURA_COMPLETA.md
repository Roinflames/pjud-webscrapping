# 🏗️ Arquitectura Completa - PJUD Scraper

## 📊 Visión General

Este proyecto expone **2 servicios principales** con **2 bases de datos separadas**, todo accesible vía Cloudflare Tunnel sin necesidad de abrir puertos.

```
┌──────────────────────────────────────────────────────────┐
│               Internet (HTTPS via Cloudflare)            │
└────────────┬──────────────────────┬──────────────────────┘
             │                      │
    ┌────────▼────────┐    ┌────────▼──────────┐
    │  Symfony App    │    │ API + Frontend     │
    │  (puerto 8000)  │    │   Documentación    │
    │                 │    │  (puerto 3000)     │
    └────────┬────────┘    └────────┬───────────┘
             │                      │
    ┌────────▼──────────┐  ┌────────▼───────────┐
    │ BD: codi_ejamtest │  │  BD: pjud_api      │
    │   (Symfony)       │  │   (API REST)       │
    └───────────────────┘  └────────────────────┘
```

---

## 🎯 Componentes del Sistema

### 1. **Symfony App** (Puerto 8000)
**Propósito:** Interfaz web tradicional con vistas Twig

**Base de Datos:** `codi_ejamtest`
- Poblada directamente por el scraper original
- Mismo esquema que `pjud_api`
- Acceso mediante ORM Doctrine

**Funcionalidades:**
- Vista de causas con detalles completos
- Réplica visual del sitio PJUD
- Formularios de búsqueda
- Integración con Doctrine ORM

**Tecnologías:**
- Symfony 5.0.11 (compatible PHP 7.4.33)
- Twig para templates
- MariaDB 5.5.68
- Doctrine ORM

**URLs:**
- Local: `http://localhost:8000`
- Pública: `https://app.tudominio.com` (o URL temporal de Cloudflare)

---

### 2. **API REST + Frontend Documentación** (Puerto 3000)
**Propósito:** API pública + documentación interactiva

**Base de Datos:** `pjud_api` (**SEPARADA** de Symfony)
- Poblada mediante endpoints de la API
- Mismo esquema que `codi_ejamtest` pero independiente
- Permite escalabilidad y separación de datos

**Funcionalidades:**
- Endpoints RESTful en JSON
- Frontend de documentación interactiva (esta página)
- Scraping bajo demanda vía API
- Demos y ejemplos de uso

**Tecnologías:**
- Node.js + Express
- MySQL (MariaDB 5.5.68)
- HTML/CSS/JavaScript vanilla

**URLs:**
- Local: `http://localhost:3000`
- Pública: `https://api.tudominio.com` (o URL temporal de Cloudflare)

**Endpoints principales:**
```
GET  /                      → Frontend de documentación
GET  /api/health            → Health check
GET  /api/causas            → Lista causas
GET  /api/causas/:id        → Causa por ID
GET  /api/causas/rit/:rit   → Causa por RIT
GET  /api/movimientos       → Lista movimientos
GET  /api/tribunales        → Lista tribunales
POST /api/scraping/causa    → Scrapear nueva causa
```

---

## 🗄️ Bases de Datos

### Comparación de las 2 BDs:

| Aspecto | `codi_ejamtest` | `pjud_api` |
|---------|-----------------|------------|
| **Uso** | Symfony App | API REST |
| **Población** | Scraper directo | API endpoints |
| **Acceso** | Doctrine ORM | SQL directo |
| **Propósito** | App principal | Integración externa |
| **Escalabilidad** | Monolítico | Microservicio |

### Esquema Compartido:

Ambas BDs tienen las mismas tablas:
- `causas` - Información de causas judiciales
- `movimientos` - Movimientos procesales
- `partes` - Partes involucradas (demandante/demandado)
- `tribunales` - Catálogo de tribunales
- `pdfs` - Referencias a documentos PDF

---

## 🌐 Cloudflare Tunnel

### Configuración Dual:

El túnel expone ambos servicios simultáneamente:

```yaml
ingress:
  # API + Docs (puerto 3000 → BD pjud_api)
  - hostname: api.tudominio.com
    service: http://localhost:3000

  # Symfony (puerto 8000 → BD codi_ejamtest)
  - hostname: app.tudominio.com
    service: http://localhost:8000
```

### Modos de Operación:

#### Modo 1: Túneles Rápidos (Temporal)
- **Ventaja:** Sin configuración, inmediato
- **Desventaja:** URLs aleatorias que cambian
- **Uso:** Testing, demos, desarrollo

```bash
./scripts/start-all-services.sh
# Seleccionar opción 1
# Resultado:
#   API:     https://random-word-1234.trycloudflare.com
#   Symfony: https://another-word-5678.trycloudflare.com
```

#### Modo 2: Túnel Permanente (Producción)
- **Ventaja:** URLs fijas, profesionales
- **Desventaja:** Requiere dominio en Cloudflare
- **Uso:** Producción, cliente final

```bash
# Setup inicial (una vez)
cloudflared tunnel login
cloudflared tunnel create pjud-scraper
cloudflared tunnel route dns pjud-scraper api.tudominio.com
cloudflared tunnel route dns pjud-scraper app.tudominio.com

# Iniciar
./scripts/start-all-services.sh
# Seleccionar opción 2
```

---

## 🚀 Inicio Rápido

### Opción A: Script Automático (Recomendado)

```bash
# Inicia TODO: API, Symfony, Túneles
./scripts/start-all-services.sh
```

El script automáticamente:
1. ✅ Verifica requisitos (Node, PHP, cloudflared)
2. ✅ Inicia servidor API (puerto 3000)
3. ✅ Inicia Symfony (puerto 8000)
4. ✅ Inicia túnel(es) de Cloudflare
5. ✅ Muestra URLs públicas

### Opción B: Manual

```bash
# Terminal 1: API
cd /ruta/al/proyecto
npm run api:start

# Terminal 2: Symfony
cd symfony-app
php -S localhost:8000 -t public

# Terminal 3: Túnel API
cloudflared tunnel --url http://localhost:3000

# Terminal 4: Túnel Symfony
cloudflared tunnel --url http://localhost:8000
```

---

## 📋 Flujo de Datos

### Scraping → Symfony

```
1. Scraper ejecuta
   └─> Lee causa.csv
   └─> Navega PJUD con Playwright
   └─> Extrae datos (causas, movimientos, PDFs)
   └─> Guarda en BD: codi_ejamtest
   └─> Symfony muestra datos en vistas Twig
```

### Scraping → API

```
1. Cliente hace POST /api/scraping/causa
   └─> API ejecuta scraper
   └─> Extrae datos del PJUD
   └─> Guarda en BD: pjud_api (SEPARADA)
   └─> Cliente hace GET /api/causas/:id
   └─> API retorna JSON desde pjud_api
```

### Separación de Datos

**¿Por qué 2 bases de datos?**

1. **Separación de Concerns:**
   - Symfony: App monolítica tradicional
   - API: Microservicio RESTful

2. **Escalabilidad:**
   - La API puede escalar independientemente
   - Diferentes estrategias de backup

3. **Seguridad:**
   - Credenciales separadas
   - Permisos granulares

4. **Testing:**
   - Ambiente de API aislado
   - No afecta datos de producción

---

## 🔧 Configuración de Entornos

### `.env` (Proyecto principal - API)
```bash
# API usa BD separada
DB_NAME=pjud_api
DB_USER=root
DB_PASSWORD=

API_PORT=3000
SYMFONY_PORT=8000
```

### `symfony-app/.env` (Symfony)
```bash
# Symfony usa su propia BD
DATABASE_URL="mysql://root@127.0.0.1:3306/codi_ejamtest?serverVersion=5.5.68-mariadb"
```

---

## 🧪 Testing

### Verificar que todo funciona:

```bash
# 1. Health checks locales
curl http://localhost:3000/api/health  # API
curl http://localhost:8000              # Symfony

# 2. Verificar BDs separadas
mysql -u root -e "USE pjud_api; SELECT COUNT(*) FROM causas;"
mysql -u root -e "USE codi_ejamtest; SELECT COUNT(*) FROM causas;"

# 3. Probar endpoints públicos
curl https://api-url.trycloudflare.com/api/health
curl https://app-url.trycloudflare.com
```

---

## 📊 Monitoreo

### Ver logs en tiempo real:

```bash
# API
tail -f /tmp/pjud-api.log

# Symfony
tail -f /tmp/pjud-symfony.log

# Túneles
tail -f /tmp/cloudflared-api.log
tail -f /tmp/cloudflared-symfony.log
```

### Ver procesos activos:

```bash
# Ver todos los servicios
lsof -i :3000  # API
lsof -i :8000  # Symfony
ps aux | grep cloudflared  # Túneles
```

---

## 🛑 Detener Servicios

```bash
# Detener todo
pkill -f cloudflared
lsof -ti :3000 | xargs kill  # API
lsof -ti :8000 | xargs kill  # Symfony

# O si usaste el script automático:
# Presiona Ctrl+C en la terminal del script
```

---

## 📚 Documentación Adicional

- **CLOUDFLARE_TUNNEL.md** - Guía completa de Cloudflare Tunnel
- **TESTING.md** - Casos de prueba y validación
- **RESUMEN_MEJORAS_27-29_ENERO.md** - Mejoras recientes
- **README_DESPLIEGUE.md** - Despliegue en CentOS

---

## 🎯 Casos de Uso

### Caso 1: Cliente Web Tradicional
→ Accede a Symfony App (`app.tudominio.com`)
→ Navega vistas Twig
→ Datos de `codi_ejamtest`

### Caso 2: Integración Externa (App Móvil, Dashboard, etc.)
→ Consume API REST (`api.tudominio.com/api/*`)
→ Recibe JSON
→ Datos de `pjud_api`

### Caso 3: Scraping Bajo Demanda
→ POST a `api.tudominio.com/api/scraping/causa`
→ API scrapea PJUD
→ Guarda en `pjud_api`
→ Retorna JSON

---

## ✅ Ventajas de esta Arquitectura

1. **Separación clara:** Symfony (monolito) vs API (microservicio)
2. **Escalabilidad:** Cada servicio escala independientemente
3. **Flexibilidad:** Clientes pueden elegir Symfony o API
4. **Seguridad:** Cloudflare Tunnel sin exponer puertos
5. **Testing:** BDs separadas para testing sin afectar producción
6. **Documentación:** Frontend integrado explica la API

---

**Última actualización:** 29 Enero 2026
**Autor:** Sistema PJUD Scraper
**Estado:** ✅ Arquitectura completa lista

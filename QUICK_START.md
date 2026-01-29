# 🚀 Quick Start - PJUD Scraper

## Inicio Inmediato (1 comando)

```bash
./scripts/start-all-services.sh
```

Esto inicia:
- ✅ API REST (puerto 3000) → BD: `pjud_api`
- ✅ Symfony App (puerto 8000) → BD: `codi_ejamtest`
- ✅ 2 Túneles Cloudflare (URLs públicas)
- ✅ Frontend de documentación

---

## URLs Disponibles

Después de ejecutar el script, obtendrás 2 URLs públicas:

### 1. API + Documentación
```
https://random-word-1234.trycloudflare.com
```

**Qué verás:**
- Frontend interactivo con documentación de la API
- Botones "Probar →" para llamar endpoints en vivo
- Ejemplos de código (cURL, JavaScript, Python)
- Links a demos interactivas

**Endpoints disponibles:**
- `/` - Frontend de documentación
- `/api/health` - Health check
- `/api/causas` - Lista causas
- `/api/movimientos` - Lista movimientos
- `/api/tribunales` - Lista tribunales
- `/demo.html` - Demo interactiva

### 2. Symfony App
```
https://another-word-5678.trycloudflare.com
```

**Qué verás:**
- Interfaz web tradicional (Twig)
- Formulario de búsqueda de causas
- Réplica visual del sitio PJUD
- Vista detallada de movimientos

---

## Diferencias Clave

| Aspecto | API (puerto 3000) | Symfony (puerto 8000) |
|---------|-------------------|----------------------|
| **Base de Datos** | `pjud_api` | `codi_ejamtest` |
| **Interfaz** | JSON REST + Docs HTML | Templates Twig |
| **Propósito** | Integración externa | Aplicación web |
| **Clientes** | Apps, Mobile, Dashboards | Usuarios finales |

---

## Probar la API

### Desde tu terminal:
```bash
# Health check
curl https://tu-url.trycloudflare.com/api/health

# Listar causas
curl https://tu-url.trycloudflare.com/api/causas

# Ver documentación
open https://tu-url.trycloudflare.com
```

### Desde el navegador:
1. Abre `https://tu-url.trycloudflare.com`
2. Verás la documentación interactiva
3. Haz clic en los botones "Probar →"
4. Ve las respuestas JSON en tiempo real

---

## Detener Servicios

```bash
# Opción 1: Si el script está corriendo
# Presiona Ctrl+C

# Opción 2: Manualmente
pkill -f cloudflared
lsof -ti :3000 | xargs kill
lsof -ti :8000 | xargs kill
```

---

## Ver Logs

```bash
# API
tail -f /tmp/pjud-api.log

# Symfony
tail -f /tmp/pjud-symfony.log

# Túneles
tail -f /tmp/cloudflared-api.log
tail -f /tmp/cloudflared-symfony.log
```

---

## Siguiente Paso: Túnel Permanente

Las URLs temporales cambian cada vez que reinicias. Para URLs fijas:

1. Lee `CLOUDFLARE_TUNNEL.md`
2. Configura tu dominio en Cloudflare
3. Ejecuta el setup de túnel permanente:

```bash
cloudflared tunnel login
cloudflared tunnel create pjud-scraper
cloudflared tunnel route dns pjud-scraper api.tudominio.com
cloudflared tunnel route dns pjud-scraper app.tudominio.com
```

4. Reinicia con `./scripts/start-all-services.sh` opción 2

---

## Documentación Completa

- **ARQUITECTURA_COMPLETA.md** - Visión general del sistema
- **CLOUDFLARE_TUNNEL.md** - Guía de túneles
- **TESTING.md** - Casos de prueba
- **RESUMEN_MEJORAS_27-29_ENERO.md** - Mejoras recientes

---

**¿Problemas?** Ver logs en `/tmp/pjud-*.log`

# ✅ Cloudflare Tunnel - Setup Completado

## 🎉 Estado Actual

### ✅ Servidor API Activo
- **Puerto local:** 3000
- **URL local:** http://localhost:3000
- **PID:** Ver con `lsof -i :3000`
- **Logs:** `/tmp/pjud-api.log`

### ✅ Cloudflare Tunnel Activo
- **URL pública:** https://retailer-receive-remain-routers.trycloudflare.com
- **Tipo:** Túnel rápido (temporal)
- **Logs:** `/tmp/cloudflare-tunnel.log`
- **Estado:** Activo desde 29 Enero 2026 14:08

---

## 🚀 URLs Públicas Disponibles

### Health Check
```bash
curl https://retailer-receive-remain-routers.trycloudflare.com/api/health
```
**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-29T14:08:22.635Z",
  "tribunales_cargados": 0
}
```

### Competencias
```bash
curl https://retailer-receive-remain-routers.trycloudflare.com/api/competencias
```

### Cortes
```bash
curl https://retailer-receive-remain-routers.trycloudflare.com/api/cortes
```

### Tribunales
```bash
curl https://retailer-receive-remain-routers.trycloudflare.com/api/tribunales
```

---

## 🛠️ Gestión de Servicios

### Ver Estado
```bash
# Servidor API
lsof -i :3000

# Túnel Cloudflare
ps aux | grep cloudflared
```

### Ver Logs en Tiempo Real
```bash
# API
tail -f /tmp/pjud-api.log

# Tunnel
tail -f /tmp/cloudflare-tunnel.log
```

### Detener Servicios
```bash
# Detener API
lsof -ti :3000 | xargs kill

# Detener Tunnel
pkill -f cloudflared
```

### Reiniciar Todo
```bash
# Script automático (recomendado)
./scripts/start-cloudflare-tunnel.sh

# Manual:
# 1. Detener servicios
pkill -f cloudflared
lsof -ti :3000 | xargs kill

# 2. Iniciar API
cd /Users/diegomartinez/Documents/carpeta\ sin\ título/a
nohup npm run api:start > /tmp/pjud-api.log 2>&1 &

# 3. Iniciar Tunnel
nohup cloudflared tunnel --url http://localhost:3000 > /tmp/cloudflare-tunnel.log 2>&1 &

# 4. Obtener URL
sleep 5
grep "https://.*trycloudflare.com" /tmp/cloudflare-tunnel.log
```

---

## ⚠️ Notas Importantes

### Túnel Temporal
La URL actual (`retailer-receive-remain-routers.trycloudflare.com`) es **temporal** y:
- ❌ Cambiará si reinicias el túnel
- ❌ Se perderá si apagas el servidor
- ✅ Es gratuita y sin límites
- ✅ Ideal para testing y demos

### Para URL Permanente
Sigue las instrucciones en `CLOUDFLARE_TUNNEL.md` sección "Opción 2: Túnel Permanente"

Resumen:
```bash
# 1. Login
cloudflared tunnel login

# 2. Crear túnel
cloudflared tunnel create pjud-scraper-api

# 3. Configurar DNS
cloudflared tunnel route dns pjud-scraper-api api.tudominio.com

# 4. Iniciar con config
cloudflared tunnel --config cloudflare-tunnel.yaml run pjud-scraper-api
```

---

## 🧪 Testing de Endpoints

### Desde tu máquina local:
```bash
# Health check
curl http://localhost:3000/api/health

# Competencias
curl http://localhost:3000/api/competencias | jq .
```

### Desde internet (cualquier dispositivo):
```bash
# Health check
curl https://retailer-receive-remain-routers.trycloudflare.com/api/health

# Competencias
curl https://retailer-receive-remain-routers.trycloudflare.com/api/competencias | jq .
```

### Desde navegador:
- https://retailer-receive-remain-routers.trycloudflare.com/api/health
- https://retailer-receive-remain-routers.trycloudflare.com/api/competencias
- https://retailer-receive-remain-routers.trycloudflare.com/api/cortes

---

## 📊 Próximos Pasos Recomendados

### 1. Configurar Túnel Permanente
Seguir guía en `CLOUDFLARE_TUNNEL.md` para obtener URL fija (api.tudominio.com)

### 2. Configurar HTTPS/SSL
Ya incluido automáticamente por Cloudflare ✅

### 3. Agregar Autenticación
Proteger endpoints con tokens:
```javascript
// En src/api/server.js
app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (auth !== 'Bearer TU_TOKEN_SECRETO') {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
});
```

### 4. Configurar Rate Limiting
Ya incluido automáticamente por Cloudflare ✅

### 5. Monitoreo
Agregar logs estructurados y alertas:
```bash
# Ver estadísticas del túnel
curl https://retailer-receive-remain-routers.trycloudflare.com/metrics
```

---

## 🐛 Troubleshooting

### Problema: Túnel no conecta
```bash
# Verificar que el servidor local esté corriendo
curl http://localhost:3000/api/health

# Si no responde, reiniciar API
lsof -ti :3000 | xargs kill
npm run api:start
```

### Problema: URL no responde
```bash
# Verificar que cloudflared esté corriendo
ps aux | grep cloudflared

# Reiniciar túnel
pkill -f cloudflared
cloudflared tunnel --url http://localhost:3000
```

### Problema: Error 502 Bad Gateway
```bash
# El servidor API no está respondiendo
# Verificar logs:
tail -f /tmp/pjud-api.log

# Reiniciar API:
npm run api:start
```

---

## 📁 Archivos Creados

1. **cloudflare-tunnel.yaml** - Configuración del túnel permanente
2. **scripts/start-cloudflare-tunnel.sh** - Script de inicio automático
3. **CLOUDFLARE_TUNNEL.md** - Documentación completa
4. **CLOUDFLARE_TUNNEL_SETUP.md** - Este archivo (estado actual)

---

## 🎯 Quick Commands

```bash
# Iniciar todo (automático)
./scripts/start-cloudflare-tunnel.sh

# Ver URL actual del túnel
grep "https://.*trycloudflare.com" /tmp/cloudflare-tunnel.log | tail -1

# Probar desde internet
curl $(grep -o "https://[a-z0-9-]*\.trycloudflare\.com" /tmp/cloudflare-tunnel.log | tail -1)/api/health

# Detener todo
pkill -f cloudflared && lsof -ti :3000 | xargs kill
```

---

**Fecha:** 29 Enero 2026 14:08
**Estado:** ✅ Activo y funcionando
**URL Actual:** https://retailer-receive-remain-routers.trycloudflare.com
**Tipo:** Túnel rápido (temporal)

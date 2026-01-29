# 🌐 Configuración de Cloudflare Tunnel para PJUD Scraper

## Resumen

Cloudflare Tunnel permite exponer de forma segura el servidor API sin necesidad de:
- ❌ Abrir puertos en el firewall
- ❌ Configurar port forwarding en el router
- ❌ Exponer tu IP pública
- ✅ Conexión cifrada TLS automática
- ✅ Protección DDoS incluida
- ✅ Sin costo para uso personal

---

## 📋 Requisitos Previos

### 1. Cuenta de Cloudflare (Gratis)
```bash
# Registrarse en: https://dash.cloudflare.com/sign-up
# Solo necesitas un email
```

### 2. Cloudflared Instalado
```bash
# Ya está instalado, verificar con:
which cloudflared
# Salida: /opt/homebrew/bin/cloudflared

# Si no está instalado:
brew install cloudflare/cloudflare/cloudflared
```

### 3. Dominio (Opcional)
- Si tienes un dominio en Cloudflare: puedes usar subdominios (api.tudominio.com)
- Si NO tienes dominio: puedes usar túnel rápido con URL temporal (https://xxx.trycloudflare.com)

---

## 🚀 Opción 1: Túnel Rápido (Recomendado para Testing)

### Ventajas:
- ✅ Sin configuración
- ✅ URL pública inmediata
- ✅ Ideal para pruebas rápidas

### Desventajas:
- ❌ URL temporal (cambia cada vez)
- ❌ Se cierra al detener el script

### Pasos:

```bash
# 1. Iniciar el script automático
./scripts/start-cloudflare-tunnel.sh

# 2. Seleccionar opción "1) Túnel rápido"

# 3. Copiar la URL que aparece (ejemplo):
#    https://random-word-1234.trycloudflare.com
```

**Listo!** Ya puedes acceder a la API desde internet:
```bash
# Ejemplo:
curl https://random-word-1234.trycloudflare.com/api/health
```

---

## 🏗️ Opción 2: Túnel Permanente (Recomendado para Producción)

### Ventajas:
- ✅ URL permanente (subdominio fijo)
- ✅ Certificado SSL automático
- ✅ Se puede configurar como servicio

### Requisitos:
- Tener un dominio en Cloudflare (ejemplo: midominio.com)

### Pasos:

#### 1. Autenticar cloudflared
```bash
cloudflared tunnel login
```
- Se abrirá tu navegador
- Inicia sesión en Cloudflare
- Selecciona el dominio que quieres usar
- Autoriza el acceso

#### 2. Crear el túnel
```bash
cloudflared tunnel create pjud-scraper-api
```

**Salida esperada:**
```
Created tunnel pjud-scraper-api with id <TUNNEL-ID>
```

Esto crea:
- `~/.cloudflared/<TUNNEL-ID>.json` → Archivo de credenciales

#### 3. Configurar DNS
```bash
# Agregar registro DNS (reemplaza 'tudominio.com')
cloudflared tunnel route dns pjud-scraper-api api.tudominio.com
```

**Resultado:** `api.tudominio.com` → Túnel

#### 4. Editar configuración

Abrir `cloudflare-tunnel.yaml` y cambiar:
```yaml
# ANTES:
hostname: pjud-api.yourdomain.com

# DESPUÉS:
hostname: api.tudominio.com  # Tu dominio real
```

#### 5. Actualizar credenciales

Copiar el ID del túnel del paso 2 y ejecutar:
```bash
# Copiar archivo de credenciales
cp ~/.cloudflared/<TUNNEL-ID>.json ~/.cloudflared/credentials.json
```

O editar `cloudflare-tunnel.yaml`:
```yaml
credentials-file: /Users/diegomartinez/.cloudflared/<TUNNEL-ID>.json
```

#### 6. Probar el túnel
```bash
# Iniciar script y seleccionar opción 2
./scripts/start-cloudflare-tunnel.sh
```

#### 7. Verificar acceso
```bash
# Desde tu computadora o desde internet:
curl https://api.tudominio.com/api/health

# Respuesta esperada:
# {"status":"ok","timestamp":"2026-01-29..."}
```

---

## 🔧 Configuración como Servicio (Opcional)

Para que el túnel se inicie automáticamente:

### macOS (usando launchd):

```bash
# 1. Crear archivo de servicio
sudo nano /Library/LaunchDaemons/com.cloudflare.tunnel.plist
```

Contenido:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cloudflare.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/cloudflared</string>
        <string>tunnel</string>
        <string>--config</string>
        <string>/Users/diegomartinez/Documents/carpeta sin título/a/cloudflare-tunnel.yaml</string>
        <string>run</string>
        <string>pjud-scraper-api</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/cloudflared.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/cloudflared.error.log</string>
</dict>
</plist>
```

```bash
# 2. Cargar el servicio
sudo launchctl load /Library/LaunchDaemons/com.cloudflare.tunnel.plist

# 3. Verificar estado
sudo launchctl list | grep cloudflare
```

### Linux (usando systemd):

```bash
# 1. Instalar como servicio
sudo cloudflared service install

# 2. Iniciar servicio
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# 3. Ver logs
journalctl -u cloudflared -f
```

---

## 📊 Endpoints Disponibles

Una vez el túnel esté activo, estos endpoints estarán disponibles:

### API Principal:
```bash
# Health check
curl https://api.tudominio.com/api/health

# Listar tribunales
curl https://api.tudominio.com/api/tribunales

# Buscar tribunal
curl https://api.tudominio.com/api/tribunales/buscar?nombre=Santiago

# Competencias
curl https://api.tudominio.com/api/competencias

# Cortes
curl https://api.tudominio.com/api/cortes
```

### Scraping API (si está disponible):
```bash
# Scrapear una causa
curl -X POST https://api.tudominio.com/api/scraping/causa \
  -H "Content-Type: application/json" \
  -d '{"rit": "C-13786-2018"}'

# Estado de scraping
curl https://api.tudominio.com/api/scraping/status
```

---

## 🛡️ Seguridad

### 1. Limitar Acceso por IP (Opcional)

En Cloudflare Dashboard:
1. Ir a **Security** → **WAF**
2. Crear regla:
   - **Field:** IP Address
   - **Operator:** is not in
   - **Value:** [Tu IP, IPs permitidas]
   - **Action:** Block

### 2. Autenticación Básica (Opcional)

Agregar middleware en `src/api/server.js`:
```javascript
app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== 'Bearer TU_TOKEN_SECRETO') {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
});
```

### 3. Rate Limiting (Recomendado)

Ya incluido en Cloudflare automáticamente.

---

## 🐛 Troubleshooting

### Problema: "cloudflared: command not found"
```bash
# Solución:
brew install cloudflare/cloudflare/cloudflared
```

### Problema: "tunnel credentials file not found"
```bash
# Solución: Ejecutar login primero
cloudflared tunnel login
cloudflared tunnel create pjud-scraper-api
```

### Problema: "Error 1033: Argo Tunnel error"
```bash
# Solución: Verificar que el servicio local esté corriendo
lsof -i :3000

# Si no está corriendo:
npm run api:start
```

### Problema: "DNS record not found"
```bash
# Solución: Agregar registro DNS
cloudflared tunnel route dns pjud-scraper-api api.tudominio.com

# Esperar 1-2 minutos para propagación DNS
```

### Ver logs en tiempo real:
```bash
# Logs del túnel
tail -f /tmp/cloudflared.log

# Logs del servidor API
tail -f /tmp/pjud-api.log
```

---

## 📚 Documentación Oficial

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Getting Started](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/)
- [Best Practices](https://developers.cloudflare.com/cloudflare-one/tutorials/)

---

## 🎯 Quick Start (TL;DR)

```bash
# Testing rápido (sin configuración):
./scripts/start-cloudflare-tunnel.sh
# → Selecciona opción 1
# → Copia la URL temporal
# → Prueba: curl <URL>/api/health

# Producción (con dominio):
cloudflared tunnel login
cloudflared tunnel create pjud-scraper-api
cloudflared tunnel route dns pjud-scraper-api api.tudominio.com
# → Edita cloudflare-tunnel.yaml con tu dominio
./scripts/start-cloudflare-tunnel.sh
# → Selecciona opción 2
# → Prueba: curl https://api.tudominio.com/api/health
```

---

**Última actualización:** 29 Enero 2026
**Autor:** Sistema PJUD Scraper
**Estado:** ✅ Listo para usar

# 🚀 Guía de Instalación en Hosting o Servidor (Sin Docker)

Esta guía te ayudará a instalar y ejecutar el proyecto de web scraping de PJUD en cualquier servidor Linux (VPS, Cloud, Hosting compartido, etc.) sin usar Docker.

## 📋 Requisitos del Sistema

- **Sistema Operativo**: Linux (Ubuntu 20.04+ / Debian 10+ / CentOS 8+)
- **Node.js**: Versión 16.x o superior (recomendado: 18.x LTS)
- **RAM**: Mínimo 2GB (recomendado: 4GB+)
- **Espacio en disco**: Mínimo 5GB libres
- **Acceso SSH** al servidor
- **Permisos de administrador** (sudo) para instalar paquetes

---

## 🔧 Paso 1: Instalar Node.js y npm

### Opción A: Usando NodeSource (Recomendado - Ubuntu/Debian)

```bash
# Actualizar paquetes del sistema
sudo apt update
sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y curl git build-essential

# Instalar Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v18.x.x o superior
npm --version   # Debe mostrar 9.x.x o superior
```

### Opción B: Usando NVM (Node Version Manager)

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recargar terminal o ejecutar:
source ~/.bashrc

# Instalar Node.js 18 LTS
nvm install 18
nvm use 18
nvm alias default 18

# Verificar
node --version
npm --version
```

### Opción C: Para CentOS/RHEL

```bash
# Instalar Node.js 18 desde NodeSource
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verificar
node --version
npm --version
```

---

## 📦 Paso 2: Clonar o Subir el Proyecto

### Opción A: Si tienes el código en Git

```bash
# Ir a directorio donde instalarás el proyecto
cd ~/
# o en /var/www/ si prefieres
# sudo mkdir -p /var/www && cd /var/www

# Clonar repositorio (reemplaza con tu URL)
git clone <URL_DE_TU_REPOSITORIO> pjud-webscrapping
cd pjud-webscrapping
```

### Opción B: Si tienes el código en tu computador local

```bash
# En tu computador local, comprimir el proyecto (excluyendo node_modules)
tar -czf pjud-webscrapping.tar.gz --exclude='node_modules' --exclude='.git' pjud-webscrapping/

# Subir al servidor usando SCP
scp pjud-webscrapping.tar.gz usuario@tu-servidor.com:~/

# En el servidor, extraer
cd ~/
tar -xzf pjud-webscrapping.tar.gz
cd pjud-webscrapping
```

---

## 🔨 Paso 3: Instalar Dependencias del Proyecto

```bash
# Instalar dependencias de npm
npm install

# Esto instalará:
# - express (servidor web)
# - playwright (automatización de navegador)
# - dotenv (variables de entorno)
# - mysql2 (conexión a base de datos)
# - cors (CORS para API)
# - winston (logging)
```

---

## 🌐 Paso 4: Instalar Navegadores de Playwright

**⚠️ IMPORTANTE**: Playwright necesita instalar navegadores Chromium. Esto puede tardar varios minutos y ocupar ~500MB.

```bash
# Instalar navegadores de Playwright (Chromium)
npx playwright install chromium

# Para instalar dependencias del sistema necesarias
npx playwright install-deps chromium
```

**Nota**: En algunos servidores sin interfaz gráfica, necesitarás instalar dependencias adicionales:

```bash
# Ubuntu/Debian
sudo apt install -y \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libdbus-1-3 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libatspi2.0-0 \
  libxshmfence1

# CentOS/RHEL
sudo yum install -y \
  nss \
  nspr \
  atk \
  at-spi2-atk \
  cups-libs \
  libdrm \
  dbus \
  libxkbcommon \
  libXcomposite \
  libXdamage \
  libXfixes \
  libXrandr \
  mesa-libgbm \
  alsa-lib \
  at-spi2-core \
  libXShmFence
```

---

## ⚙️ Paso 5: Configurar Variables de Entorno

```bash
# Crear archivo .env
cat > .env << 'EOF'
OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php
PORT=3000
NODE_ENV=production

# Opcional: Base de datos (si usas MySQL)
# DB_HOST=localhost
# DB_USER=tu_usuario
# DB_PASSWORD=tu_password
# DB_NAME=tu_base_datos

# Opcional: Token para API
# API_TOKEN=tu_token_secreto_aqui
EOF

# Verificar que se creó correctamente
cat .env
```

---

## 📁 Paso 6: Crear Directorios Necesarios

```bash
# Crear directorios si no existen
mkdir -p src/outputs
mkdir -p src/storage
mkdir -p src/logs
mkdir -p assets/ebook

# Dar permisos adecuados
chmod -R 755 src/outputs src/storage src/logs assets/ebook
```

---

## ✅ Paso 7: Verificar Configuración

```bash
# Verificar que existe el archivo de configuración
ls -la src/config/pjud_config.json

# Si no existe, crear uno básico
cat > src/config/pjud_config.json << 'EOF'
{
  "rit": "16707-2019",
  "competencia": "3",
  "corte": "90",
  "tribunal": "276",
  "tipoCausa": "C"
}
EOF
```

---

## 🚀 Paso 8: Probar la Instalación

### Opción Rápida: Script Automático

```bash
# Ejecutar script de instalación automática
bash scripts/install-server.sh
```

Este script instalará todo automáticamente. Luego continúa desde el Paso 9.

### Opción Manual: Verificar instalación

```bash
# Verificar que Node.js funciona
node --version
npm --version

# Probar que el servidor API inicia
npm run api:start

# En otra terminal SSH, probar que responde
curl http://localhost:3000/api/mvp/causas
```

Si todo está bien, deberías ver una respuesta JSON.

---

## 🔄 Paso 9: Ejecutar como Servicio (Opcional pero Recomendado)

Para que el programa siga corriendo aunque cierres la sesión SSH, puedes usar **PM2** (Process Manager).

### Instalar PM2 globalmente

```bash
sudo npm install -g pm2
```

### Iniciar el servidor con PM2

```bash
# Desde el directorio del proyecto
pm2 start src/api/server.js --name "pjud-api"

# O usando el script npm
pm2 start npm --name "pjud-api" -- run api:start

# Verificar que está corriendo
pm2 status

# Ver logs
pm2 logs pjud-api

# Hacer que PM2 inicie automáticamente al reiniciar el servidor
pm2 startup
# Copia y ejecuta el comando que te muestra

# Guardar configuración actual
pm2 save
```

### Comandos útiles de PM2

```bash
# Ver todos los procesos
pm2 list

# Detener el servidor
pm2 stop pjud-api

# Reiniciar el servidor
pm2 restart pjud-api

# Eliminar el proceso
pm2 delete pjud-api

# Ver logs en tiempo real
pm2 logs pjud-api

# Ver uso de recursos
pm2 monit
```

---

## 🌐 Paso 10: Configurar Firewall (Si es necesario)

Si tu servidor tiene firewall activo (UFW en Ubuntu), abre el puerto:

```bash
# Verificar estado del firewall
sudo ufw status

# Permitir puerto 3000 (o el que uses)
sudo ufw allow 3000/tcp

# Si usas Nginx como proxy inverso, permitir puerto 80 y 443
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activar firewall (si no está activo)
sudo ufw enable
```

---

## 🔒 Paso 11: Usar Nginx como Proxy Inverso (Opcional)

Si quieres acceder desde un dominio (ej: `https://api.tudominio.com`), configura Nginx:

### Instalar Nginx

```bash
sudo apt install -y nginx
```

### Configurar sitio

```bash
sudo nano /etc/nginx/sites-available/pjud-api
```

Contenido del archivo:

```nginx
server {
    listen 80;
    server_name api.tudominio.com;  # Cambia por tu dominio

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Activar sitio

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/pjud-api /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 📊 Resumen de Comandos Rápidos

```bash
# ============================================
# INSTALACIÓN INICIAL (Una sola vez)
# ============================================

# 1. Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Ir al proyecto
cd ~/pjud-webscrapping

# 3. Instalar dependencias
npm install

# 4. Instalar navegadores Playwright
npx playwright install chromium
npx playwright install-deps chromium

# 5. Crear .env
cat > .env << 'EOF'
OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php
PORT=3000
NODE_ENV=production
EOF

# 6. Crear directorios
mkdir -p src/outputs src/storage src/logs assets/ebook

# ============================================
# EJECUTAR (Cada vez que quieras usar)
# ============================================

# Opción 1: Directo (se detiene al cerrar SSH)
npm run api:start

# Opción 2: Con PM2 (permanece activo)
pm2 start npm --name "pjud-api" -- run api:start

# Opción 3: Solo scraping manual
node src/index.js

# ============================================
# GESTIÓN CON PM2
# ============================================

pm2 list              # Ver procesos
pm2 logs pjud-api     # Ver logs
pm2 restart pjud-api  # Reiniciar
pm2 stop pjud-api     # Detener
pm2 delete pjud-api   # Eliminar

# ============================================
# ACTUALIZAR CÓDIGO
# ============================================

# Si usas Git:
git pull origin main
npm install  # Si hay nuevas dependencias
pm2 restart pjud-api

# Si subes archivos manualmente:
# 1. Subir nuevos archivos
# 2. Ejecutar: npm install (si hay cambios en package.json)
# 3. Ejecutar: pm2 restart pjud-api
```

---

## 🐛 Solución de Problemas Comunes

### Error: "Cannot find module 'playwright'"

```bash
npm install
npx playwright install chromium
```

### Error: "playwright: command not found"

```bash
# Asegúrate de instalar los navegadores
npx playwright install chromium
npx playwright install-deps chromium
```

### Error: "EADDRINUSE: address already in use :::3000"

```bash
# El puerto 3000 está ocupado
# Ver qué proceso lo usa:
sudo lsof -i :3000

# Detener proceso anterior
pm2 stop pjud-api
# o
kill -9 <PID>

# Usar otro puerto editando .env:
# PORT=3001
```

### Error: "Permission denied"

```bash
# Dar permisos de ejecución
chmod +x src/api/server.js

# O ejecutar con permisos
sudo npm run api:start
```

### El servidor se detiene al cerrar SSH

```bash
# Usa PM2 o screen/tmux
pm2 start npm --name "pjud-api" -- run api:start

# O con screen:
screen -S pjud-api
npm run api:start
# Presiona Ctrl+A luego D para desconectar
# Reconectar: screen -r pjud-api
```

### No se pueden descargar PDFs

```bash
# Verificar permisos de directorio outputs
chmod -R 755 src/outputs

# Verificar que Playwright tiene los navegadores instalados
npx playwright install chromium
```

---

## 📞 Verificación Final

Para verificar que todo funciona correctamente:

```bash
# 1. Verificar que el servidor está corriendo
curl http://localhost:3000/api/mvp/causas

# 2. Ver logs
pm2 logs pjud-api --lines 50

# 3. Ver estado del proceso
pm2 status

# 4. Ver uso de recursos
pm2 monit
```

---

## ✅ Checklist de Instalación

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] npm instalado (`npm --version`)
- [ ] Proyecto clonado/subido al servidor
- [ ] Dependencias instaladas (`npm install`)
- [ ] Playwright instalado (`npx playwright install chromium`)
- [ ] Archivo `.env` creado con `OJV_URL`
- [ ] Directorios creados (outputs, storage, logs)
- [ ] Servidor probado localmente (`npm run api:start`)
- [ ] PM2 instalado (opcional pero recomendado)
- [ ] Servidor corriendo con PM2 (opcional)
- [ ] Firewall configurado (si aplica)
- [ ] Nginx configurado (si usas dominio)

---

## 🎯 Próximos Pasos

1. **Acceder al dashboard**: Abre en navegador `http://tu-servidor:3000/mvp`
2. **Probar scraping**: Usa la API o el dashboard para ejecutar scraping
3. **Configurar backups**: Configura backups automáticos de `src/outputs` y `src/storage`
4. **Monitoreo**: Configura alertas para verificar que el servidor sigue activo

---

## 📚 Recursos Adicionales

- [Documentación de Playwright](https://playwright.dev/)
- [Documentación de PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Guía de Nginx](https://nginx.org/en/docs/)

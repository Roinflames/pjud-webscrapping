# ⚡ Comandos Rápidos para Hosting

## 🚀 Instalación Rápida (Copiar y Pegar)

```bash
# 1. Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Subir proyecto y entrar al directorio
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

# 7. (Opcional) Instalar PM2 para gestión de procesos
sudo npm install -g pm2
```

## ▶️ Iniciar el Servidor

```bash
# Opción 1: Directo (se detiene al cerrar SSH)
npm run api:start

# Opción 2: Con PM2 (permanece activo)
pm2 start npm --name "pjud-api" -- run api:start
pm2 save
pm2 startup  # Sigue las instrucciones que muestra
```

## 🔄 Gestión con PM2

```bash
pm2 list              # Ver procesos
pm2 logs pjud-api     # Ver logs en tiempo real
pm2 restart pjud-api  # Reiniciar
pm2 stop pjud-api     # Detener
pm2 delete pjud-api   # Eliminar proceso
pm2 monit             # Monitor de recursos
```

## 📊 Verificar que Funciona

```bash
# Verificar que responde
curl http://localhost:3000/api/mvp/causas

# Ver logs
pm2 logs pjud-api --lines 50

# Ver estado
pm2 status
```

## 🔥 Solución Rápida de Problemas

```bash
# Puerto ocupado
sudo lsof -i :3000
kill -9 <PID>

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npx playwright install chromium

# Ver logs de errores
pm2 logs pjud-api --err

# Reiniciar todo
pm2 restart all
```

## 📦 Actualizar Código

```bash
# Si usas Git
git pull origin main
npm install  # Si hay nuevas dependencias
pm2 restart pjud-api

# Si subes archivos manualmente
# 1. Subir archivos nuevos
# 2. npm install (si cambió package.json)
# 3. pm2 restart pjud-api
```

## 🌐 Configurar Firewall

```bash
# Permitir puerto 3000
sudo ufw allow 3000/tcp
sudo ufw enable
```

---

**📚 Para más detalles, consulta `INSTALACION_HOSTING.md`**

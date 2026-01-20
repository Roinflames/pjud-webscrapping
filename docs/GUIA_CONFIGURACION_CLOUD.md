# 🚀 Guía Completa: Configuración del Servidor Cloud

## ✅ Configuración Recomendada

Tu configuración es **perfecta** para este sistema:
- ✅ **2 vCPU** - Suficiente para Node.js y Playwright
- ✅ **8 GB RAM** - Adecuado para scraping concurrente
- ✅ **50 GB almacenamiento** - Suficiente para PDFs y datos
- ✅ **2 TB transferencia** - Más que suficiente

---

## 📋 Pasos de Configuración del Servidor

### PASO 1: Acceso Inicial al Servidor

#### 1.1 Obtener Credenciales de Acceso

Una vez comprado el servidor Cloud, recibirás:
- **IP del servidor**: Ej: `45.230.185.123`
- **Usuario root**: Generalmente `root`
- **Contraseña root**: La que configuraste al comprar
- **Puerto SSH**: Generalmente `22`

#### 1.2 Conectarse por SSH

**Desde Linux/Mac:**
```bash
ssh root@TU_IP_SERVIDOR
```

**Desde Windows:**
- Usa **PuTTY** o **Windows Terminal**
- Host: `TU_IP_SERVIDOR`
- Puerto: `22`
- Usuario: `root`
- Password: (la que configuraste)

#### 1.3 Verificar Sistema Operativo

```bash
cat /etc/redhat-release
# Debe mostrar: CentOS Linux release 7.9.2009 (Core)
```

Si no es CentOS 7.9, necesitarás instalarlo o elegir una imagen diferente.

---

### PASO 2: Configuración Básica del Sistema

#### 2.1 Actualizar Sistema

```bash
# Actualizar sistema
yum update -y

# Instalar herramientas básicas
yum install -y wget curl git vim nano
```

#### 2.2 Configurar Firewall

```bash
# Verificar que firewalld esté activo
systemctl status firewalld

# Si no está activo, iniciarlo
systemctl start firewalld
systemctl enable firewalld

# Abrir puertos necesarios
firewall-cmd --permanent --add-port=22/tcp      # SSH
firewall-cmd --permanent --add-port=3000/tcp    # API Node.js
firewall-cmd --permanent --add-port=3306/tcp    # MySQL (solo si accedes desde fuera)
firewall-cmd --reload

# Verificar puertos abiertos
firewall-cmd --list-ports
```

#### 2.3 Configurar Zona Horaria

```bash
# Ver zona actual
timedatectl

# Configurar zona horaria de Chile
timedatectl set-timezone America/Santiago

# Verificar
date
```

---

### PASO 3: Instalar Node.js 18

#### 3.1 Instalar Node.js desde NodeSource

```bash
# Descargar script de instalación
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -

# Instalar Node.js
yum install -y nodejs

# Verificar instalación
node --version    # Debe mostrar: v18.x.x
npm --version     # Debe mostrar: 9.x.x o superior
```

#### 3.2 Instalar PM2 Globalmente

```bash
npm install -g pm2

# Verificar
pm2 --version
```

---

### PASO 4: Instalar MariaDB

#### 4.1 Instalar MariaDB 5.5

```bash
# Instalar MariaDB
yum install -y mariadb-server mariadb

# Iniciar servicio
systemctl start mariadb
systemctl enable mariadb

# Verificar estado
systemctl status mariadb
```

#### 4.2 Configurar Seguridad de MariaDB

```bash
# Ejecutar script de seguridad
mysql_secure_installation
```

**Durante la instalación, responde:**
- Enter current password for root: **Presiona Enter** (sin contraseña)
- Set root password? **Y** (Sí)
- New password: **Ingresa una contraseña segura** (¡GUÁRDALA!)
- Remove anonymous users? **Y**
- Disallow root login remotely? **N** (si necesitas acceso remoto) o **Y** (más seguro)
- Remove test database? **Y**
- Reload privilege tables? **Y**

#### 4.3 Crear Base de Datos y Usuario

```bash
# Conectarse a MySQL
mysql -u root -p
# Ingresa la contraseña que configuraste
```

```sql
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS codi_ejamtest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario (cambia 'tu_password' por una contraseña segura)
CREATE USER 'pjud_user'@'localhost' IDENTIFIED BY 'tu_password_segura';
CREATE USER 'pjud_user'@'127.0.0.1' IDENTIFIED BY 'tu_password_segura';

-- Dar permisos
GRANT ALL PRIVILEGES ON codi_ejamtest.* TO 'pjud_user'@'localhost';
GRANT ALL PRIVILEGES ON codi_ejamtest.* TO 'pjud_user'@'127.0.0.1';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;
SELECT user, host FROM mysql.user WHERE user='pjud_user';

-- Salir
EXIT;
```

---

### PASO 5: Subir Código al Servidor

#### 5.1 Opción A: Clonar desde Git (Recomendado)

```bash
# Crear directorio para la aplicación
mkdir -p /opt/pjud-webscrapping
cd /opt/pjud-webscrapping

# Clonar repositorio
git clone https://github.com/Roinflames/pjud-webscrapping.git .

# O si es un repo privado:
git clone https://USUARIO:TOKEN@github.com/Roinflames/pjud-webscrapping.git .

# Cambiar a la branch correcta
git checkout diegogo-test
```

#### 5.2 Opción B: Subir Archivos Manualmente

**Desde tu computadora local:**
```bash
# Comprimir proyecto (sin node_modules)
tar -czf pjud-webscrapping.tar.gz --exclude='node_modules' --exclude='.git' pjud-webscrapping/

# Subir al servidor
scp pjud-webscrapping.tar.gz root@TU_IP_SERVIDOR:/opt/
```

**En el servidor:**
```bash
cd /opt
tar -xzf pjud-webscrapping.tar.gz
mv pjud-webscrapping pjud-webscrapping
cd pjud-webscrapping
```

---

### PASO 6: Instalar Dependencias del Proyecto

```bash
cd /opt/pjud-webscrapping

# Instalar dependencias de Node.js
npm install

# Instalar Playwright y Chromium
npx playwright install chromium

# Verificar instalación
npx playwright --version
```

---

### PASO 7: Configurar Variables de Entorno

```bash
# Crear archivo .env
nano /opt/pjud-webscrapping/.env
```

**Contenido del archivo .env:**
```env
# Base de Datos
DB_HOST=localhost
DB_USER=pjud_user
DB_PASSWORD=tu_password_segura
DB_NAME=codi_ejamtest
DB_PORT=3306

# API
API_PORT=3000
API_HOST=0.0.0.0

# PJUD
OJV_URL=https://oficinajudicialvirtual.pjud.cl/indexN.php

# Node Environment
NODE_ENV=production

# Opcional: Token para API
API_TOKEN=tu_token_secreto_aqui
```

**Guardar y salir:** `Ctrl+X`, luego `Y`, luego `Enter`

---

### PASO 8: Crear Tablas Necesarias en la Base de Datos

#### 8.1 Importar Estructura de la Base de Datos

Si ya tienes un backup SQL de tu base de datos:
```bash
mysql -u pjud_user -p codi_ejamtest < tu_backup.sql
```

#### 8.2 Crear Tabla de Cola de Scraping

```bash
cd /opt/pjud-webscrapping
node src/utils/crear-tabla-cola.js
```

#### 8.3 Crear Tabla de Eventos ERP

```bash
mysql -u pjud_user -p codi_ejamtest < docs/sql/tabla_eventos_scraping.sql
```

#### 8.4 Verificar Tablas Creadas

```bash
mysql -u pjud_user -p codi_ejamtest -e "SHOW TABLES;"
```

Debes ver:
- `pjud_cola_scraping`
- `pjud_eventos_scraping`
- Y tus tablas existentes (causa, agenda, etc.)

---

### PASO 9: Preparar Archivos Necesarios

#### 9.1 Subir Archivos CSV

```bash
# Crear directorio si no existe
mkdir -p /opt/pjud-webscrapping/uploads

# Si tienes causa_validas.csv, súbelo:
# scp causa_validas.csv root@TU_IP_SERVIDOR:/opt/pjud-webscrapping/
```

#### 9.2 Generar Datos de Tribunales (si no existen)

```bash
cd /opt/pjud-webscrapping
node src/extraer-tribunales-http.js
```

Esto generará:
- `src/outputs/tribunales_pjud_ids.json`
- `src/outputs/tribunales_pjud_completo.json`

---

### PASO 10: Configurar PM2 para Ejecución Continua

#### 10.1 Verificar Configuración de PM2

```bash
cd /opt/pjud-webscrapping
cat ecosystem.config.js
```

#### 10.2 Iniciar Servicios con PM2

```bash
# Iniciar todos los servicios
pm2 start ecosystem.config.js

# O usar el script npm
npm run services:start

# Ver estado
pm2 status

# Ver logs
pm2 logs
```

#### 10.3 Guardar Configuración de PM2

```bash
# Guardar configuración para que se inicie al reiniciar el servidor
pm2 save

# Configurar PM2 para iniciar al arrancar el sistema
pm2 startup
# Copia y ejecuta el comando que te muestre (será algo como):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

#### 10.4 Comandos Útiles de PM2

```bash
# Ver estado de todos los servicios
pm2 status

# Ver logs en tiempo real
pm2 logs

# Ver logs de un servicio específico
pm2 logs api-pjud
pm2 logs listener-pjud
pm2 logs worker-pjud

# Reiniciar un servicio
pm2 restart api-pjud

# Reiniciar todos los servicios
pm2 restart all

# Detener un servicio
pm2 stop api-pjud

# Detener todos
pm2 stop all

# Eliminar un servicio de PM2
pm2 delete api-pjud
```

---

### PASO 11: Verificar que Todo Funciona

#### 11.1 Verificar que la API Responde

```bash
# Desde el servidor
curl http://localhost:3000/api/health

# Debe retornar JSON con status: "ok"
```

#### 11.2 Verificar desde tu Computadora

```bash
# Reemplaza TU_IP_SERVIDOR con la IP real
curl http://TU_IP_SERVIDOR:3000/api/health
```

#### 11.3 Verificar Endpoints de Causas

```bash
curl http://TU_IP_SERVIDOR:3000/api/mvp/estadisticas
curl "http://TU_IP_SERVIDOR:3000/api/mvp/causas?valida=true&limite=5"
```

#### 11.4 Acceder al Frontend

Abre en tu navegador:
```
http://TU_IP_SERVIDOR:3000/mvp
http://TU_IP_SERVIDOR:3000/modulos-erp.html
```

---

### PASO 12: Configurar Logs

#### 12.1 Verificar Directorio de Logs

```bash
ls -la /opt/pjud-webscrapping/logs/
```

Debes ver:
- `api-error.log`
- `api-out.log`
- `listener-error.log`
- `listener-out.log`
- `worker-error.log`
- `worker-out.log`

#### 12.2 Configurar Rotación de Logs (Opcional)

```bash
# Instalar logrotate si no está instalado
yum install -y logrotate

# Crear configuración de logrotate
nano /etc/logrotate.d/pjud-webscrapping
```

**Contenido:**
```
/opt/pjud-webscrapping/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 root root
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

### PASO 13: Configurar Monitoreo (Opcional)

#### 13.1 Monitorear Recursos en Tiempo Real

```bash
# Instalar htop
yum install -y htop

# Ejecutar
htop
```

#### 13.2 Monitorear Uso de Disco

```bash
df -h
```

#### 13.3 Ver Procesos Node.js

```bash
ps aux | grep node
```

---

## 🔒 Seguridad Adicional

### 1. Cambiar Puerto SSH (Recomendado)

```bash
# Editar configuración SSH
nano /etc/ssh/sshd_config

# Cambiar línea:
# Port 22
# Por:
# Port 2222

# Reiniciar SSH
systemctl restart sshd

# Agregar nuevo puerto al firewall
firewall-cmd --permanent --add-port=2222/tcp
firewall-cmd --reload
```

### 2. Configurar Fail2Ban (Protección contra Brute Force)

```bash
# Instalar fail2ban
yum install -y epel-release
yum install -y fail2ban

# Iniciar y habilitar
systemctl start fail2ban
systemctl enable fail2ban
```

### 3. Configurar Nginx como Reverse Proxy (Recomendado para Producción)

```bash
# Instalar Nginx
yum install -y nginx

# Configurar
nano /etc/nginx/conf.d/pjud.conf
```

**Contenido:**
```nginx
server {
    listen 80;
    server_name TU_DOMINIO_O_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Iniciar Nginx
systemctl start nginx
systemctl enable nginx

# Abrir puerto 80 en firewall
firewall-cmd --permanent --add-service=http
firewall-cmd --reload
```

---

## ✅ Checklist Final

Verifica que todo esté funcionando:

- [ ] Servidor accesible por SSH
- [ ] Node.js 18 instalado
- [ ] MariaDB instalado y corriendo
- [ ] Base de datos creada
- [ ] Usuario de BD creado
- [ ] Tablas `pjud_cola_scraping` y `pjud_eventos_scraping` creadas
- [ ] Código del proyecto en `/opt/pjud-webscrapping`
- [ ] Dependencias npm instaladas
- [ ] Playwright instalado
- [ ] Archivo `.env` configurado
- [ ] Archivos CSV necesarios presentes
- [ ] Datos de tribunales generados
- [ ] PM2 iniciado con todos los servicios
- [ ] PM2 configurado para iniciar al arrancar
- [ ] API responde en `http://TU_IP:3000/api/health`
- [ ] Frontend accesible en `http://TU_IP:3000/mvp`
- [ ] Firewall configurado
- [ ] Logs funcionando

---

## 🆘 Solución de Problemas Comunes

### Error: "Cannot find module"

```bash
cd /opt/pjud-webscrapping
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3000 already in use"

```bash
# Ver qué proceso usa el puerto
lsof -i :3000

# Matar proceso
kill -9 PID_DEL_PROCESO

# O reiniciar servicios PM2
pm2 restart all
```

### Error: "Playwright browser not found"

```bash
npx playwright install chromium
```

### Error: "MySQL connection refused"

```bash
# Verificar que MySQL esté corriendo
systemctl status mariadb

# Si no está corriendo
systemctl start mariadb
systemctl enable mariadb
```

### Error: "Permission denied"

```bash
# Dar permisos al directorio del proyecto
chown -R root:root /opt/pjud-webscrapping
chmod -R 755 /opt/pjud-webscrapping
```

---

## 📞 Comandos de Emergencia

```bash
# Reiniciar todos los servicios
pm2 restart all

# Ver logs en tiempo real
pm2 logs

# Ver estado del sistema
pm2 status
systemctl status mariadb
df -h
free -h

# Reiniciar servidor completo
reboot
```

---

## 📝 Notas Importantes

1. **Backup**: Configura el Backup Premium Diario si es posible
2. **Monitoreo**: Revisa los logs regularmente: `pm2 logs`
3. **Actualizaciones**: Actualiza el sistema periódicamente: `yum update -y`
4. **Seguridad**: Mantén el sistema actualizado y cambia contraseñas regularmente

---

## 🎯 Próximos Pasos

Una vez configurado el servidor:

1. Probar scraping manualmente
2. Configurar eventos desde el ERP
3. Verificar que el worker procese eventos
4. Configurar monitoreo continuo
5. Configurar alertas (email, etc.)

---

**¿Necesitas ayuda?** Revisa los logs con `pm2 logs` y comparte el error específico.

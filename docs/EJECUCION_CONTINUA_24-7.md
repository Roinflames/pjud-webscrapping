# 🔄 Configuración para Ejecución Continua 24/7

Esta guía explica cómo configurar el sistema para ejecutar el scraping de fondo todo el año sin interrupciones.

## 📋 Requisitos para Ejecución Continua

### Servidor:
- **CentOS 7.9** (compatible con producción)
- **4GB RAM mínimo** (Playwright consume memoria)
- **2 vCPU mínimo**
- **50GB disco** (PDFs se acumulan)
- **Uptime garantizado** (99.9% recomendado)

### Configuraciones Necesarias:
1. ✅ PM2 con reinicio automático
2. ✅ Inicio automático al reiniciar servidor
3. ✅ Monitoreo de recursos
4. ✅ Logs rotativos
5. ✅ Backups automáticos
6. ✅ Alertas por email

---

## 🚀 Configuración Paso a Paso

### Opción 1: Usar Script de Control (Recomendado)

```bash
# Iniciar servicios
bash scripts/control-servicios.sh start

# Habilitar ejecución continua 24/7
bash scripts/control-servicios.sh enable

# Ver estado
bash scripts/control-servicios.sh status

# Detener servicios (deshabilitar ejecución continua)
bash scripts/control-servicios.sh stop

# Deshabilitar inicio automático
bash scripts/control-servicios.sh disable
```

### Opción 2: Comandos PM2 Directos

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar servicios
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Configurar inicio automático al reiniciar servidor (CentOS 7)
pm2 startup systemd
# Copiar y ejecutar el comando que te muestra
```

### 2. Verificar Inicio Automático

```bash
# Verificar que PM2 está configurado para iniciar automáticamente
sudo systemctl status pm2-$(whoami)

# Probar reiniciando el servidor
sudo reboot

# Después de reiniciar, verificar que los procesos están corriendo
pm2 status
```

### 3. Configurar Logs Rotativos

PM2 ya tiene rotación de logs, pero puedes configurar límites:

```bash
# Instalar módulo de rotación de logs
pm2 install pm2-logrotate

# Configurar rotación
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 4. Monitoreo de Recursos

```bash
# Monitoreo en tiempo real
pm2 monit

# Ver estadísticas
pm2 status
pm2 list

# Ver logs
pm2 logs
pm2 logs worker-pjud --lines 100
```

### 5. Configurar Alertas por Email (Opcional)

Instalar `pm2-mail`:

```bash
pm2 install pm2-mail

# Configurar email
pm2 set pm2-mail:to tu-email@ejemplo.com
pm2 set pm2-mail:from pm2@servidor.com
```

---

## 🔧 Configuración Específica para CentOS 7

### SELinux (si está activo)

Si SELinux está en modo `Enforcing`, puede bloquear Node.js:

```bash
# Verificar estado
getenforce

# Si está en Enforcing, configurar políticas (recomendado)
# O temporalmente desactivar (solo para pruebas)
sudo setenforce 0
```

**Para producción**, configura políticas SELinux apropiadas.

### Firewall (firewalld)

```bash
# Abrir puertos necesarios
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Verificar
sudo firewall-cmd --list-ports
```

### MariaDB - Inicio Automático

```bash
# Asegurar que MariaDB inicia automáticamente
sudo systemctl enable mariadb
sudo systemctl start mariadb

# Verificar
sudo systemctl status mariadb
```

---

## 📊 Monitoreo y Mantenimiento

### Comandos Útiles

```bash
# Estado de todos los procesos
pm2 status

# Reiniciar un proceso específico
pm2 restart worker-pjud

# Ver logs en tiempo real
pm2 logs --lines 50

# Ver uso de recursos
pm2 monit

# Reiniciar todos los procesos
pm2 restart all

# Detener todos
pm2 stop all

# Eliminar todos
pm2 delete all
```

### Verificar Uso de Recursos

```bash
# Uso de CPU y memoria
top
htop  # Si está instalado

# Uso de disco
df -h

# Espacio en outputs (PDFs)
du -sh src/outputs/

# Ver procesos Node.js
ps aux | grep node
```

---

## 🔄 Mantenimiento Preventivo

### Limpieza de Archivos Antiguos

Crear script de limpieza (`scripts/limpiar-outputs.sh`):

```bash
#!/bin/bash
# Limpiar PDFs y JSONs más antiguos de 90 días

find src/outputs/ -name "*.pdf" -mtime +90 -delete
find src/outputs/ -name "*.json" -mtime +90 -delete
find src/logs/ -name "*.log" -mtime +30 -delete

echo "Limpieza completada: $(date)"
```

Agregar a crontab:

```bash
# Editar crontab
crontab -e

# Agregar limpieza semanal (domingos a las 2 AM)
0 2 * * 0 /ruta/al/proyecto/scripts/limpiar-outputs.sh
```

### Backups Automáticos

```bash
# Crear script de backup (scripts/backup-daily.sh)
#!/bin/bash
BACKUP_DIR="/backups/pjud"
DATE=$(date +%Y%m%d)

# Backup de base de datos
mysqldump -u root -p tu_password codi_ejamtest > $BACKUP_DIR/db_$DATE.sql

# Backup de archivos importantes
tar -czf $BACKUP_DIR/files_$DATE.tar.gz src/outputs/ src/config/

# Eliminar backups más antiguos de 30 días
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

Agregar a crontab (backup diario a las 3 AM):

```bash
0 3 * * * /ruta/al/proyecto/scripts/backup-daily.sh
```

---

## 🚨 Solución de Problemas

### Proceso se detiene frecuentemente

```bash
# Ver logs de errores
pm2 logs worker-pjud --err

# Verificar memoria disponible
free -h

# Aumentar límite de memoria en ecosystem.config.js
max_memory_restart: '2G'
```

### Playwright no funciona en CentOS 7

Instalar dependencias faltantes:

```bash
sudo yum install -y nss atk at-spi2-atk libdrm libxkbcommon \
  libxcomposite libxdamage libxrandr mesa-libgbm alsa-lib
```

### MariaDB no inicia

```bash
# Ver logs
sudo journalctl -u mariadb

# Reiniciar servicio
sudo systemctl restart mariadb
```

### PM2 no inicia automáticamente

```bash
# Reconfigurar
pm2 unstartup systemd
pm2 startup systemd

# Verificar servicio
sudo systemctl status pm2-$(whoami)
```

---

## 📈 Optimizaciones para 24/7

### 1. Ajustar Intervalos

En `src/api/listener.js`:
```javascript
const CHECK_INTERVAL = 10000; // 10 segundos (ajustar según necesidad)
```

En `src/worker_cola_scraping.js`:
```javascript
const INTERVAL_MS = 10000; // 10 segundos entre verificaciones
```

### 2. Limitar Uso de Recursos

En `ecosystem.config.js`:
```javascript
max_memory_restart: '1G', // Reiniciar si excede 1GB
```

### 3. Configurar Timeouts

Asegurar que los timeouts en Playwright sean razonables:
```javascript
timeout: 60000 // 60 segundos máximo por operación
```

---

## 🔧 Control de Ejecución Continua (Habilitar/Deshabilitar)

### Habilitar Ejecución Continua 24/7

```bash
# Iniciar servicios
bash scripts/control-servicios.sh start

# Habilitar inicio automático
bash scripts/control-servicios.sh enable
```

### Deshabilitar Ejecución Continua

```bash
# Detener servicios
bash scripts/control-servicios.sh stop

# Deshabilitar inicio automático
bash scripts/control-servicios.sh disable
```

### Ver Estado

```bash
# Ver estado de servicios
bash scripts/control-servicios.sh status

# Ver logs
bash scripts/control-servicios.sh logs
bash scripts/control-servicios.sh logs:api
bash scripts/control-servicios.sh logs:worker
```

### Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `start` | Iniciar todos los servicios |
| `stop` | Detener todos los servicios |
| `restart` | Reiniciar todos los servicios |
| `status` | Ver estado de servicios |
| `enable` | Habilitar inicio automático (24/7) |
| `disable` | Deshabilitar inicio automático |
| `logs` | Ver logs de todos los servicios |

## ✅ Checklist de Ejecución Continua

- [ ] PM2 instalado y configurado
- [ ] Servicios iniciados (`bash scripts/control-servicios.sh start`)
- [ ] Inicio automático habilitado (`bash scripts/control-servicios.sh enable`)
- [ ] Verificar estado (`bash scripts/control-servicios.sh status`)
- [ ] Logs rotativos configurados
- [ ] MariaDB configurado para inicio automático
- [ ] Firewall configurado correctamente
- [ ] Backups automáticos configurados
- [ ] Limpieza de archivos antiguos configurada
- [ ] Monitoreo configurado
- [ ] Alertas por email configuradas (opcional)
- [ ] Probar reinicio del servidor
- [ ] Verificar que todo inicia automáticamente

---

## 📞 Soporte

Si tienes problemas con la ejecución continua:

1. Revisar logs: `pm2 logs`
2. Verificar recursos: `pm2 monit`
3. Revisar estado de servicios: `sudo systemctl status mariadb`
4. Verificar espacio en disco: `df -h`

---

**Con esta configuración, tu sistema debería ejecutarse de forma continua 24/7 durante todo el año.** 🎉

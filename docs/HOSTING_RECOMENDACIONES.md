# 🚀 Recomendaciones de Hosting - Sistema PJUD

## 📋 Requisitos del Sistema

### Componentes que necesitan hosting:
1. **API Express** (puerto 3000) - Servidor HTTP para exponer tribunales
2. **Listener de BD** - Script que monitorea cambios en MySQL
3. **Worker de Scraping** - Procesa cola con Playwright (Chromium headless)
4. **Base de Datos MySQL** - Almacena causas, cola, movimientos
5. **Almacenamiento** - PDFs y JSONs generados

### Requisitos Técnicos:
- **Node.js** 14+ 
- **Playwright** con Chromium (headless)
- **MySQL/MariaDB** 5.5+ (producción usa 5.5.68)
- **RAM mínima**: 2GB (4GB recomendado para Playwright)
- **CPU**: 2 vCPU mínimo
- **Disco**: 20GB mínimo (PDFs ocupan espacio)
- **Solo 1 worker** (una cola, no necesita escalar)
- **Ejecución continua 24/7** (scraping de fondo todo el año)

### ⚠️ Entorno de Producción:
- **OS**: CentOS Linux 7.9.2009
- **MariaDB**: 5.5.68
- **Apache**: 2.4.6
- **PHP**: 7.4.33

**Recomendación**: Arrendar servidor con CentOS 7 para compatibilidad con producción.

---

## 🇨🇱 Opciones de Hosting Nacional (Chile)

### ⭐ **RECOMENDACIÓN PRINCIPAL: VPS Nacional**

Para un sistema con Playwright y MySQL, necesitas un **VPS (Virtual Private Server)** con control total. Las opciones nacionales más económicas y documentadas:

---

## 🥇 **Opción 1: Hosting.cl VPS** (Recomendada)

### ✅ Ventajas:
- **Hosting nacional** (datacenter en Chile)
- **Bien documentado** (wiki y tutoriales en español)
- **Precios competitivos** (~$15.000-25.000 CLP/mes)
- **Soporte en español**
- **Panel de control** (cPanel/Plesk opcional)
- **Soporta CentOS 7** (compatible con producción)
- **Uptime garantizado** (importante para ejecución 24/7)

### 📦 Plan Recomendado para Ejecución Continua:
- **VPS Básico**: 2 vCPU, 4GB RAM, 50GB SSD
- **Precio**: ~$20.000 CLP/mes
- **CentOS 7.9** (compatible con producción)
- **MariaDB 5.5+** (compatible con producción)
- **Ancho de banda**: Ilimitado o suficiente para scraping continuo

### 🔗 Links:
- Web: https://www.hosting.cl
- VPS: https://www.hosting.cl/vps
- Documentación: https://wiki.hosting.cl

### 📝 Configuración Inicial:

**Para CentOS 7 (Producción):**
```bash
# Clonar o subir el proyecto
git clone <tu-repo> pjud-webscrapping
cd pjud-webscrapping

# Ejecutar script de instalación para CentOS
bash scripts/setup-server-centos.sh
```

**Para Ubuntu/Debian:**
```bash
# Clonar o subir el proyecto
git clone <tu-repo> pjud-webscrapping
cd pjud-webscrapping

# Ejecutar script de instalación
bash scripts/setup-server.sh
```

**Opción B: Manual**
```bash
# 1. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Instalar MySQL
sudo apt-get install mysql-server

# 3. Instalar Playwright
npm install
npx playwright install chromium

# 4. Configurar PM2 para procesos
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🥈 **Opción 2: Niclabs VPS**

### ✅ Ventajas:
- **Hosting nacional** (Santiago)
- **Documentación técnica** completa
- **Precios desde $12.000 CLP/mes**
- **Soporte técnico** especializado

### 📦 Plan Recomendado:
- **VPS Starter**: 2 vCPU, 4GB RAM, 40GB SSD
- **Precio**: ~$18.000 CLP/mes

### 🔗 Links:
- Web: https://www.niclabs.cl
- VPS: https://www.niclabs.cl/servidores/vps

---

## 🥉 **Opción 3: Hosting.cl Cloud** (Alternativa)

### ✅ Ventajas:
- **Cloud nacional** (más flexible)
- **Escalable** (aunque solo necesitas 1 worker)
- **Bien documentado**
- **Pago por uso** o plan fijo

### 📦 Plan Recomendado:
- **Cloud Básico**: 2 vCPU, 4GB RAM, 50GB
- **Precio**: ~$22.000 CLP/mes

---

## 💰 Comparación de Costos (Mensual) - Ejecución 24/7

| Proveedor | Plan | RAM | CPU | Disco | CentOS 7 | Precio CLP/mes |
|-----------|------|-----|-----|-------|----------|----------------|
| **Hosting.cl VPS** | Básico | 4GB | 2 vCPU | 50GB | ✅ Sí | ~$20.000 |
| **Niclabs VPS** | Starter | 4GB | 2 vCPU | 40GB | ✅ Sí | ~$18.000 |
| **Hosting.cl Cloud** | Básico | 4GB | 2 vCPU | 50GB | ✅ Sí | ~$22.000 |

**Nota**: 
- Precios aproximados, verificar en sitio web actualizado
- Todos los planes soportan ejecución continua 24/7
- Verificar SLA (Service Level Agreement) para uptime garantizado

---

## 🛠️ Configuración Recomendada del Servidor

### Estructura de Procesos con PM2:

**Usando el archivo de configuración (Recomendado):**
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar todos los servicios con un comando
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

**O manualmente:**
```bash
pm2 start src/api/server.js --name "api-pjud"
pm2 start src/api/listener.js --name "listener-pjud"
pm2 start src/worker_cola_scraping.js --name "worker-pjud"
pm2 save
pm2 startup
```

### Variables de Entorno (.env):

```env
# Base de datos
DB_HOST=localhost
DB_USER=pjud_user
DB_PASSWORD=tu_password_seguro
DB_NAME=codi_ejamtest
DB_PORT=3306

# API
API_PORT=3000
NODE_ENV=production

# PJUD
OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php
```

### Firewall (UFW):

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # API (o usar Nginx como proxy)
sudo ufw enable
```

---

## 🔒 Seguridad Recomendada

1. **Nginx como Reverse Proxy** (opcional pero recomendado):
   - SSL/HTTPS con Let's Encrypt (gratis)
   - Proxy a puerto 3000
   - Rate limiting

2. **Firewall**:
   - Solo abrir puertos necesarios
   - SSH con clave, no password

3. **Backups**:
   - Backup diario de MySQL
   - Backup semanal de archivos PDFs/JSONs

---

## 📊 Monitoreo y Logs

### Con PM2:
```bash
# Ver logs
pm2 logs

# Monitoreo en tiempo real
pm2 monit

# Estado de procesos
pm2 status
```

### Logs del Sistema:
- `src/logs/` - Logs de scraping
- PM2 logs - Logs de procesos Node.js
- MySQL logs - Logs de base de datos

---

## 🚫 Opciones NO Recomendadas

### ❌ Hosting Compartido:
- No permite instalar Playwright
- No permite ejecutar procesos de larga duración
- Recursos limitados

### ❌ Cloud Internacional (AWS, Azure, GCP):
- Más caro
- Latencia desde Chile
- No es "nacional"

### ❌ Servidor Dedicado:
- Muy caro para este uso
- Overkill para 1 worker

---

## 📝 Checklist de Implementación

### Antes de Contratar:
- [ ] Verificar que el VPS permita instalar Playwright
- [ ] Confirmar que incluye MySQL o puedes instalarlo
- [ ] Verificar documentación disponible
- [ ] Revisar políticas de uso (scraping puede estar restringido)

### Después de Contratar:
- [ ] Seleccionar CentOS 7.9 como SO (compatible con producción)
- [ ] Instalar Node.js 18+ (usar script `setup-server-centos.sh`)
- [ ] Verificar/Instalar MariaDB 5.5+ (compatible con producción)
- [ ] Instalar Playwright y Chromium
- [ ] Configurar PM2 para procesos con inicio automático
- [ ] Configurar firewall (firewalld en CentOS)
- [ ] Configurar backups automáticos
- [ ] Configurar monitoreo y alertas
- [ ] Configurar PM2 para reinicio automático en caso de fallo
- [ ] Probar ejecución continua 24/7

---

## 🆘 Soporte y Documentación

### Hosting.cl:
- Wiki: https://wiki.hosting.cl
- Soporte: tickets en panel de control
- Documentación: extensa en español

### Niclabs:
- Documentación técnica disponible
- Soporte por email/tickets

---

## 💡 Recomendación Final

**Para tu caso (barato, nacional, bien documentado, 1 worker, ejecución 24/7, compatible con CentOS 7):**

**🥇 Hosting.cl VPS Básico con CentOS 7.9** - Mejor relación precio/calidad/documentación

**Razones:**
1. ✅ Precio competitivo (~$20.000/mes)
2. ✅ Documentación completa en español
3. ✅ Soporte nacional
4. ✅ Recursos suficientes para Playwright
5. ✅ Compatible con producción (CentOS 7.9, MariaDB 5.5)
6. ✅ Uptime garantizado para ejecución continua
7. ✅ Script de instalación incluido para CentOS

**Alternativa si necesitas más económico:**
- **Niclabs VPS Starter con CentOS 7** (~$18.000/mes) - Similar pero menos documentación

**⚠️ Importante para Ejecución 24/7:**
- Verificar SLA (99.9% uptime mínimo recomendado)
- Configurar PM2 con reinicio automático
- Monitorear recursos (RAM, CPU, disco)
- Configurar alertas por email
- Backups diarios automáticos

---

## 📞 Próximos Pasos

1. **Contactar proveedor** y confirmar requisitos técnicos (CentOS 7.9)
2. **Contratar VPS** con CentOS 7.9 (compatible con producción)
3. **Configurar servidor** siguiendo guía de instalación:
   ```bash
   bash scripts/setup-server-centos.sh
   ```
4. **Desplegar aplicación** con PM2:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup systemd
   ```
5. **Configurar ejecución continua 24/7** (ver `docs/EJECUCION_CONTINUA_24-7.md`)
6. **Configurar backups** automáticos
7. **Monitorear** primeros días para ajustar recursos

## 📚 Documentación Adicional

- **Ejecución Continua 24/7**: Ver `docs/EJECUCION_CONTINUA_24-7.md` para configuración detallada
- **Scripts de instalación**: 
  - CentOS 7: `scripts/setup-server-centos.sh`
  - Ubuntu/Debian: `scripts/setup-server.sh`

---

**¿Necesitas ayuda con la configuración del servidor?** Puedo crear scripts de instalación automatizados.

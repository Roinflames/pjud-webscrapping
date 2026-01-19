#!/bin/bash

# Script de Instalación para Servidor VPS - CentOS 7
# Sistema PJUD - Web Scraping
# Compatible con: CentOS 7.9 (producción)
#
# Uso: bash scripts/setup-server-centos.sh

set -e

echo "=========================================="
echo "🚀 Instalación del Sistema PJUD - CentOS 7"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que es CentOS/RHEL
if [ ! -f /etc/redhat-release ]; then
    echo -e "${RED}❌ Este script solo funciona en CentOS/RHEL${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Sistema operativo compatible${NC}"
cat /etc/redhat-release
echo ""

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo yum update -y

# Instalar EPEL (repositorio adicional necesario)
echo "📦 Instalando EPEL repository..."
sudo yum install -y epel-release

# Instalar herramientas básicas
echo "📦 Instalando herramientas básicas..."
sudo yum install -y curl wget git gcc gcc-c++ make

# Instalar Node.js 18.x
echo "📦 Instalando Node.js 18.x..."
if ! command -v node &> /dev/null; then
    # Usar NodeSource para CentOS
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
    echo -e "${GREEN}✅ Node.js instalado: $(node --version)${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js ya está instalado: $(node --version)${NC}"
fi

# Verificar/Instalar MariaDB (ya debería estar en producción)
echo "📦 Verificando MariaDB..."
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  MariaDB no encontrado. Instalando...${NC}"
    sudo yum install -y mariadb-server mariadb
    sudo systemctl enable mariadb
    sudo systemctl start mariadb
    echo -e "${GREEN}✅ MariaDB instalado${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Configura la contraseña con: sudo mysql_secure_installation${NC}"
else
    echo -e "${GREEN}✅ MariaDB ya está instalado: $(mysql --version)${NC}"
    # Asegurar que esté corriendo
    sudo systemctl enable mariadb
    sudo systemctl start mariadb
fi

# Instalar PM2 globalmente
echo "📦 Instalando PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo -e "${GREEN}✅ PM2 instalado${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 ya está instalado${NC}"
fi

# Instalar dependencias del proyecto
echo "📦 Instalando dependencias del proyecto..."
cd "$(dirname "$0")/.."
npm install

# Instalar Playwright y Chromium
echo "📦 Instalando Playwright y Chromium..."
# En CentOS 7, necesitamos dependencias adicionales para Chromium
sudo yum install -y nss atk at-spi2-atk libdrm libxkbcommon libxcomposite libxdamage libxrandr mesa-libgbm alsa-lib
npx playwright install chromium
echo -e "${GREEN}✅ Playwright instalado${NC}"

# Crear directorios necesarios
echo "📁 Creando directorios..."
mkdir -p src/logs
mkdir -p src/outputs
mkdir -p backups
mkdir -p logs  # Para PM2
echo -e "${GREEN}✅ Directorios creados${NC}"

# Configurar firewall (firewalld en CentOS 7)
echo "🔥 Configurando firewall..."
if command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=22/tcp
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --reload
    echo -e "${GREEN}✅ Firewall configurado${NC}"
elif command -v iptables &> /dev/null; then
    sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
    sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
    sudo service iptables save
    echo -e "${GREEN}✅ Firewall configurado (iptables)${NC}"
else
    echo -e "${YELLOW}⚠️  No se encontró firewall. Configúralo manualmente.${NC}"
fi

# Configurar SELinux (puede bloquear Node.js)
echo "🔒 Configurando SELinux..."
if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce)
    if [ "$SELINUX_STATUS" = "Enforcing" ]; then
        echo -e "${YELLOW}⚠️  SELinux está en modo Enforcing${NC}"
        echo -e "${YELLOW}   Para producción, considera configurar políticas SELinux${NC}"
        echo -e "${YELLOW}   O temporalmente: sudo setenforce 0 (no recomendado para producción)${NC}"
    fi
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Instalación completada${NC}"
echo "=========================================="
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Configura el archivo .env:"
echo "   cp .env.example .env"
echo "   nano .env"
echo ""
echo "2. Configura MariaDB (si es necesario):"
echo "   sudo mysql_secure_installation"
echo "   mysql -u root -p < docs/sql/crear_base_datos.sql"
echo ""
echo "3. Inicia los servicios con PM2:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup systemd"
echo ""
echo "4. Verifica que todo esté corriendo:"
echo "   pm2 status"
echo "   pm2 logs"
echo ""
echo "5. Para ejecución continua 24/7, configura PM2 para reiniciar:"
echo "   pm2 startup systemd"
echo "   sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u \$USER --hp \$HOME"
echo ""
echo "=========================================="

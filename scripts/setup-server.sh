#!/bin/bash

# Script de Instalación para Servidor VPS
# Sistema PJUD - Web Scraping
#
# Uso: bash scripts/setup-server.sh

set -e

echo "=========================================="
echo "🚀 Instalación del Sistema PJUD"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que es Ubuntu/Debian
if ! command -v apt-get &> /dev/null; then
    echo -e "${RED}❌ Este script solo funciona en Ubuntu/Debian${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Sistema operativo compatible${NC}"
echo ""

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt-get update
sudo apt-get upgrade -y

# Instalar herramientas básicas
echo "📦 Instalando herramientas básicas..."
sudo apt-get install -y curl wget git build-essential

# Instalar Node.js 18.x
echo "📦 Instalando Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js instalado: $(node --version)${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js ya está instalado: $(node --version)${NC}"
fi

# Instalar MySQL
echo "📦 Instalando MySQL..."
if ! command -v mysql &> /dev/null; then
    sudo apt-get install -y mysql-server
    echo -e "${GREEN}✅ MySQL instalado${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Configura la contraseña de root con: sudo mysql_secure_installation${NC}"
else
    echo -e "${YELLOW}⚠️  MySQL ya está instalado${NC}"
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
npx playwright install chromium
echo -e "${GREEN}✅ Playwright instalado${NC}"

# Crear directorios necesarios
echo "📁 Creando directorios..."
mkdir -p src/logs
mkdir -p src/outputs
mkdir -p backups
echo -e "${GREEN}✅ Directorios creados${NC}"

# Configurar firewall básico
echo "🔥 Configurando firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp
    sudo ufw allow 3000/tcp
    echo -e "${YELLOW}⚠️  Firewall configurado. Actívalo con: sudo ufw enable${NC}"
else
    echo -e "${YELLOW}⚠️  UFW no está instalado. Instálalo con: sudo apt-get install ufw${NC}"
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
echo "2. Configura MySQL:"
echo "   sudo mysql_secure_installation"
echo "   mysql -u root -p < docs/sql/crear_base_datos.sql"
echo ""
echo "3. Inicia los servicios con PM2:"
echo "   pm2 start src/api/server.js --name 'api-pjud'"
echo "   pm2 start src/api/listener.js --name 'listener-pjud'"
echo "   pm2 start src/worker_cola_scraping.js --name 'worker-pjud'"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "4. Verifica que todo esté corriendo:"
echo "   pm2 status"
echo "   pm2 logs"
echo ""
echo "=========================================="

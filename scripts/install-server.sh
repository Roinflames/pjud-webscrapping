#!/bin/bash

# Script de instalación automática para servidor Linux
# Uso: bash scripts/install-server.sh

set -e  # Salir si hay algún error

echo "🚀 Instalador automático de PJUD Web Scraping"
echo "=============================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar si está en directorio del proyecto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encontró package.json${NC}"
    echo "   Por favor, ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# Detectar sistema operativo
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    echo -e "${RED}❌ No se pudo detectar el sistema operativo${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Sistema detectado: $OS $VERSION${NC}"
echo ""

# Verificar si Node.js está instalado
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js ya instalado: $NODE_VERSION${NC}"
else
    echo -e "${YELLOW}📥 Instalando Node.js 18.x...${NC}"
    
    if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo -e "${RED}❌ Sistema operativo no soportado: $OS${NC}"
        echo "   Por favor, instala Node.js manualmente desde https://nodejs.org/"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js instalado: $(node --version)${NC}"
fi

# Verificar versión de Node.js
NODE_MAJOR_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Node.js versión 16 o superior requerida${NC}"
    exit 1
fi

# Instalar dependencias del sistema para Playwright
echo -e "${YELLOW}📥 Instalando dependencias del sistema...${NC}"
if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
    sudo apt update
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
        libxshmfence1 \
        git \
        build-essential
elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
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
        libXShmFence \
        git \
        gcc-c++ \
        make
fi

# Instalar dependencias de npm
echo -e "${YELLOW}📦 Instalando dependencias de npm...${NC}"
npm install

# Instalar navegadores de Playwright
echo -e "${YELLOW}🌐 Instalando navegadores de Playwright...${NC}"
echo "   (Esto puede tardar varios minutos...)"
npx playwright install chromium
npx playwright install-deps chromium

# Crear directorios necesarios
echo -e "${YELLOW}📁 Creando directorios...${NC}"
mkdir -p src/outputs
mkdir -p src/storage
mkdir -p src/logs
mkdir -p assets/ebook

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creando archivo .env...${NC}"
    cat > .env << 'EOF'
OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php
PORT=3000
NODE_ENV=production
EOF
    echo -e "${GREEN}✅ Archivo .env creado${NC}"
else
    echo -e "${GREEN}✅ Archivo .env ya existe${NC}"
fi

# Verificar archivo de configuración
if [ ! -f "src/config/pjud_config.json" ]; then
    echo -e "${YELLOW}📝 Creando archivo de configuración básico...${NC}"
    mkdir -p src/config
    cat > src/config/pjud_config.json << 'EOF'
{
  "rit": "16707-2019",
  "competencia": "3",
  "corte": "90",
  "tribunal": "276",
  "tipoCausa": "C"
}
EOF
    echo -e "${GREEN}✅ Archivo de configuración creado${NC}"
fi

# Instalar PM2 globalmente (opcional)
read -p "¿Deseas instalar PM2 para gestión de procesos? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[SsYy]$ ]]; then
    echo -e "${YELLOW}📦 Instalando PM2...${NC}"
    sudo npm install -g pm2
    echo -e "${GREEN}✅ PM2 instalado${NC}"
    echo ""
    echo -e "${YELLOW}💡 Para iniciar el servidor con PM2:${NC}"
    echo "   pm2 start npm --name \"pjud-api\" -- run api:start"
    echo "   pm2 save"
    echo "   pm2 startup"
fi

echo ""
echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}✅ Instalación completada exitosamente${NC}"
echo -e "${GREEN}==============================================${NC}"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Verificar instalación:"
echo "   node --version"
echo "   npm --version"
echo ""
echo "2. Probar el servidor:"
echo "   npm run api:start"
echo ""
echo "3. Acceder al dashboard:"
echo "   http://localhost:3000/mvp"
echo ""
echo "4. (Opcional) Iniciar con PM2:"
echo "   pm2 start npm --name \"pjud-api\" -- run api:start"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo -e "${YELLOW}📚 Para más información, consulta INSTALACION_HOSTING.md${NC}"

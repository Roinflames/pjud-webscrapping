#!/bin/bash

# ============================================
# Script de Configuración Completa del Servidor Cloud
# ============================================
# Este script automatiza la configuración del servidor
# Ejecuta este script DESPUÉS de conectarte por SSH por primera vez
# ============================================

set -e  # Salir si hay algún error

echo "============================================"
echo "🚀 Configuración del Servidor Cloud - PJUD Scraping"
echo "============================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    error "Por favor ejecuta este script como root (sudo ./configurar-servidor-cloud.sh)"
    exit 1
fi

# ============================================
# PASO 1: Actualizar Sistema
# ============================================
info "PASO 1: Actualizando sistema..."
yum update -y
yum install -y wget curl git vim nano

# ============================================
# PASO 2: Configurar Firewall
# ============================================
info "PASO 2: Configurando firewall..."
systemctl start firewalld 2>/dev/null || true
systemctl enable firewalld 2>/dev/null || true

firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload

info "Puertos abiertos: $(firewall-cmd --list-ports)"

# ============================================
# PASO 3: Configurar Zona Horaria
# ============================================
info "PASO 3: Configurando zona horaria (America/Santiago)..."
timedatectl set-timezone America/Santiago || true
info "Zona horaria: $(timedatectl | grep 'Time zone')"

# ============================================
# PASO 4: Instalar Node.js 18
# ============================================
info "PASO 4: Instalando Node.js 18..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    info "Node.js ya instalado: $NODE_VERSION"
    
    # Verificar si es versión 18
    if [[ "$NODE_VERSION" =~ ^v18\. ]]; then
        info "Node.js 18 ya está instalado"
    else
        warn "Node.js instalado pero no es versión 18. Instalando Node.js 18..."
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
    fi
else
    info "Instalando Node.js 18..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
info "Node.js instalado: $NODE_VERSION"
info "NPM instalado: $NPM_VERSION"

# ============================================
# PASO 5: Instalar PM2
# ============================================
info "PASO 5: Instalando PM2..."

if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    info "PM2 ya instalado: v$PM2_VERSION"
else
    npm install -g pm2
    info "PM2 instalado: v$(pm2 --version)"
fi

# ============================================
# PASO 6: Instalar MariaDB
# ============================================
info "PASO 6: Instalando MariaDB..."

if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version)
    info "MariaDB/MySQL ya instalado: $MYSQL_VERSION"
else
    yum install -y mariadb-server mariadb
    systemctl start mariadb
    systemctl enable mariadb
    info "MariaDB instalado y iniciado"
fi

# Verificar que MariaDB esté corriendo
if systemctl is-active --quiet mariadb; then
    info "MariaDB está corriendo"
else
    warn "MariaDB no está corriendo. Iniciando..."
    systemctl start mariadb
fi

# ============================================
# PASO 7: Instalar Playwright (requiere proyecto)
# ============================================
info "PASO 7: Verificando instalación de Playwright..."

if [ -d "/opt/pjud-webscrapping" ]; then
    cd /opt/pjud-webscrapping
    
    if [ -d "node_modules/playwright" ]; then
        info "Playwright ya está instalado"
    else
        warn "Playwright no encontrado. Se instalará cuando ejecutes 'npm install'"
    fi
else
    warn "Directorio /opt/pjud-webscrapping no existe. Crea el directorio y sube el código primero."
fi

# ============================================
# PASO 8: Configurar PM2 para iniciar al arrancar
# ============================================
info "PASO 8: Configurando PM2 para iniciar al arrancar..."

# Intentar configurar startup (puede fallar si ya está configurado)
pm2 startup systemd -u root --hp /root 2>&1 | grep -v "PM2" | grep -v "This" | grep -v "command" | grep -v "Copy" | grep -v "sudo" | grep -v "^$" || true

info "Si ves un comando 'sudo env PATH=...', ejecútalo manualmente"

# ============================================
# PASO 9: Resumen
# ============================================
echo ""
echo "============================================"
info "✅ Configuración básica completada"
echo "============================================"
echo ""
echo "📋 PRÓXIMOS PASOS MANUALES:"
echo ""
echo "1. Configura seguridad de MariaDB:"
echo "   mysql_secure_installation"
echo ""
echo "2. Crea la base de datos y usuario:"
echo "   mysql -u root -p"
echo "   CREATE DATABASE codi_ejamtest;"
echo "   CREATE USER 'pjud_user'@'localhost' IDENTIFIED BY 'tu_password';"
echo "   GRANT ALL PRIVILEGES ON codi_ejamtest.* TO 'pjud_user'@'localhost';"
echo "   FLUSH PRIVILEGES;"
echo ""
echo "3. Sube el código del proyecto a /opt/pjud-webscrapping"
echo ""
echo "4. Instala dependencias:"
echo "   cd /opt/pjud-webscrapping"
echo "   npm install"
echo "   npx playwright install chromium"
echo ""
echo "5. Configura el archivo .env con tus credenciales"
echo ""
echo "6. Crea las tablas necesarias:"
echo "   node src/utils/crear-tabla-cola.js"
echo "   mysql -u pjud_user -p codi_ejamtest < docs/sql/tabla_eventos_scraping.sql"
echo ""
echo "7. Inicia los servicios:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo ""
echo "============================================"
echo ""
echo "📚 Documentación completa: docs/GUIA_CONFIGURACION_CLOUD.md"
echo ""
info "¡Listo! Revisa los próximos pasos arriba."

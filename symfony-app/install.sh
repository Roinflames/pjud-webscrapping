#!/bin/bash
# Script de instalación automática para CentOS 7.9 + PHP 7.4.33 + Apache 2.4.6
# Ejecutar como: sudo bash install.sh

set -e

echo "=============================================="
echo "Instalación Symfony 5.0.11 - Sistema PJUD"
echo "CentOS 7.9 | PHP 7.4.33 | MariaDB 5.5.68"
echo "=============================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}ERROR: Este script debe ejecutarse como root (sudo)${NC}"
  exit 1
fi

# Directorio de instalación
INSTALL_DIR="/var/www/html/pjud-demo"
CURRENT_DIR=$(pwd)

echo -e "${GREEN}1. Verificando requisitos del sistema...${NC}"

# Verificar PHP 7.4
PHP_VERSION=$(php -v | head -n 1 | cut -d " " -f 2 | cut -d "." -f 1,2)
if [ "$PHP_VERSION" != "7.4" ]; then
    echo -e "${RED}ERROR: Se requiere PHP 7.4, encontrado: $PHP_VERSION${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ PHP 7.4 instalado${NC}"

# Verificar Composer
if ! command -v composer &> /dev/null; then
    echo -e "${RED}ERROR: Composer no está instalado${NC}"
    echo "Instalar con: curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer"
    exit 1
fi
echo -e "${GREEN}   ✓ Composer instalado${NC}"

# Verificar Apache
if ! command -v httpd &> /dev/null; then
    echo -e "${RED}ERROR: Apache no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ Apache instalado${NC}"

# Verificar MariaDB
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}ERROR: MariaDB/MySQL no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ MariaDB instalado${NC}"

echo ""
echo -e "${GREEN}2. Copiando archivos a $INSTALL_DIR...${NC}"

# Crear directorio si no existe
mkdir -p "$INSTALL_DIR"

# Copiar archivos
cp -r "$CURRENT_DIR"/* "$INSTALL_DIR/"
cp "$CURRENT_DIR"/.env "$INSTALL_DIR/"

echo -e "${GREEN}   ✓ Archivos copiados${NC}"

echo ""
echo -e "${GREEN}3. Configurando permisos...${NC}"

# Cambiar propietario a apache
chown -R apache:apache "$INSTALL_DIR"

# Permisos de directorios
chmod -R 755 "$INSTALL_DIR"

# Crear directorios necesarios
mkdir -p "$INSTALL_DIR/var/cache"
mkdir -p "$INSTALL_DIR/var/log"

# Permisos especiales para var/
chmod -R 775 "$INSTALL_DIR/var"
chown -R apache:apache "$INSTALL_DIR/var"

echo -e "${GREEN}   ✓ Permisos configurados${NC}"

echo ""
echo -e "${GREEN}4. Instalando dependencias Composer (esto puede tardar 2-3 minutos)...${NC}"

cd "$INSTALL_DIR"

# Instalar dependencias
su -s /bin/bash apache -c "composer install --no-dev --optimize-autoloader --no-interaction"

echo -e "${GREEN}   ✓ Dependencias instaladas${NC}"

echo ""
echo -e "${GREEN}5. Configurando Apache VirtualHost...${NC}"

# Crear archivo de configuración
cat > /etc/httpd/conf.d/pjud-demo.conf <<'EOF'
<VirtualHost *:80>
    ServerName pjud-demo.local

    DocumentRoot /var/www/html/pjud-demo/public
    DirectoryIndex index.php

    <Directory /var/www/html/pjud-demo/public>
        AllowOverride All
        Require all granted
        Options -MultiViews
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>

    ErrorLog /var/log/httpd/pjud-demo-error.log
    CustomLog /var/log/httpd/pjud-demo-access.log combined

    php_value upload_max_filesize 50M
    php_value post_max_size 50M
    php_value memory_limit 256M
</VirtualHost>
EOF

echo -e "${GREEN}   ✓ VirtualHost creado en /etc/httpd/conf.d/pjud-demo.conf${NC}"

echo ""
echo -e "${GREEN}6. Verificando mod_rewrite...${NC}"

# Verificar si mod_rewrite está habilitado
if httpd -M 2>/dev/null | grep -q "rewrite_module"; then
    echo -e "${GREEN}   ✓ mod_rewrite habilitado${NC}"
else
    echo -e "${YELLOW}   ⚠ mod_rewrite NO habilitado${NC}"
    echo -e "${YELLOW}   Habilitar en /etc/httpd/conf/httpd.conf${NC}"
fi

echo ""
echo -e "${GREEN}7. Reiniciando Apache...${NC}"

systemctl restart httpd

if systemctl is-active --quiet httpd; then
    echo -e "${GREEN}   ✓ Apache reiniciado correctamente${NC}"
else
    echo -e "${RED}   ✗ ERROR al reiniciar Apache${NC}"
    echo -e "${YELLOW}   Ver logs: tail -50 /var/log/httpd/error_log${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}8. Limpiando caché de Symfony...${NC}"

cd "$INSTALL_DIR"
php bin/console cache:clear --env=prod --no-warmup 2>/dev/null || true
php bin/console cache:warmup --env=prod 2>/dev/null || true

# Permisos finales
chown -R apache:apache "$INSTALL_DIR/var"
chmod -R 775 "$INSTALL_DIR/var"

echo -e "${GREEN}   ✓ Caché limpiada${NC}"

echo ""
echo "=============================================="
echo -e "${GREEN}✓ INSTALACIÓN COMPLETADA${NC}"
echo "=============================================="
echo ""
echo -e "${YELLOW}PRÓXIMOS PASOS:${NC}"
echo ""
echo "1. Configurar .env con tus credenciales de base de datos:"
echo "   vi $INSTALL_DIR/.env"
echo ""
echo "2. Generar APP_SECRET aleatorio:"
echo "   php -r \"echo bin2hex(random_bytes(16));\" "
echo ""
echo "3. Verificar conexión a base de datos:"
echo "   mysql -u root -p -P 3307 -h 127.0.0.1 codi_ejamtest"
echo ""
echo "4. Acceder a la aplicación:"
echo "   http://$(hostname -I | awk '{print $1}')/"
echo "   http://$(hostname -I | awk '{print $1}')/demo"
echo ""
echo "5. Ver logs en caso de errores:"
echo "   tail -f /var/log/httpd/pjud-demo-error.log"
echo "   tail -f $INSTALL_DIR/var/log/prod.log"
echo ""
echo -e "${GREEN}¡Instalación exitosa!${NC}"

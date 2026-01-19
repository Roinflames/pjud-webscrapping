#!/bin/bash

# Script de Control de Servicios - Sistema PJUD
# Permite habilitar/deshabilitar fácilmente la ejecución continua
#
# Uso:
#   bash scripts/control-servicios.sh start    - Iniciar servicios
#   bash scripts/control-servicios.sh stop     - Detener servicios
#   bash scripts/control-servicios.sh restart   - Reiniciar servicios
#   bash scripts/control-servicios.sh status   - Ver estado
#   bash scripts/control-servicios.sh enable   - Habilitar inicio automático
#   bash scripts/control-servicios.sh disable  - Deshabilitar inicio automático

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 no está instalado${NC}"
    echo "Instala con: npm install -g pm2"
    exit 1
fi

# Función para mostrar ayuda
show_help() {
    echo "=========================================="
    echo "🔧 Control de Servicios - Sistema PJUD"
    echo "=========================================="
    echo ""
    echo "Uso: bash scripts/control-servicios.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  start     - Iniciar todos los servicios"
    echo "  stop      - Detener todos los servicios"
    echo "  restart   - Reiniciar todos los servicios"
    echo "  status    - Ver estado de los servicios"
    echo "  enable    - Habilitar inicio automático (24/7)"
    echo "  disable   - Deshabilitar inicio automático"
    echo "  logs      - Ver logs de todos los servicios"
    echo "  logs:api  - Ver logs solo de API"
    echo "  logs:listener - Ver logs solo de Listener"
    echo "  logs:worker - Ver logs solo de Worker"
    echo ""
}

# Función para iniciar servicios
start_services() {
    echo -e "${BLUE}🚀 Iniciando servicios...${NC}"
    
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
        echo -e "${GREEN}✅ Servicios iniciados${NC}"
    else
        echo -e "${RED}❌ No se encontró ecosystem.config.js${NC}"
        exit 1
    fi
    
    pm2 save
    echo -e "${GREEN}✅ Configuración guardada${NC}"
    
    show_status
}

# Función para detener servicios
stop_services() {
    echo -e "${YELLOW}🛑 Deteniendo servicios...${NC}"
    
    pm2 stop ecosystem.config.js
    echo -e "${GREEN}✅ Servicios detenidos${NC}"
    
    show_status
}

# Función para reiniciar servicios
restart_services() {
    echo -e "${BLUE}🔄 Reiniciando servicios...${NC}"
    
    pm2 restart ecosystem.config.js
    echo -e "${GREEN}✅ Servicios reiniciados${NC}"
    
    show_status
}

# Función para mostrar estado
show_status() {
    echo ""
    echo "=========================================="
    echo "📊 Estado de Servicios"
    echo "=========================================="
    pm2 list
    echo ""
    
    # Verificar si el inicio automático está habilitado
    if systemctl is-enabled pm2-$(whoami) &> /dev/null; then
        echo -e "${GREEN}✅ Inicio automático: HABILITADO (24/7)${NC}"
    else
        echo -e "${YELLOW}⚠️  Inicio automático: DESHABILITADO${NC}"
    fi
    echo ""
}

# Función para habilitar inicio automático
enable_autostart() {
    echo -e "${BLUE}🔧 Habilitando inicio automático...${NC}"
    
    # Configurar PM2 para inicio automático
    pm2 startup systemd
    
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "Copia y ejecuta el comando que aparece arriba como root/sudo"
    echo "Ejemplo:"
    echo "  sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u \$USER --hp \$HOME"
    echo ""
    
    pm2 save
    echo -e "${GREEN}✅ Configuración guardada${NC}"
    echo -e "${GREEN}✅ Inicio automático habilitado${NC}"
    echo ""
    echo "Los servicios se iniciarán automáticamente al reiniciar el servidor"
}

# Función para deshabilitar inicio automático
disable_autostart() {
    echo -e "${YELLOW}🔧 Deshabilitando inicio automático...${NC}"
    
    # Deshabilitar servicio systemd
    if systemctl is-enabled pm2-$(whoami) &> /dev/null; then
        sudo systemctl disable pm2-$(whoami)
        echo -e "${GREEN}✅ Servicio systemd deshabilitado${NC}"
    fi
    
    # Eliminar configuración de PM2
    pm2 unstartup systemd
    echo -e "${GREEN}✅ Configuración de PM2 eliminada${NC}"
    
    echo ""
    echo -e "${YELLOW}⚠️  Los servicios NO se iniciarán automáticamente al reiniciar${NC}"
    echo "Para iniciarlos manualmente: bash scripts/control-servicios.sh start"
}

# Función para ver logs
show_logs() {
    local service=$1
    
    case $service in
        api)
            echo -e "${BLUE}📋 Logs de API:${NC}"
            pm2 logs api-pjud --lines 50
            ;;
        listener)
            echo -e "${BLUE}📋 Logs de Listener:${NC}"
            pm2 logs listener-pjud --lines 50
            ;;
        worker)
            echo -e "${BLUE}📋 Logs de Worker:${NC}"
            pm2 logs worker-pjud --lines 50
            ;;
        *)
            echo -e "${BLUE}📋 Logs de todos los servicios:${NC}"
            pm2 logs --lines 50
            ;;
    esac
}

# Procesar comando
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    enable)
        enable_autostart
        ;;
    disable)
        disable_autostart
        ;;
    logs)
        show_logs
        ;;
    logs:api)
        show_logs api
        ;;
    logs:listener)
        show_logs listener
        ;;
    logs:worker)
        show_logs worker
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Comando no reconocido: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

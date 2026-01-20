# Script de Control de Servicios para Windows - Sistema PJUD
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\control-servicios.ps1 start
#   powershell -ExecutionPolicy Bypass -File scripts\control-servicios.ps1 stop
#   powershell -ExecutionPolicy Bypass -File scripts\control-servicios.ps1 restart
#   powershell -ExecutionPolicy Bypass -File scripts\control-servicios.ps1 status
#

param (
    [string]$command
)

# Colores
$GREEN = "$([char]27)[32m"
$YELLOW = "$([char]27)[33m"
$RED = "$([char]27)[31m"
$BLUE = "$([char]27)[34m"
$NC = "$([char]27)[0m"

# Verificar que PM2 está instalado
$pm2_exists = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2_exists) {
    Write-Host "${RED}[ERROR] PM2 no está instalado${NC}"
    Write-Host "Instala con: npm install -g pm2"
    exit 1
}

# Función para mostrar ayuda
function Show-Help {
    Write-Host "=========================================="
    Write-Host "[INFO] Control de Servicios - Sistema PJUD (Windows)"
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "Uso: powershell -ExecutionPolicy Bypass -File scripts\control-servicios.ps1 [comando]"
    Write-Host ""
    Write-Host "Comandos disponibles:"
    Write-Host "  start     - Iniciar todos los servicios"
    Write-Host "  stop      - Detener todos los servicios"
    Write-Host "  restart   - Reiniciar todos los servicios"
    Write-Host "  status    - Ver estado de los servicios"
    Write-Host "  logs      - Ver logs de todos los servicios"
    Write-Host ""
}

# Función para iniciar servicios
function Start-Services {
    Write-Host "${BLUE}[INFO] Iniciando servicios...${NC}"
    
    if (Test-Path "ecosystem.config.js") {
        pm2 start ecosystem.config.js
        Write-Host "${GREEN}[OK] Servicios iniciados${NC}"
    } else {
        Write-Host "${RED}[ERROR] No se encontró ecosystem.config.js${NC}"
        exit 1
    }
    
    pm2 save
    Write-Host "${GREEN}[OK] Configuración guardada${NC}"
    
    Show-Status
}

# Función para detener servicios
function Stop-Services {
    Write-Host "${YELLOW}[STOP] Deteniendo servicios...${NC}"
    
    pm2 stop ecosystem.config.js
    Write-Host "${GREEN}[OK] Servicios detenidos${NC}"
    
    Show-Status
}

# Función para reiniciar servicios
function Restart-Services {
    Write-Host "${BLUE}[RESTART] Reiniciando servicios...${NC}"
    
    pm2 restart ecosystem.config.js
    Write-Host "${GREEN}[OK] Servicios reiniciados${NC}"
    
    Show-Status
}

# Función para mostrar estado
function Show-Status {
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "[STATUS] Estado de Servicios"
    Write-Host "=========================================="
    pm2 list
    Write-Host ""
}

# Función para ver logs
function Show-Logs {
    param (
        [string]$service
    )
    
    switch ($service) {
        "api" {
            Write-Host "${BLUE}📋 Logs de API:${NC}"
            pm2 logs api-pjud --lines 50
        }
        "listener" {
            Write-Host "${BLUE}📋 Logs de Listener:${NC}"
            pm2 logs listener-pjud --lines 50
        }
        "worker" {
            Write-Host "${BLUE}📋 Logs de Worker:${NC}"
            pm2 logs worker-pjud --lines 50
        }
        "listener-erp" {
            Write-Host "${BLUE}📋 Logs de Listener ERP:${NC}"
            pm2 logs listener-erp --lines 50
        }
        "worker-eventos" {
            Write-Host "${BLUE}📋 Logs de Worker Eventos:${NC}"
            pm2 logs worker-eventos --lines 50
        }
        default {
            Write-Host "${BLUE}📋 Logs de todos los servicios:${NC}"
            pm2 logs --lines 50
        }
    }
}

# Procesar comando
switch ($command) {
    "start" {
        Start-Services
    }
    "stop" {
        Stop-Services
    }
    "restart" {
        Restart-Services
    }
    "status" {
        Show-Status
    }
    "logs" {
        Show-Logs
    }
    "logs:api" {
        Show-Logs -service "api"
    }
    "logs:listener" {
        Show-Logs -service "listener"
    }
    "logs:worker" {
        Show-Logs -service "worker"
    }
    "logs:listener-erp" {
        Show-Logs -service "listener-erp"
    }
    "logs:worker-eventos" {
        Show-Logs -service "worker-eventos"
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "${RED}[ERROR] Comando no reconocido: $command${NC}"
        Write-Host ""
        Show-Help
        exit 1
    }
}
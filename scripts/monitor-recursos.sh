#!/bin/bash

# Script de Monitoreo de Recursos en Tiempo Real
# Sistema PJUD
#
# Uso: bash scripts/monitor-recursos.sh

echo "=========================================="
echo "📊 Monitoreo de Recursos - Sistema PJUD"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Función para obtener uso de CPU
get_cpu_usage() {
    top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}'
}

# Función para obtener uso de memoria
get_memory_usage() {
    free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}'
}

# Función para obtener uso de disco
get_disk_usage() {
    df -h / | awk 'NR==2 {print $5}' | sed 's/%//'
}

# Función para obtener procesos Node.js
get_node_processes() {
    ps aux | grep -E "node|pm2" | grep -v grep | wc -l
}

# Función para obtener memoria usada por Node.js
get_node_memory() {
    ps aux | grep -E "node.*pjud" | grep -v grep | awk '{sum+=$6} END {printf "%.2f", sum/1024/1024}'
}

# Monitoreo continuo
while true; do
    clear
    echo "=========================================="
    echo "📊 Monitoreo de Recursos - Sistema PJUD"
    echo "=========================================="
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # CPU
    CPU=$(get_cpu_usage)
    CPU_COLOR=$GREEN
    if (( $(echo "$CPU > 80" | bc -l) )); then
        CPU_COLOR=$RED
    elif (( $(echo "$CPU > 50" | bc -l) )); then
        CPU_COLOR=$YELLOW
    fi
    echo -e "💻 CPU: ${CPU_COLOR}${CPU}%${NC}"
    
    # Memoria
    MEM=$(get_memory_usage)
    MEM_COLOR=$GREEN
    if (( $(echo "$MEM > 80" | bc -l) )); then
        MEM_COLOR=$RED
    elif (( $(echo "$MEM > 50" | bc -l) )); then
        MEM_COLOR=$YELLOW
    fi
    echo -e "💾 Memoria: ${MEM_COLOR}${MEM}%${NC}"
    
    # Disco
    DISK=$(get_disk_usage)
    DISK_COLOR=$GREEN
    if [ "$DISK" -gt 80 ]; then
        DISK_COLOR=$RED
    elif [ "$DISK" -gt 50 ]; then
        DISK_COLOR=$YELLOW
    fi
    echo -e "💿 Disco: ${DISK_COLOR}${DISK}%${NC}"
    
    echo ""
    echo "📦 Procesos Node.js: $(get_node_processes)"
    echo "💾 Memoria Node.js: $(get_node_memory) MB"
    echo ""
    
    # PM2 status si está disponible
    if command -v pm2 &> /dev/null; then
        echo "🔄 Estado PM2:"
        pm2 list | tail -n +3
    fi
    
    echo ""
    echo "Presiona Ctrl+C para salir"
    sleep 5
done

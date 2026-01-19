#!/bin/bash
# Script para gestionar el servidor API

PORT=3000
PID_FILE="/tmp/pjud-api-server.pid"

function start_server() {
    if lsof -ti:$PORT > /dev/null 2>&1; then
        echo "⚠️  El servidor ya está corriendo en puerto $PORT"
        echo "   PID: $(lsof -ti:$PORT)"
        return 1
    fi
    
    echo "🚀 Iniciando servidor API en puerto $PORT..."
    cd "$(dirname "$0")/../.."
    nohup npm run api:start > /tmp/pjud-api-server.log 2>&1 &
    echo $! > $PID_FILE
    sleep 2
    
    if curl -s http://localhost:$PORT/api/health > /dev/null 2>&1; then
        echo "✅ Servidor iniciado correctamente"
        echo "   URL: http://localhost:$PORT"
        echo "   Logs: tail -f /tmp/pjud-api-server.log"
        return 0
    else
        echo "❌ Error al iniciar el servidor"
        return 1
    fi
}

function stop_server() {
    if ! lsof -ti:$PORT > /dev/null 2>&1; then
        echo "ℹ️  No hay servidor corriendo en puerto $PORT"
        return 1
    fi
    
    PID=$(lsof -ti:$PORT)
    echo "🛑 Deteniendo servidor (PID: $PID)..."
    kill -9 $PID 2>/dev/null
    rm -f $PID_FILE
    sleep 1
    
    if ! lsof -ti:$PORT > /dev/null 2>&1; then
        echo "✅ Servidor detenido"
        return 0
    else
        echo "❌ Error al detener el servidor"
        return 1
    fi
}

function status_server() {
    if lsof -ti:$PORT > /dev/null 2>&1; then
        PID=$(lsof -ti:$PORT)
        echo "✅ Servidor corriendo"
        echo "   Puerto: $PORT"
        echo "   PID: $PID"
        
        if curl -s http://localhost:$PORT/api/health > /dev/null 2>&1; then
            echo "   Estado: Activo y respondiendo"
            echo ""
            echo "📋 Endpoints disponibles:"
            echo "   http://localhost:$PORT/api/health"
            echo "   http://localhost:$PORT/api/scraping/ejecutar"
            echo "   http://localhost:$PORT"
        else
            echo "   Estado: Corriendo pero no responde"
        fi
        return 0
    else
        echo "❌ Servidor no está corriendo"
        return 1
    fi
}

function restart_server() {
    stop_server
    sleep 1
    start_server
}

function show_logs() {
    if [ -f /tmp/pjud-api-server.log ]; then
        tail -f /tmp/pjud-api-server.log
    else
        echo "⚠️  No hay archivo de log"
    fi
}

case "$1" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server
        ;;
    status)
        status_server
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Comandos:"
        echo "  start    - Iniciar servidor"
        echo "  stop     - Detener servidor"
        echo "  restart  - Reiniciar servidor"
        echo "  status   - Ver estado del servidor"
        echo "  logs     - Ver logs en tiempo real"
        exit 1
        ;;
esac
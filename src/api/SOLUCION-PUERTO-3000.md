# 🔧 Solución: Puerto 3000 en Uso

## 🚨 Error

```
Error: listen EADDRINUSE: address already in use :::3000
```

Este error significa que **ya hay un proceso usando el puerto 3000**.

---

## ✅ Soluciones Rápidas

### Opción 1: Usar el Script de Gestión (Recomendado)

```bash
# Ver estado
./src/api/gestionar-servidor.sh status

# Detener servidor si está corriendo
./src/api/gestionar-servidor.sh stop

# Iniciar servidor
./src/api/gestionar-servidor.sh start

# Reiniciar servidor
./src/api/gestionar-servidor.sh restart

# Ver logs
./src/api/gestionar-servidor.sh logs
```

### Opción 2: Manual

```bash
# 1. Encontrar y detener el proceso
lsof -ti:3000 | xargs kill -9

# 2. Verificar que esté libre
lsof -ti:3000 || echo "Puerto libre"

# 3. Iniciar servidor
npm run api:start
```

### Opción 3: Cambiar Puerto

Si necesitas usar otro puerto, edita `.env`:

```env
API_PORT=3001
```

Y luego:
```bash
npm run api:start
```

---

## 🔍 Verificar Estado

```bash
# Ver si hay proceso en puerto 3000
lsof -ti:3000 && echo "Puerto ocupado" || echo "Puerto libre"

# Ver detalles del proceso
lsof -i:3000

# Verificar que el servidor responda
curl http://localhost:3000/api/health
```

---

## 💡 Prevención

Usa el script de gestión para evitar este problema:

```bash
# Siempre verificar antes de iniciar
./src/api/gestionar-servidor.sh status

# Si está corriendo, usar restart en lugar de start
./src/api/gestionar-servidor.sh restart
```

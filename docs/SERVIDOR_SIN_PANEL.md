# 🖥️ Servidor Sin Panel de Control (cPanel/Ferozo) - Guía Rápida

## ✅ Esto es NORMAL y es la Opción MÁS ECONÓMICA

Tu servidor Cloud viene **SIN panel gráfico** como:
- ❌ cPanel
- ❌ Ferozo
- ❌ Plesk
- ❌ Remote Desktop Services

**Esto es PERFECTO** porque:
- ✅ **Más económico** (no pagas licencias)
- ✅ **Más rápido** (menos recursos usados)
- ✅ **Más seguro** (menos superficie de ataque)
- ✅ **Más profesional** (así funcionan los servidores reales)

---

## 🎯 ¿Cómo Funciona Entonces?

**Todo se hace por SSH (línea de comandos).**

Es como usar la Terminal de tu Mac o el CMD de Windows, pero conectado a tu servidor remoto.

### Ejemplo Visual:

```
Tu Computadora                    Servidor Cloud
┌─────────────┐                  ┌─────────────┐
│             │                  │             │
│  Terminal   │  ────SSH──────>  │  CentOS 7   │
│  (PuTTY)    │                  │             │
│             │                  │             │
└─────────────┘                  └─────────────┘
```

**Escribes comandos** → **Se ejecutan en el servidor** → **Ves los resultados**

---

## 📋 Lo que SÍ Tienes

### 1. Panel del Hosting (Diferente al Panel del Servidor)

Este es el panel **del sitio donde compraste** (ej: Hosting.cl, Niclabs):

**Funciones:**
- ✅ Ver estado del servidor (Activo/Inactivo)
- ✅ Ver IP del servidor
- ✅ Reiniciar/Apagar servidor
- ✅ Ver credenciales SSH
- ✅ Cambiar contraseña SSH
- ✅ Ver uso de recursos (CPU, RAM, Disco)

**NO tiene:**
- ❌ cPanel (no lo necesitas)
- ❌ Ferozo (no lo necesitas)
- ❌ Acceso gráfico al servidor (no lo necesitas)

### 2. Acceso SSH

**Esto es lo que SÍ necesitas y SÍ tienes:**

- ✅ IP del servidor
- ✅ Usuario: `root`
- ✅ Contraseña SSH
- ✅ Puerto: `22`

**Con esto puedes:**
- Instalar software
- Configurar el servidor
- Subir archivos
- Ejecutar comandos
- Ver logs
- Todo lo que necesitas

---

## 🚀 ¿Qué Necesitas Hacer?

### Paso 1: Conectarte por SSH

**Windows:**
1. Descarga PuTTY: https://www.putty.org/
2. Abre PuTTY
3. IP: `TU_IP_SERVIDOR`, Puerto: `22`
4. Click "Open"
5. Usuario: `root`, Contraseña: `TU_CONTRASEÑA`

**Mac/Linux:**
```bash
ssh root@TU_IP_SERVIDOR
```

👉 **Guía completa:** `docs/GUIA_PRIMERA_VEZ_SSH.md`

### Paso 2: Configurar el Servidor

Una vez conectado por SSH, ejecuta:

```bash
# Opción A: Script automático
./configurar-servidor-cloud.sh

# Opción B: Guía manual
# Sigue: docs/GUIA_CONFIGURACION_CLOUD.md
```

---

## 🎓 Conceptos Básicos

### ¿Qué es SSH?

**SSH** (Secure Shell) es una forma segura de conectarte a un servidor remoto y ejecutar comandos.

**Es como:**
- Abrir la Terminal en tu Mac
- Abrir CMD en Windows
- Pero conectado a tu servidor en la nube

### ¿Qué es Root?

**Root** es el usuario "administrador" del servidor. Tiene todos los permisos.

**Es como:**
- Ser "admin" en Windows
- Ser "sudo" en Mac
- Pero en el servidor

### ¿Qué son los Comandos?

Los comandos son instrucciones que le das al servidor:

```bash
ls          # Listar archivos
cd /ruta    # Cambiar de directorio
mkdir carpeta  # Crear carpeta
nano archivo.txt  # Editar archivo
```

**No es difícil**, solo necesitas saber los comandos básicos (y esta guía te los enseña).

---

## ✅ Ventajas de NO Tener Panel Gráfico

### 1. Más Económico

- No pagas licencias de cPanel ($15-20 USD/mes)
- No pagas Ferozo ($2 USD/mes)
- Solo pagas el servidor

### 2. Más Rápido

- Menos recursos usados (más RAM y CPU para tu aplicación)
- Menos procesos corriendo
- Mejor rendimiento

### 3. Más Seguro

- Menos software = menos vulnerabilidades
- Menos puertos abiertos
- Más control sobre qué corre

### 4. Más Profesional

- Así funcionan los servidores reales en producción
- Aprendes a usar la línea de comandos (habilidad valiosa)
- Más control sobre el servidor

---

## 🆚 Comparación: Con Panel vs Sin Panel

| Característica | Con cPanel | Sin Panel (SSH) |
|---------------|-----------|----------------|
| **Costo** | +$15-20 USD/mes | $0 adicional |
| **Facilidad inicial** | Más fácil | Requiere aprender |
| **Velocidad** | Más lento | Más rápido |
| **Seguridad** | Más superficie de ataque | Más seguro |
| **Control** | Limitado | Total |
| **Profesional** | Menos | Más |

**Para tu caso (scraping con Node.js):** Sin panel es **perfecto** y **más económico**.

---

## 📚 ¿Qué Necesitas Aprender?

### Mínimo Necesario (30 minutos)

1. **Conectarse por SSH** (5 min)
   - Windows: PuTTY
   - Mac/Linux: Terminal

2. **Comandos básicos** (15 min)
   ```bash
   ls          # Ver archivos
   cd          # Cambiar directorio
   pwd         # Ver dónde estoy
   nano        # Editar archivo
   ```

3. **Navegar por el sistema** (10 min)
   - Entender rutas (`/opt`, `/home`, etc.)
   - Crear/copiar/mover archivos

### Recomendado (2-3 horas)

- Instalar software (`yum install`)
- Configurar servicios (`systemctl`)
- Ver logs (`pm2 logs`, `tail -f`)
- Gestionar procesos (`pm2`)

**Todo esto está en las guías que creamos.** 📚

---

## 🎯 Flujo de Trabajo Típico

### 1. Conectarte al Servidor

```bash
ssh root@TU_IP_SERVIDOR
```

### 2. Ejecutar Comandos

```bash
# Ver qué hay
ls -la

# Ir a tu proyecto
cd /opt/pjud-webscrapping

# Ver logs
pm2 logs

# Editar configuración
nano .env
```

### 3. Subir Archivos (desde tu computadora)

```bash
# Desde tu computadora (no desde el servidor)
scp archivo.txt root@TU_IP_SERVIDOR:/opt/pjud-webscrapping/
```

### 4. Desconectarte

```bash
exit
```

---

## 🔧 Herramientas Útiles

### Para Windows

1. **PuTTY** - Conectarse por SSH
   - https://www.putty.org/

2. **WinSCP** - Subir archivos (opcional, más fácil)
   - https://winscp.net/

3. **Windows Terminal** - Terminal moderna (opcional)
   - Microsoft Store

### Para Mac/Linux

1. **Terminal** - Ya viene instalado
2. **scp** - Subir archivos (ya viene instalado)

---

## ✅ Checklist: ¿Estoy Listo?

- [ ] Entiendo que NO tengo cPanel/Ferozo (y está bien)
- [ ] Tengo la IP del servidor
- [ ] Tengo el usuario (root)
- [ ] Tengo la contraseña SSH
- [ ] Sé cómo conectarme por SSH
- [ ] Entiendo que todo se hace por comandos
- [ ] Estoy listo para seguir la guía de configuración

---

## 🚀 Siguiente Paso

Una vez que entiendas esto:

👉 **Conectarte por SSH:** `docs/GUIA_PRIMERA_VEZ_SSH.md`  
👉 **Configurar servidor:** `docs/GUIA_CONFIGURACION_CLOUD.md`

---

## 💡 Tips

1. **No te asustes** - Es más fácil de lo que parece
2. **Copia y pega comandos** - No necesitas memorizarlos
3. **Guarda las guías** - Tienen todos los comandos que necesitas
4. **Pregunta si tienes dudas** - Es normal tener preguntas la primera vez

---

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona:

1. **Revisa las guías** - Tienen solución a problemas comunes
2. **Verifica credenciales** - IP, usuario, contraseña
3. **Contacta al soporte del hosting** - Para problemas de acceso
4. **Pregunta en el proyecto** - Si es un problema de configuración

---

**¡No te preocupes!** Muchos servidores funcionan así y es la forma más profesional y económica. Con las guías que creamos, estarás listo en poco tiempo. 😊

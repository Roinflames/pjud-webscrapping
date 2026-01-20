# 🔐 Guía Completa: Conectarse por SSH por Primera Vez

## 📋 Lo que Necesitas Saber

Cuando compras un servidor Cloud, recibirás:
1. **IP del servidor** (ejemplo: `45.230.185.123`)
2. **Usuario** (generalmente `root`)
3. **Contraseña** (la que configuraste al comprar, o te la envían por email)

---

## 🖥️ Opción 1: Conectarse desde Windows

### Paso 1: Instalar PuTTY (Gratis)

1. **Descargar PuTTY:**
   - Ve a: https://www.putty.org/
   - O descarga directo: https://the.earth.li/~sgtatham/putty/latest/w64/putty.exe

2. **Instalar PuTTY:**
   - Ejecuta el instalador
   - Sigue los pasos (Next, Next, Install)
   - No necesitas cambiar ninguna opción

### Paso 2: Conectarse con PuTTY

1. **Abrir PuTTY:**
   - Busca "PuTTY" en el menú de inicio
   - Ábrelo

2. **Configurar conexión:**
   ```
   Host Name (or IP address): TU_IP_SERVIDOR
   Port: 22
   Connection type: SSH
   ```

   **Ejemplo:**
   ```
   Host Name: 45.230.185.123
   Port: 22
   ```

3. **Guardar configuración (opcional):**
   - En "Saved Sessions" escribe: "Mi Servidor PJUD"
   - Click en "Save"
   - La próxima vez solo haz doble click en "Mi Servidor PJUD"

4. **Conectar:**
   - Click en "Open"
   - La primera vez aparecerá una ventana de seguridad, click en "Yes"

5. **Ingresar credenciales:**
   ```
   login as: root
   root@TU_IP_SERVIDOR's password: [ESCRIBE TU CONTRASEÑA]
   ```
   
   ⚠️ **IMPORTANTE:** Cuando escribas la contraseña, NO verás nada en pantalla (ni asteriscos). Es normal, solo escribe y presiona Enter.

6. **¡Listo!** Deberías ver algo como:
   ```
   [root@servidor ~]#
   ```

---

## 🍎 Opción 2: Conectarse desde Mac

### Paso 1: Abrir Terminal

1. Presiona `Cmd + Espacio`
2. Escribe "Terminal"
3. Presiona Enter

### Paso 2: Conectarse

En la Terminal, escribe:

```bash
ssh root@TU_IP_SERVIDOR
```

**Ejemplo:**
```bash
ssh root@45.230.185.123
```

3. **Primera vez:**
   - Te preguntará si confías en el servidor
   - Escribe: `yes` y presiona Enter

4. **Ingresar contraseña:**
   ```
   root@45.230.185.123's password: [ESCRIBE TU CONTRASEÑA]
   ```
   
   ⚠️ **IMPORTANTE:** No verás la contraseña mientras la escribes. Es normal.

5. **¡Listo!** Deberías ver:
   ```
   [root@servidor ~]#
   ```

---

## 🐧 Opción 3: Conectarse desde Linux

Igual que Mac, usa Terminal:

```bash
ssh root@TU_IP_SERVIDOR
```

---

## 🎯 Opción 4: Usar Windows Terminal (Windows 10/11 - Más Moderno)

### Paso 1: Instalar Windows Terminal

1. Abre Microsoft Store
2. Busca "Windows Terminal"
3. Click en "Instalar"

### Paso 2: Conectarse

1. Abre Windows Terminal
2. Click en la flecha hacia abajo (▼) junto al "+"
3. Selecciona "Command Prompt" o "PowerShell"
4. Escribe:

```bash
ssh root@TU_IP_SERVIDOR
```

**Ejemplo:**
```bash
ssh root@45.230.185.123
```

5. Ingresa la contraseña cuando te la pida

---

## 🔑 ¿Dónde Encontrar las Credenciales?

### Opción A: Email de Confirmación

Cuando compras el servidor, recibirás un email con:
- **IP del servidor**
- **Usuario** (generalmente `root`)
- **Contraseña** (o instrucciones para generarla)

### Opción B: Panel de Control del Hosting

1. Inicia sesión en el panel de tu hosting (ej: Hosting.cl, Niclabs)
2. Ve a "Servidores" o "VPS"
3. Click en tu servidor
4. Busca sección "Acceso" o "SSH"
5. Ahí verás:
   - IP del servidor
   - Usuario
   - Contraseña (o botón para generarla)

### Opción C: Si No Tienes Contraseña

Algunos proveedores te dan una contraseña temporal o te piden generarla:

1. En el panel de control, busca "Reset Password" o "Cambiar Contraseña"
2. Genera una nueva contraseña
3. **¡GUÁRDALA EN UN LUGAR SEGURO!**

---

## ✅ Verificar que Estás Conectado

Una vez conectado, prueba estos comandos:

```bash
# Ver información del sistema
uname -a

# Ver espacio en disco
df -h

# Ver memoria RAM
free -h

# Ver tu ubicación actual
pwd

# Listar archivos
ls -la
```

Si estos comandos funcionan, **¡estás conectado correctamente!**

---

## 🆘 Problemas Comunes

### Error: "Connection refused" o "Connection timed out"

**Causas posibles:**
1. La IP está incorrecta
2. El servidor aún no está listo (espera 5-10 minutos después de comprarlo)
3. El firewall está bloqueando

**Solución:**
- Verifica la IP en el panel de control
- Espera unos minutos y vuelve a intentar
- Contacta al soporte del hosting

### Error: "Permission denied"

**Causas:**
1. Usuario incorrecto (debe ser `root`)
2. Contraseña incorrecta

**Solución:**
- Verifica que el usuario sea `root`
- Verifica la contraseña en el panel de control
- Si olvidaste la contraseña, resetea desde el panel

### Error: "Host key verification failed"

**Solución:**
- En Windows con PuTTY: Click en "Yes" cuando aparezca la advertencia
- En Mac/Linux: Escribe `yes` cuando te pregunte

### No Veo la Contraseña Mientras Escribo

**¡ES NORMAL!** Por seguridad, las contraseñas no se muestran en pantalla. Solo escribe la contraseña y presiona Enter.

---

## 📸 Ejemplo Visual de Conexión

### En PuTTY (Windows):

```
┌─────────────────────────────────────┐
│ PuTTY Configuration                 │
├─────────────────────────────────────┤
│                                     │
│ Host Name (or IP address):          │
│ [45.230.185.123              ]      │
│                                     │
│ Port: [22]                          │
│ Connection type: ○ Raw ○ Telnet     │
│            ● SSH ○ Rlogin           │
│                                     │
│         [Open]  [Cancel]            │
└─────────────────────────────────────┘
```

### En Terminal (Mac/Linux):

```
$ ssh root@45.230.185.123
The authenticity of host '45.230.185.123' can't be established.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added '45.230.185.123' to the list of known hosts.
root@45.230.185.123's password: 
[root@servidor ~]# 
```

---

## 🎓 Comandos Básicos que Necesitarás

Una vez conectado, estos son los comandos más importantes:

```bash
# Ver dónde estás
pwd

# Listar archivos
ls
ls -la          # Lista detallada

# Cambiar de directorio
cd /ruta        # Ir a una ruta
cd ..           # Subir un nivel
cd ~            # Ir a home

# Ver contenido de un archivo
cat archivo.txt
nano archivo.txt    # Editar archivo

# Copiar archivos
cp archivo1.txt archivo2.txt

# Mover/renombrar
mv archivo1.txt archivo2.txt

# Crear directorio
mkdir nombre_directorio

# Eliminar archivo
rm archivo.txt

# Ver procesos
ps aux

# Salir de la conexión
exit
```

---

## 🔒 Seguridad Básica

### 1. Cambiar Contraseña (Recomendado)

Una vez conectado:

```bash
passwd
```

Te pedirá:
- Contraseña actual
- Nueva contraseña (2 veces)

### 2. No Compartir Credenciales

- Nunca compartas tu contraseña
- No la escribas en documentos públicos
- Usa un gestor de contraseñas (LastPass, 1Password, etc.)

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:

1. **Revisa el email de confirmación** del hosting
2. **Revisa el panel de control** del hosting
3. **Contacta al soporte** del hosting (generalmente responden rápido)
4. **Verifica que el servidor esté activo** en el panel

---

## ✅ Checklist Antes de Conectarte

- [ ] Tienes la IP del servidor
- [ ] Tienes el usuario (generalmente `root`)
- [ ] Tienes la contraseña
- [ ] Instalaste PuTTY (Windows) o tienes Terminal (Mac/Linux)
- [ ] El servidor está activo en el panel de control
- [ ] Esperaste 5-10 minutos después de comprarlo (si es nuevo)

---

## 🚀 Siguiente Paso

Una vez que te conectes exitosamente, sigue la guía:
**`docs/GUIA_CONFIGURACION_CLOUD.md`**

O ejecuta el script automático:
```bash
./configurar-servidor-cloud.sh
```

---

**¡No te preocupes!** Conectarse por SSH es más fácil de lo que parece. Si tienes dudas, pregunta al soporte de tu hosting, están para ayudarte. 😊

# 🎯 Primeros Pasos: Después de Comprar el Servidor Cloud

## ⚠️ IMPORTANTE: Servidor Sin Panel de Control

**Tu servidor viene SIN:**
- ❌ cPanel
- ❌ Ferozo
- ❌ Remote Desktop Services
- ❌ Panel gráfico de control

**Esto es NORMAL y es la opción MÁS ECONÓMICA.** ✅

Todo se configura por **SSH** (línea de comandos), que es:
- ✅ Más rápido
- ✅ Más seguro
- ✅ Más económico
- ✅ Más profesional

**No te preocupes**, es más fácil de lo que parece. Esta guía te explica todo paso a paso.

---

## 📋 Lo que Necesitas Hacer INMEDIATAMENTE Después de Comprar

### Paso 1: Revisar el Email de Confirmación (5 minutos)

Cuando compras el servidor, recibirás un email con:

✅ **IP del servidor** (ejemplo: `45.230.185.123`)  
✅ **Usuario** (generalmente `root`)  
✅ **Contraseña** (o instrucciones para generarla)  
✅ **Panel de control** (URL para acceder)

**⚠️ IMPORTANTE:** Guarda este email. Lo necesitarás.

---

### Paso 2: Acceder al Panel de Control del Hosting (5 minutos)

**Nota:** Este es el panel del HOSTING (donde compraste), NO del servidor.

1. Abre el email de confirmación
2. Busca el link al "Panel de Cliente" o "Customer Portal" del hosting
3. Inicia sesión con tus credenciales de la cuenta del hosting
4. Busca tu servidor VPS en la lista

**En el panel del hosting verás:**
- Estado del servidor (Activo/Inactivo)
- IP del servidor
- Botón para "Reiniciar" o "Apagar"
- Sección de "Acceso SSH" o "Credenciales"
- **NO verás cPanel ni Ferozo** (eso es normal, no los necesitas)

---

### Paso 3: Verificar que el Servidor Esté Listo (5 minutos)

**En el panel de control, verifica:**

- ✅ Estado: **"Activo"** o **"Running"**
- ✅ IP asignada correctamente
- ✅ Sistema operativo instalado (CentOS 7.9)

**Si el servidor está "Instalando" o "Configurando":**
- Espera 5-10 minutos
- Refresca la página
- Debería cambiar a "Activo"

---

### Paso 4: Obtener Credenciales SSH (5 minutos)

**IMPORTANTE:** Como NO tienes cPanel ni panel gráfico, TODO se hace por SSH.

**Opción A: Desde el Email**
- El email de confirmación debe incluir:
  - IP del servidor
  - Usuario (generalmente `root`)
  - Contraseña inicial

**Opción B: Desde el Panel del Hosting**
1. En el panel del hosting, busca tu servidor VPS
2. Click en "Ver Detalles" o "Acceso SSH"
3. Busca sección "SSH" o "Credenciales"
4. Ahí verás:
   - IP: `45.230.185.123`
   - Usuario: `root`
   - Contraseña: `********` (click en "Mostrar" o "Revelar")

**Si no tienes contraseña o necesitas cambiarla:**
1. En el panel del hosting, busca "Reset Password" o "Cambiar Contraseña SSH"
2. Genera una nueva contraseña
3. **¡GUÁRDALA EN UN LUGAR SEGURO!**

**Nota:** Algunos hostings te dan la contraseña solo la primera vez. Si la pierdes, resetea desde el panel del hosting.

---

### Paso 5: Conectarse por SSH (15 minutos)

**Sigue la guía completa:** `docs/GUIA_PRIMERA_VEZ_SSH.md`

**Resumen rápido:**

**Windows:**
1. Descarga PuTTY: https://www.putty.org/
2. Abre PuTTY
3. IP: `TU_IP_SERVIDOR`, Puerto: `22`
4. Click "Open"
5. Usuario: `root`, Contraseña: `TU_CONTRASEÑA`

**Mac/Linux:**
1. Abre Terminal
2. Escribe: `ssh root@TU_IP_SERVIDOR`
3. Ingresa la contraseña

---

### Paso 6: Verificar Conexión (2 minutos)

Una vez conectado, prueba:

```bash
# Ver información del sistema
uname -a

# Ver espacio en disco
df -h

# Ver memoria
free -h
```

Si estos comandos funcionan, **¡estás conectado!** ✅

---

## 🎯 Orden de Operaciones Recomendado

### Día 1: Configuración Básica

1. ✅ Comprar servidor
2. ✅ Revisar email de confirmación
3. ✅ Acceder al panel de control
4. ✅ Obtener credenciales SSH
5. ✅ Conectarse por SSH (probar que funciona)
6. ✅ Cambiar contraseña (opcional pero recomendado)

### Día 2: Instalación del Sistema

1. ✅ Ejecutar script de configuración automática
2. ✅ O seguir guía manual paso a paso
3. ✅ Instalar Node.js, MySQL, etc.
4. ✅ Configurar firewall

### Día 3: Subir Código

1. ✅ Subir código del proyecto
2. ✅ Instalar dependencias
3. ✅ Configurar base de datos
4. ✅ Configurar archivo .env

### Día 4: Iniciar Servicios

1. ✅ Iniciar servicios con PM2
2. ✅ Verificar que todo funciona
3. ✅ Probar API y frontend

---

## 📞 ¿Qué Hacer si Algo Sale Mal?

### Problema: "No recibo el email de confirmación"

**Solución:**
1. Revisa spam/correo no deseado
2. Verifica que el email esté correcto en tu cuenta
3. Contacta al soporte del hosting

### Problema: "No puedo acceder al panel de control"

**Solución:**
1. Verifica la URL del panel
2. Prueba desde otro navegador
3. Limpia caché y cookies
4. Contacta al soporte

### Problema: "El servidor está 'Instalando' por mucho tiempo"

**Solución:**
1. Espera 15-20 minutos (puede tardar)
2. Refresca la página
3. Si sigue igual, contacta al soporte

### Problema: "No me funciona SSH"

**Solución:**
1. Verifica que el servidor esté "Activo"
2. Verifica la IP correcta
3. Verifica usuario y contraseña
4. Revisa: `docs/GUIA_PRIMERA_VEZ_SSH.md`
5. Contacta al soporte si nada funciona

---

## 🎓 Conceptos Básicos que Debes Entender

### ¿Qué es SSH?

**SSH** (Secure Shell) es una forma segura de conectarte a un servidor remoto desde tu computadora. Es como "entrar" al servidor para poder ejecutar comandos.

### ¿Qué es el Panel de Control?

Es una página web donde puedes:
- Ver el estado de tu servidor
- Reiniciarlo
- Ver credenciales
- Cambiar configuraciones básicas

### ¿Qué es Root?

**Root** es el usuario "administrador" del servidor. Tiene todos los permisos. Es como ser "admin" en Windows.

---

## ✅ Checklist de Inicio

Antes de empezar a configurar, verifica:

- [ ] Recibí el email de confirmación
- [ ] Puedo acceder al panel de control
- [ ] El servidor está "Activo"
- [ ] Tengo la IP del servidor
- [ ] Tengo el usuario (root)
- [ ] Tengo la contraseña
- [ ] Puedo conectarme por SSH
- [ ] Los comandos básicos funcionan

---

## 📚 Documentación Relacionada

1. **`docs/SERVIDOR_SIN_PANEL.md`** - ⭐ **LEE PRIMERO** - Explicación de servidor sin cPanel/Ferozo
2. **`docs/GUIA_PRIMERA_VEZ_SSH.md`** - Cómo conectarse por SSH (paso a paso)
3. **`docs/GUIA_CONFIGURACION_CLOUD.md`** - Configuración completa del servidor
4. **`scripts/configurar-servidor-cloud.sh`** - Script automático de configuración

---

## 💡 Tips Importantes

1. **Guarda las credenciales** en un lugar seguro (gestor de contraseñas)
2. **No compartas** tu contraseña con nadie
3. **El servidor puede tardar** 5-10 minutos en estar listo después de comprarlo
4. **El soporte del hosting** está para ayudarte, no dudes en contactarlos
5. **Toma tu tiempo**, no hay prisa

---

## 🚀 Siguiente Paso

Una vez que te conectes por SSH exitosamente:

👉 **Sigue:** `docs/GUIA_CONFIGURACION_CLOUD.md`

O ejecuta el script automático:
```bash
./configurar-servidor-cloud.sh
```

---

**¡No te preocupes!** Es normal sentirse abrumado la primera vez. Tómalo paso a paso y pregunta si tienes dudas. 😊

# Configuración de Email para Notificaciones

## Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env`:

```env
# Configuración SMTP para envío de emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicacion
SMTP_FROM=noreply@tudominio.com

# URL de la aplicación (para links en emails)
APP_URL=http://localhost:3000
```

## Configuración para Gmail

1. **Habilitar contraseña de aplicación:**
   - Ve a tu cuenta de Google
   - Seguridad → Verificación en 2 pasos
   - Contraseñas de aplicaciones
   - Genera una nueva contraseña para "Correo"
   - Usa esa contraseña en `SMTP_PASS`

2. **Ejemplo de configuración:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop
   SMTP_FROM=tu-email@gmail.com
   ```

## Otros Proveedores SMTP

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu-api-key-de-sendgrid
```

## Prueba de Configuración

Puedes probar la configuración usando el endpoint:

```bash
curl -X POST http://localhost:3000/api/dashboard/verificar-movimientos/C-571-2018 \
  -H "Content-Type: application/json" \
  -d '{
    "email_cliente": "cliente@ejemplo.com",
    "nombre_cliente": "Juan Pérez"
  }'
```

## Notas

- Si no configuras las variables SMTP, el sistema usará modo de prueba (no enviará emails reales)
- Los emails se generan automáticamente cuando se detectan movimientos nuevos
- El formato HTML de los emails es responsive y profesional

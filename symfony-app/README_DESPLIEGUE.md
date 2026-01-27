# Despliegue Symfony 5.0.11 en CentOS 7.9

## ⚠️ Nota Importante

Este proyecto Symfony 5.0.11 está **optimizado para PHP 7.4.33** (CentOS 7.9).
En Mac con PHP 8.4, hay deprecations que NO afectan el funcionamiento en producción.

---

## 📦 Paso 1: Copiar proyecto a CentOS

### Desde tu Mac:

```bash
# Comprimir proyecto (excluir node_modules, var/cache)
cd "/Users/diegomartinez/Documents/carpeta sin título/a"
tar -czf symfony-pjud.tar.gz \
    --exclude='symfony-app/var/cache/*' \
    --exclude='symfony-app/var/log/*' \
    --exclude='node_modules' \
    symfony-app/

# Copiar al servidor CentOS
scp symfony-pjud.tar.gz usuario@servidor-centos:/tmp/
```

### En el servidor CentOS:

```bash
# Descomprimir
cd /var/www/html
sudo tar -xzf /tmp/symfony-pjud.tar.gz
sudo mv symfony-app pjud-demo

# Permisos
sudo chown -R apache:apache /var/www/html/pjud-demo
sudo chmod -R 755 /var/www/html/pjud-demo
```

---

## 🔧 Paso 2: Configurar .env

```bash
cd /var/www/html/pjud-demo
sudo vi .env
```

**Ajustar estas líneas:**

```env
APP_ENV=prod
APP_SECRET=GENERAR_SECRETO_ALEATORIO_32_CARACTERES

# Ajustar según tu configuración MariaDB
DATABASE_URL="mysql://root:root@127.0.0.1:3307/codi_ejamtest?serverVersion=5.5.68-mariadb"
```

**Generar `APP_SECRET`:**

```bash
php -r "echo bin2hex(random_bytes(16));"
```

---

## 📚 Paso 3: Instalar dependencias Composer

```bash
cd /var/www/html/pjud-demo

# Si vendor/ NO fue copiado:
composer install --no-dev --optimize-autoloader --no-interaction

# Si vendor/ fue copiado (ya está listo):
ls -la vendor/  # Verificar que existe
```

---

## 🌐 Paso 4: Configurar Apache VirtualHost

```bash
sudo vi /etc/httpd/conf.d/pjud-demo.conf
```

**Contenido:**

```apache
<VirtualHost *:80>
    ServerName pjud-demo.local
    ServerAlias IP_DEL_SERVIDOR

    DocumentRoot /var/www/html/pjud-demo/public
    DirectoryIndex index.php

    <Directory /var/www/html/pjud-demo/public>
        AllowOverride All
        Require all granted
        Options -MultiViews

        # Rewrite rules (requiere mod_rewrite)
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>

    # Logs
    ErrorLog /var/log/httpd/pjud-demo-error.log
    CustomLog /var/log/httpd/pjud-demo-access.log combined

    # PHP settings
    php_value upload_max_filesize 50M
    php_value post_max_size 50M
    php_value memory_limit 256M
</VirtualHost>
```

---

## ⚙️ Paso 5: Verificar mod_rewrite

```bash
# Verificar si mod_rewrite está habilitado
sudo httpd -M | grep rewrite

# Si NO aparece, habilitar:
sudo vi /etc/httpd/conf/httpd.conf
# Buscar y descomentar:
LoadModule rewrite_module modules/mod_rewrite.so
```

---

## 🚀 Paso 6: Crear directorios y permisos

```bash
cd /var/www/html/pjud-demo

# Crear directorios de caché y logs
sudo mkdir -p var/cache var/log

# Permisos para Apache
sudo chown -R apache:apache var/
sudo chmod -R 775 var/

# Permisos para public/
sudo chown -R apache:apache public/
sudo chmod -R 755 public/
```

---

## 🔥 Paso 7: Reiniciar Apache y probar

```bash
# Reiniciar Apache
sudo systemctl restart httpd

# Verificar que está corriendo
sudo systemctl status httpd

# Ver logs en tiempo real (si hay errores)
sudo tail -f /var/log/httpd/pjud-demo-error.log
```

### Acceder desde navegador:

```
http://IP_DEL_SERVIDOR/
http://IP_DEL_SERVIDOR/demo
```

---

## 🧪 Paso 8: Verificar conexión a base de datos

```bash
# Desde el servidor CentOS
cd /var/www/html/pjud-demo

# Probar conexión PHP → MariaDB
php -r "
try {
    \$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=codi_ejamtest', 'root', 'root');
    echo 'Conexión exitosa a MariaDB\n';
    \$stmt = \$pdo->query('SELECT COUNT(*) FROM causas');
    echo 'Total causas: ' . \$stmt->fetchColumn() . \"\n\";
} catch (Exception \$e) {
    echo 'Error: ' . \$e->getMessage() . \"\n\";
}
"
```

---

## 📋 Rutas disponibles

Una vez funcionando, estas rutas estarán disponibles:

### Frontend (navegador):

- **`/`** → Página principal (listado de causas)
- **`/demo`** → Alias de `/`

### API REST (AJAX/JSON):

- **`/causa/{rit}`** → Detalle de causa + movimientos (JSON)
- **`/buscar?rit=...&caratulado=...`** → Búsqueda de causas (JSON)
- **`/pdf/{rit}/{movimientoId}/{tipo}`** → Descargar PDF

---

## 🐛 Troubleshooting

### Error 500: Internal Server Error

```bash
# Ver logs de Apache
sudo tail -50 /var/log/httpd/pjud-demo-error.log

# Ver logs de Symfony
sudo tail -50 /var/www/html/pjud-demo/var/log/prod.log

# Limpiar caché
cd /var/www/html/pjud-demo
sudo rm -rf var/cache/*
php bin/console cache:clear --env=prod

# Restaurar permisos
sudo chown -R apache:apache var/
sudo chmod -R 775 var/
```

### Página en blanco o error 404

```bash
# Verificar que .htaccess existe en public/
ls -la /var/www/html/pjud-demo/public/.htaccess

# Verificar que mod_rewrite está habilitado
sudo httpd -M | grep rewrite

# Verificar sintaxis de Apache
sudo apachectl configtest

# Si todo está bien, reiniciar
sudo systemctl restart httpd
```

### Error de conexión a base de datos

```bash
# Verificar que MariaDB está corriendo
sudo systemctl status mariadb

# Probar conexión desde línea de comandos
mysql -u root -p -P 3307 -h 127.0.0.1 codi_ejamtest

# Verificar credenciales en .env
cat /var/www/html/pjud-demo/.env | grep DATABASE_URL
```

### Modal de detalle no funciona

1. Abrir consola del navegador (F12)
2. Ver errores JavaScript
3. Verificar que `/causa/{rit}` responde JSON:

```bash
curl http://localhost/causa/C-13786-2018
```

---

## 📊 Verificación final

### 1. PHP correcto

```bash
php -v
# Debe mostrar: PHP 7.4.33
```

### 2. Apache correcto

```bash
httpd -v
# Debe mostrar: Apache/2.4.6
```

###  3. MariaDB correcta

```bash
mysql --version
# Debe mostrar: 5.5.68-MariaDB
```

### 4. Extensiones PHP necesarias

```bash
php -m | grep -E "pdo|mysql|ctype|iconv|json"
```

Deberían aparecer:
- `pdo_mysql`
- `PDO`
- `ctype`
- `iconv`
- `json`

### 5. Symfony funcionando

```bash
# Ver rutas registradas
cd /var/www/html/pjud-demo
php bin/console debug:router

# Debería mostrar:
# home          GET      ANY      ANY    /
# demo          GET      ANY      ANY    /demo
# causa_detalle GET      ANY      ANY    /causa/{rit}
# ...
```

---

## 🎯 Integración con scraper

El scraper Node.js (`process-causas.js`) debe:

1. **Insertar datos en MariaDB:**
   - Tabla `causas` → RIT, caratulado, tribunal, etc.
   - Tabla `movimientos` → Folio, fecha, etapa, trámite, etc.
   - Tabla `pdfs` → Contenido base64, nombre, tamaño

2. **Symfony lee automáticamente:**
   - Usa Doctrine ORM (NO consultas SQL directas)
   - Métodos como `$causaRepository->findAll()`
   - `$movimientoRepository->findByRit($rit)`

3. **Flujo completo:**
   ```
   Scraper (Node.js) → MariaDB → Symfony (Doctrine ORM) → Usuario (navegador)
   ```

---

## 📁 Estructura del proyecto

```
pjud-demo/
├── bin/console              # CLI de Symfony
├── config/                  # Configuración
│   ├── packages/
│   │   ├── doctrine.yaml    # Config MariaDB 5.5.68
│   │   ├── framework.yaml   # Router, session
│   │   └── twig.yaml
│   ├── routes.yaml
│   └── services.yaml
├── public/                  # DocumentRoot Apache
│   ├── index.php            # Front controller
│   └── .htaccess            # Rewrite rules
├── src/
│   ├── Controller/
│   │   └── CausaController.php
│   ├── Entity/
│   │   ├── Causa.php
│   │   ├── Movimiento.php
│   │   └── PDF.php
│   ├── Repository/
│   │   ├── CausaRepository.php
│   │   ├── MovimientoRepository.php
│   │   └── PDFRepository.php
│   └── Kernel.php
├── templates/
│   ├── base.html.twig
│   └── demo/
│       └── index.html.twig  # Vista PJUD
├── var/
│   ├── cache/               # Caché Symfony
│   └── log/                 # Logs Symfony
├── vendor/                  # Dependencias Composer
├── .env                     # Variables de entorno
└── composer.json
```

---

## ✅ Checklist final

Antes de dar por terminado el despliegue:

- [ ] PHP 7.4.33 instalado y activo
- [ ] Composer instalado
- [ ] Dependencias instaladas (`vendor/` existe)
- [ ] `.env` configurado con credenciales correctas
- [ ] Apache VirtualHost creado (`/etc/httpd/conf.d/pjud-demo.conf`)
- [ ] `mod_rewrite` habilitado en Apache
- [ ] Permisos `var/` configurados (`apache:apache`, `775`)
- [ ] Apache reiniciado (`sudo systemctl restart httpd`)
- [ ] Conexión a MariaDB funciona (puerto 3307)
- [ ] Rutas accesibles: `http://IP/` y `http://IP/demo`
- [ ] Modal de detalle funciona (botón lupa)

---

## 📞 Soporte

Si algo falla:

1. **Ver logs:**
   - Apache: `/var/log/httpd/pjud-demo-error.log`
   - Symfony: `/var/www/html/pjud-demo/var/log/prod.log`

2. **Limpiar caché:**
   ```bash
   cd /var/www/html/pjud-demo
   sudo rm -rf var/cache/*
   php bin/console cache:clear --env=prod
   sudo chown -R apache:apache var/
   ```

3. **Verificar configuración:**
   ```bash
   php bin/console debug:config framework
   php bin/console debug:router
   ```

---

## 🚀 Próximos pasos

Una vez funcionando:

1. **Integrar con scraper:** Verificar que `process-causas.js` inserta datos correctamente
2. **Probar búsquedas:** Formulario de búsqueda por RIT, caratulado, tribunal
3. **Probar modal:** Botón lupa muestra movimientos
4. **Optimizar:** Cambiar `APP_ENV=prod` y `APP_DEBUG=0` en `.env`
5. **Seguridad:** Configurar firewall, SSL/HTTPS si es necesario

---

## 📚 Documentación oficial

- Symfony 5.0: https://symfony.com/doc/5.0/index.html
- Doctrine ORM: https://www.doctrine-project.org/projects/doctrine-orm/en/2.7/
- Bootstrap 4.5: https://getbootstrap.com/docs/4.5/

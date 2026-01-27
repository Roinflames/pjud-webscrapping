# Instalación Symfony 5.0.11 en CentOS 7.9

## Requisitos del Sistema (Ya instalados)

- **Linux:** CentOS Linux release 7.9.2009
- **PHP:** 7.4.33
- **Apache:** 2.4.6 (CentOS)
- **MariaDB:** 5.5.68-MariaDB
- **Composer:** 2.x

---

## Paso 1: Copiar proyecto al servidor

```bash
# Copiar carpeta symfony-app al servidor
cd /var/www/html
sudo cp -r /ruta/origen/symfony-app /var/www/html/pjud-demo
sudo chown -R apache:apache /var/www/html/pjud-demo
sudo chmod -R 755 /var/www/html/pjud-demo
```

---

## Paso 2: Configurar base de datos (.env)

```bash
cd /var/www/html/pjud-demo
sudo vi .env
```

**Ajustar estas líneas:**

```env
# Symfony Application Environment
APP_ENV=prod
APP_SECRET=CAMBIAR_POR_SECRETO_ALEATORIO_32_CARACTERES

# Database Configuration (MariaDB 5.5.68)
DATABASE_URL="mysql://root:root@127.0.0.1:3307/codi_ejamtest?serverVersion=5.5.68-mariadb"

# PJUD Configuration
OJV_URL=https://oficinajudicialvirtual.pjud.cl/home/index.php
```

**IMPORTANTE:** Cambiar `APP_SECRET` por una cadena aleatoria:

```bash
php -r "echo bin2hex(random_bytes(16));"
```

---

## Paso 3: Instalar dependencias Composer

```bash
cd /var/www/html/pjud-demo

# Instalar dependencias (esto descarga ~50MB)
composer install --no-dev --optimize-autoloader --no-interaction

# Verificar que se instaló correctamente
ls -la vendor/
```

**Posibles errores:**

- **Error:** `Your requirements could not be resolved`
  - **Solución:** Verificar que PHP 7.4.33 está activo: `php -v`

- **Error:** `Extension pdo_mysql is missing`
  - **Solución:** `sudo yum install php74-php-mysqlnd`

---

## Paso 4: Configurar permisos de directorios

```bash
cd /var/www/html/pjud-demo

# Crear directorios de caché y logs
sudo mkdir -p var/cache var/log
sudo chown -R apache:apache var/
sudo chmod -R 775 var/

# Permisos de public/
sudo chown -R apache:apache public/
sudo chmod -R 755 public/
```

---

## Paso 5: Configurar Apache VirtualHost

```bash
sudo vi /etc/httpd/conf.d/pjud-demo.conf
```

**Contenido del archivo:**

```apache
<VirtualHost *:80>
    ServerName pjud-demo.local
    ServerAlias www.pjud-demo.local

    DocumentRoot /var/www/html/pjud-demo/public
    DirectoryIndex index.php

    <Directory /var/www/html/pjud-demo/public>
        AllowOverride All
        Require all granted

        # Habilitar mod_rewrite
        Options -MultiViews
        RewriteEngine On

        # Redirigir todo a index.php
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>

    # Logs
    ErrorLog /var/log/httpd/pjud-demo-error.log
    CustomLog /var/log/httpd/pjud-demo-access.log combined

    # PHP Settings (opcional)
    php_value upload_max_filesize 50M
    php_value post_max_size 50M
    php_value memory_limit 256M
</VirtualHost>
```

---

## Paso 6: Habilitar mod_rewrite en Apache

```bash
# Verificar que mod_rewrite está habilitado
sudo httpd -M | grep rewrite

# Si no aparece, habilitar:
sudo vi /etc/httpd/conf/httpd.conf
# Buscar línea: #LoadModule rewrite_module modules/mod_rewrite.so
# Quitar el comentario (#)

# Reiniciar Apache
sudo systemctl restart httpd
```

---

## Paso 7: Probar la aplicación

```bash
# 1. Reiniciar Apache
sudo systemctl restart httpd

# 2. Verificar que no hay errores
sudo tail -f /var/log/httpd/pjud-demo-error.log

# 3. Acceder desde navegador
# http://IP-DEL-SERVIDOR/
# http://IP-DEL-SERVIDOR/demo
```

---

## Paso 8: Limpiar caché de Symfony (si hay cambios)

```bash
cd /var/www/html/pjud-demo

# Limpiar caché de producción
php bin/console cache:clear --env=prod

# Permisos nuevamente
sudo chown -R apache:apache var/cache
sudo chmod -R 775 var/cache
```

---

## Rutas disponibles

- **`/`** o **`/demo`** → Listado de causas (vista principal PJUD)
- **`/causa/{rit}`** → Detalle de causa (JSON API)
- **`/pdf/{rit}/{movimientoId}/{tipo}`** → Descargar PDF
- **`/buscar?rit=...&caratulado=...`** → Búsqueda de causas (JSON API)

---

## Troubleshooting

### Error 500: Internal Server Error

```bash
# Ver logs de Apache
sudo tail -50 /var/log/httpd/pjud-demo-error.log

# Ver logs de Symfony
sudo tail -50 /var/www/html/pjud-demo/var/log/prod.log

# Verificar permisos
sudo chown -R apache:apache /var/www/html/pjud-demo
sudo chmod -R 755 /var/www/html/pjud-demo
sudo chmod -R 775 /var/www/html/pjud-demo/var
```

### Error de conexión a base de datos

```bash
# Probar conexión desde PHP
php -r "new PDO('mysql:host=127.0.0.1;port=3307;dbname=codi_ejamtest', 'root', 'root');"

# Si falla, verificar MariaDB
sudo systemctl status mariadb
mysql -u root -p -P 3307 -h 127.0.0.1
```

### Apache no muestra cambios

```bash
# Limpiar caché completo
sudo rm -rf /var/www/html/pjud-demo/var/cache/*
php bin/console cache:clear --env=prod
sudo systemctl restart httpd
```

---

## Verificación final

```bash
# 1. PHP correcto
php -v  # Debe mostrar 7.4.33

# 2. Apache correcto
httpd -v  # Debe mostrar Apache/2.4.6

# 3. MariaDB correcta
mysql --version  # Debe mostrar 5.5.68-MariaDB

# 4. Composer correcto
composer --version

# 5. Extensiones PHP necesarias
php -m | grep -E "pdo|mysql|ctype|iconv|json"
```

---

## Arquitectura del proyecto

```
symfony-app/
├── bin/console              # CLI de Symfony
├── config/                  # Configuración
│   ├── bundles.php
│   ├── routes.yaml
│   ├── services.yaml
│   └── packages/
│       ├── doctrine.yaml    # Config MariaDB
│       ├── framework.yaml
│       └── twig.yaml
├── public/                  # DocumentRoot de Apache
│   ├── index.php            # Front controller
│   └── .htaccess            # Reglas mod_rewrite
├── src/
│   ├── Controller/          # CausaController.php
│   ├── Entity/              # Causa, Movimiento, PDF
│   ├── Repository/          # Repositorios Doctrine
│   └── Kernel.php
├── templates/
│   ├── base.html.twig       # Layout base Bootstrap 4.5
│   └── demo/
│       └── index.html.twig  # Vista principal PJUD
├── var/
│   ├── cache/               # Caché de Symfony
│   └── log/                 # Logs de Symfony
├── vendor/                  # Dependencias Composer
├── .env                     # Variables de entorno
└── composer.json            # Dependencias del proyecto
```

---

## Producción: Optimizaciones

```bash
cd /var/www/html/pjud-demo

# 1. Modo producción en .env
APP_ENV=prod
APP_DEBUG=0

# 2. Optimizar autoloader
composer dump-autoload --optimize --no-dev

# 3. Cachear configuración
php bin/console cache:warmup --env=prod

# 4. Permisos finales
sudo chown -R apache:apache /var/www/html/pjud-demo
sudo chmod -R 755 /var/www/html/pjud-demo
sudo chmod -R 775 /var/www/html/pjud-demo/var

# 5. Reiniciar Apache
sudo systemctl restart httpd
```

---

## Contacto y soporte

- Documentación Symfony 5.0: https://symfony.com/doc/5.0/index.html
- Doctrine ORM: https://www.doctrine-project.org/projects/doctrine-orm/en/2.7/index.html
- Bootstrap 4.5: https://getbootstrap.com/docs/4.5/

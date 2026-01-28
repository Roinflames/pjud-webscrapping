# ⚠️ ACCIÓN REQUERIDA: Configurar MySQL para Usar Directorio Temporal Alternativo

## Problema Identificado

**MySQL errno 30:** El disco está al 92% de capacidad (183Gi/228Gi usado). MySQL no puede crear tablas porque necesita espacio para archivos temporales en `/tmp`.

```
Filesystem      Size    Used   Avail Capacity
/dev/disk3s1   228Gi   183Gi    18Gi    92%
```

## Solución Inmediata (5 minutos)

### Configurar MySQL para Usar Directorio Temporal Diferente

**Paso 1:** Verificar ubicación del archivo de configuración de MySQL

```bash
mysql --help | grep "Default options" -A 1
```

Probablemente mostrará algo como:
- `/etc/my.cnf`
- `/etc/mysql/my.cnf`
- `/usr/local/etc/my.cnf`
- `~/.my.cnf`

**Paso 2:** Editar el archivo de configuración

```bash
# Si tienes permisos:
sudo nano /etc/my.cnf

# O crear/editar configuración de usuario:
nano ~/.my.cnf
```

**Paso 3:** Agregar la siguiente configuración

```ini
[mysqld]
tmpdir=/Users/diegomartinez/Documents/mysql_tmp
```

**Paso 4:** Reiniciar MySQL

```bash
# Si MySQL fue instalado con Homebrew:
brew services restart mysql

# O si es servicio del sistema:
sudo systemctl restart mysql

# O manualmente:
sudo /usr/local/mysql/support-files/mysql.server restart
```

**Paso 5:** Verificar que funciona

```bash
node scripts/test_nueva_tabla.js
```

Si sale `🎉 CONCLUSIÓN: MariaDB funciona correctamente`, entonces está resuelto.

## Alternativa: Liberar Espacio en Disco (20-30 minutos)

Si prefieres liberar espacio en lugar de cambiar tmpdir:

### Opción A: Limpiar Docker

```bash
docker system prune -a --volumes
# Puede liberar 10-50GB
```

### Opción B: Limpiar Homebrew

```bash
brew cleanup -s
rm -rf $(brew --cache)
# Puede liberar 1-5GB
```

### Opción C: Encontrar y Eliminar Archivos Grandes

```bash
# Buscar archivos >1GB
sudo find /Users/diegomartinez -type f -size +1G 2>/dev/null | head -20

# Buscar directorios grandes
sudo du -h /Users/diegomartinez 2>/dev/null | sort -hr | head -20
```

### Opción D: Vaciar Cachés del Sistema

```bash
# Cache de usuario
rm -rf ~/Library/Caches/*

# Logs del sistema (requiere sudo)
sudo rm -rf /private/var/log/*.log
sudo rm -rf /private/var/log/*.gz
```

## Verificación Post-Solución

Una vez aplicada cualquier solución:

```bash
# 1. Verificar espacio libre
df -h
# Objetivo: <80% de uso O tmpdir configurado

# 2. Probar creación de tabla
cd "/Users/diegomartinez/Documents/carpeta sin título/a"
node scripts/test_nueva_tabla.js

# 3. Si funciona, importar schema
node scripts/reparar_bd_completo.js

# 4. Ejecutar scraping de prueba
node src/index.js
```

## Qué Hacer Si Sigues Teniendo Problemas

Si después de aplicar las soluciones el error persiste:

1. Verificar que MySQL realmente usa el nuevo tmpdir:
   ```bash
   mysql -u root -e "SHOW VARIABLES LIKE 'tmpdir'"
   ```

2. Verificar permisos del directorio temporal:
   ```bash
   ls -ld /Users/diegomartinez/Documents/mysql_tmp
   # Debe ser: drwxrwxrwx
   ```

3. Verificar logs de MySQL:
   ```bash
   # Homebrew:
   tail -50 /usr/local/var/mysql/*.err

   # O buscar logs:
   find /usr/local/var/mysql -name "*.err"
   ```

## Resumen de Acciones

**Rápida (5 min):**
1. ✅ Directorio temporal creado: `/Users/diegomartinez/Documents/mysql_tmp`
2. ⏳ Configurar MySQL para usarlo
3. ⏳ Reiniciar MySQL
4. ⏳ Verificar con test

**Completa (30 min):**
1. Liberar 20-30GB de espacio
2. Reiniciar MySQL
3. Verificar con test

**Elige una e infórmame para continuar con el scraping.**

---

**Estado Actual:**
- ✅ Scraping funcional (17 movimientos, 8 PDFs)
- ❌ Base de datos bloqueada por falta de espacio
- ⏸️ Guardado de datos pendiente
- ⏸️ Frontend pendiente

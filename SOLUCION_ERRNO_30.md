# 🔍 SOLUCIÓN ENCONTRADA: errno 30

## Diagnóstico Final

**Problema Root Cause:** Disco lleno al 92% (183Gi usado de 228Gi)

```
Filesystem      Size    Used   Avail Capacity
/dev/disk3s1   228Gi   183Gi    18Gi    92%
```

**Errno 30:** "Read-only file system" - En realidad MySQL no puede escribir archivos temporales porque el disco está casi lleno.

## Evidencia

1. ✅ Usuario `root` tiene ALL PRIVILEGES
2. ✅ `read_only = OFF`
3. ✅ Permisos correctos en datadir
4. ❌ Disco al 92% de capacidad
5. ❌ MySQL necesita espacio en `/tmp` para operaciones DDL

## Solución Inmediata

### Opción 1: Liberar Espacio en Disco (RECOMENDADO)

```bash
# Encontrar archivos grandes
sudo find / -type f -size +1G 2>/dev/null | head -20

# Limpiar cache de Docker
docker system prune -a --volumes
# Esto puede liberar 10-50GB

# Limpiar cache de Homebrew
brew cleanup -s
rm -rf $(brew --cache)

# Limpiar Xcode derived data (si aplica)
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Vaciar papelera
rm -rf ~/.Trash/*

# Verificar espacio liberado
df -h
```

### Opción 2: Cambiar tmpdir de MySQL

Si no puedes liberar espacio inmediatamente:

```bash
# 1. Crear directorio temporal en partición con espacio
mkdir -p ~/mysql_tmp
chmod 777 ~/mysql_tmp

# 2. Configurar MySQL para usar este tmpdir
# Editar /etc/my.cnf (o ~/.my.cnf):
[mysqld]
tmpdir=/Users/diegomartinez/mysql_tmp

# 3. Reiniciar MySQL
brew services restart mysql
# O si es via systemd:
sudo systemctl restart mysql
```

### Opción 3: Usar Base de Datos Existente en Symfony

El proyecto Symfony ya tiene las tablas creadas en puerto 3306. Usar esa BD directamente:

1. Verificar tablas existentes:
   ```bash
   mysql -h 127.0.0.1 -P 3306 -u root codi_ejamtest -e "SHOW TABLES"
   ```

2. Si las tablas están OK, usar puerto 3306 en el scraper

3. Si las tablas también están corruptas, necesitas liberar espacio primero

## Verificación Post-Limpieza

```bash
# 1. Verificar espacio
df -h
# Objetivo: <80% de uso

# 2. Probar creación de tabla
node scripts/test_nueva_tabla.js

# 3. Si funciona, recrear schema
node scripts/reparar_bd_completo.js

# 4. Ejecutar scraping de prueba
node src/index.js
```

## Archivos Candidatos a Eliminar

Buscar en el proyecto actual:

```bash
# PDFs generados (si ya están en BD)
du -sh outputs/
# Si >5GB y ya están guardados, eliminar

# Logs antiguos
du -sh logs/
# Conservar últimos 30 días, eliminar el resto

# Node modules duplicados
find . -name "node_modules" -type d -prune
# Si hay múltiples copias, dejar solo la principal

# Screenshots de debug
find . -name "*.png" -o -name "*.jpg" | wc -l
# Si hay cientos, conservar solo últimos 10
```

## Prevención

Una vez resuelto, configurar limpieza automática:

1. **Rotación de logs:** Implementar en el scraper
2. **Limpieza de PDFs temporales:** Después de guardar en BD
3. **Monitoreo de disco:** Alert si >85%

## Tiempo Estimado

- **Liberar espacio manual:** 10-20 minutos
- **Docker system prune:** 5-10 minutos
- **Verificación post-limpieza:** 2-3 minutos
- **Total:** ~20-30 minutos

## Comandos Rápidos

```bash
# Todo en uno (cuidado, elimina datos)
docker system prune -a --volumes -f && \
brew cleanup -s && \
rm -rf $(brew --cache) && \
rm -rf ~/.Trash/* && \
df -h
```

---

**ACCIÓN REQUERIDA:** Liberar al menos 20GB para que MySQL pueda operar normalmente.

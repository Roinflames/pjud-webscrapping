# Reparación Manual de Base de Datos Corrupta

## Diagnóstico

La base de datos `codi_ejamtest` tiene **corrupción severa del catálogo de sistema**:

- ✅ `DROP TABLE` ejecuta sin error
- ❌ Las tablas siguen apareciendo en `SHOW TABLES`
- ❌ Cualquier operación busca archivos `.frm` inexistentes
- ❌ `CREATE TABLE` falla porque MariaDB cree que la tabla ya existe

## Causa Raíz

MariaDB 5.5.68 usa archivos físicos por tabla:
- `.frm` - Definición de la tabla
- `.MYD` o `.ibd` - Datos
- `.MYI` - Índices

Los archivos fueron eliminados manualmente o corrompidos, pero el catálogo de sistema (`information_schema`) todavía tiene referencias.

## Solución: Limpieza Manual del Datadir

### Opción 1: Eliminar archivos huérfanos del datadir (RECOMENDADO)

```bash
# 1. Detener MariaDB
docker-compose stop mariadb   # Si está en Docker
# O si es servicio local:
sudo systemctl stop mariadb

# 2. Localizar el datadir
# Por defecto en Docker: /var/lib/mysql
# Por defecto en Mac Homebrew: /opt/homebrew/var/mysql
# Por defecto en Linux: /var/lib/mysql

# 3. Navegar al directorio de la base de datos
cd /var/lib/mysql/codi_ejamtest   # Ajustar según tu instalación

# 4. Eliminar archivos .frm huérfanos de las tablas corruptas
rm -f causas.frm
rm -f movimientos.frm
rm -f pdfs.frm
rm -f ebooks.frm
rm -f etapas_juicio.frm
rm -f scraping_log.frm
rm -f errores_scraping.frm

# También eliminar .ibd si usan InnoDB
rm -f causas.ibd
rm -f movimientos.ibd
rm -f pdfs.ibd
rm -f ebooks.ibd
rm -f etapas_juicio.ibd
rm -f scraping_log.ibd
rm -f errores_scraping.ibd

# 5. Reiniciar MariaDB
docker-compose start mariadb   # Si está en Docker
# O:
sudo systemctl start mariadb

# 6. Ejecutar el script de recreación
node scripts/forzar_limpieza_bd.js
```

### Opción 2: Recrear la base de datos completamente (MÁS SIMPLE)

```bash
# 1. Conectar a MariaDB
mysql -h 127.0.0.1 -P 3307 -u root -proot

# 2. Eliminar y recrear la base de datos
DROP DATABASE IF EXISTS codi_ejamtest;
CREATE DATABASE codi_ejamtest CHARACTER SET utf8 COLLATE utf8_general_ci;
exit

# 3. Importar el schema
mysql -h 127.0.0.1 -P 3307 -u root -proot codi_ejamtest < database/schema_mariadb_5.5.sql
```

### Opción 3: Usar script de reparación SQL (SIN ACCESO AL FILESYSTEM)

Si no tienes acceso al filesystem del servidor MariaDB, crea este script SQL:

```sql
-- Archivo: reparar_bd.sql

-- Desactivar verificaciones
SET FOREIGN_KEY_CHECKS = 0;
SET sql_notes = 0;

-- Forzar eliminación de tablas usando IF EXISTS múltiples veces
DROP TABLE IF EXISTS v_movimientos_por_etapa;
DROP VIEW IF EXISTS v_movimientos_por_etapa;
DROP TABLE IF EXISTS v_causas_resumen;
DROP VIEW IF EXISTS v_causas_resumen;

DROP TABLE IF EXISTS errores_scraping;
DROP TABLE IF EXISTS scraping_log;
DROP TABLE IF EXISTS ebooks;
DROP TABLE IF EXISTS pdfs;
DROP TABLE IF EXISTS movimientos;
DROP TABLE IF EXISTS etapas_juicio;
DROP TABLE IF EXISTS causas;

FLUSH TABLES;

-- Recrear desde cero
SOURCE database/schema_mariadb_5.5.sql;

SET FOREIGN_KEY_CHECKS = 1;
```

## Prueba de Concepto: Crear Tabla Nueva

Para verificar que MariaDB funciona correctamente con tablas nuevas:

```bash
node scripts/test_nueva_tabla.js
```

## Próximos Pasos

Una vez reparada la base de datos:

1. ✅ Verificar que las tablas existen y son accesibles
2. ✅ Ejecutar scraping de 1 causa de prueba
3. ✅ Verificar que los datos se guardan correctamente:
   - Tabla `causas`: 1 registro
   - Tabla `movimientos`: ~17 registros
   - Tabla `pdfs`: ~8 registros
4. ✅ Crear la vista para mostrar los datos en el frontend

## Script de Prueba

```javascript
// scripts/test_nueva_tabla.js
const { query } = require('../src/database/db-mariadb');

async function testNuevaTabla() {
  try {
    // Crear tabla de prueba
    await query(`
      CREATE TABLE IF NOT EXISTS test_tabla (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `);
    console.log('✅ Tabla de prueba creada');

    // Insertar datos
    await query(`INSERT INTO test_tabla (nombre) VALUES ('Prueba 1')`);
    console.log('✅ Datos insertados');

    // Leer datos
    const rows = await query(`SELECT * FROM test_tabla`);
    console.log('✅ Datos leídos:', rows);

    // Eliminar tabla
    await query(`DROP TABLE test_tabla`);
    console.log('✅ Tabla eliminada');

    console.log('\n🎉 MariaDB funciona correctamente para tablas nuevas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testNuevaTabla();
```

## Contacto con el Usuario

**⚠️ ACCIÓN REQUERIDA DEL USUARIO:**

La base de datos tiene corrupción severa del catálogo de sistema. Necesitas elegir una de estas opciones:

1. **OPCIÓN MÁS RÁPIDA**: Ejecutar en terminal MySQL:
   ```sql
   DROP DATABASE IF EXISTS codi_ejamtest;
   CREATE DATABASE codi_ejamtest CHARACTER SET utf8 COLLATE utf8_general_ci;
   ```
   Luego importar: `mysql -h 127.0.0.1 -P 3307 -u root -proot codi_ejamtest < database/schema_mariadb_5.5.sql`

2. **OPCIÓN MANUAL**: Acceder al datadir de MariaDB y eliminar los archivos `.frm` huérfanos

3. **OPCIÓN DOCKER**: Si MariaDB está en Docker, recrear el contenedor con volumen limpio

¿Cuál prefieres?

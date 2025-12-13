# 🗄️ Estructura de Base de Datos

## Tabla `causa`

### Columnas:
```sql
id                      INT(11)         PRIMARY KEY
agenda_id               INT(11)         FOREIGN KEY → agenda.id
materia_estrategia_id   INT(11)         Competencia
juzgado_cuenta_id      INT(11)         Tribunal
id_causa                VARCHAR/TEXT     RIT completo (ej: "C-13786-2018")
causa_nombre            VARCHAR/TEXT     Caratulado
estado                  INT(11)         Estado (default: 1)
anexo_id                INT(11)         NULL
fecha_ultimo_ingreso    DATETIME         NULL
```

### Relaciones:
- `agenda_id` → `agenda.id` (relación con tabla agenda)
- `materia_estrategia_id` → tabla de materias/estrategias
- `juzgado_cuenta_id` → tabla de juzgados/cuentas

---

## Tabla `agenda`

### Columnas principales:
```sql
id                      INT(11)         PRIMARY KEY
cuenta_id               INT(11)
nombre_cliente          VARCHAR(255)    Cliente
rut_cliente            VARCHAR(255)     RUT del cliente
abogado_id             INT(11)         FOREIGN KEY → usuario.id
email_cliente          VARCHAR(255)
telefono_cliente       VARCHAR(255)
fecha_carga            DATETIME
fecha_asignado         DATETIME
status_id              INT(11)
detalle_cliente        LONGTEXT
monto                  DECIMAL(10,0)
observacion            LONGTEXT
...
```

### Relaciones:
- `abogado_id` → `usuario.id` (abogado asignado)
- `cuenta_id` → `cuenta.id` (juzgado/compañía)

---

## Tabla `actuacion`

### Columnas:
```sql
id                      INT(11)         PRIMARY KEY
cuaderno_id            INT(11)         Tipo de cuaderno
nombre                  VARCHAR/TEXT     Nombre de la actuación
```

### Ejemplos de actuaciones:
- Cuaderno 1: "Mandato", "Monitoreo", "Informe de causa presentada"
- Cuaderno 2: "Notificacion de la demanda", "Excepciones", "Sentencia", etc.
- Cuaderno 3: "mandamiento de ejecución y embargo", "Embargo", "Remate"
- Cuaderno 4: "demanda de tercería", "Resolución", etc.
- Cuaderno 5: "demanda de nulidad", etc.
- Cuaderno 6: "abandono del procedimiento", etc.

---

## Tabla `actuacion_anexo_procesal`

### Columnas:
```sql
id                      INT(11)         PRIMARY KEY
actuacion_id            INT(11)         FOREIGN KEY → actuacion.id
anexo_procesal_id      INT(11)         FOREIGN KEY → anexo_procesal.id
```

### Relación:
- Conecta actuaciones con anexos procesales

---

## Tabla `accion`

### Columnas:
```sql
id                      INT(11)         PRIMARY KEY
empresa_id              INT(11)
nombre                  VARCHAR(255)    Nombre de la acción
accion                  VARCHAR(255)    Tipo de acción (view, edit, create, full, none)
```

---

## 🔄 Mapeo CSV → BD

### CSV (`causa.csv`) → Tabla `causa`:

| CSV | BD (causa) | Notas |
|-----|------------|-------|
| `causa_id` | `id` | ID único de la causa |
| `agenda_id` | `agenda_id` | Relación con tabla agenda |
| `rit` | `id_causa` | RIT completo (ej: "C-13786-2018") |
| `caratulado` | `causa_nombre` | Nombre del caratulado |
| `competencia` | `materia_estrategia_id` | ID de competencia |
| `tribunal` | `juzgado_cuenta_id` | ID del tribunal |
| - | `estado` | Default: 1 |
| - | `anexo_id` | NULL |
| - | `fecha_ultimo_ingreso` | NULL |

### CSV → Tabla `agenda` (relación):

| CSV | BD (agenda) | Notas |
|-----|-------------|-------|
| `agenda_id` | `id` | ID de la agenda |
| `cliente` | `nombre_cliente` | Puede ser NULL |
| `rut` | `rut_cliente` | Puede ser NULL |
| `abogado_id` | `abogado_id` | Puede ser NULL |
| `cuenta_id` | `cuenta_id` | Puede ser NULL |

---

## 📊 Estadísticas de la BD

Según phpMyAdmin:
- **Total filas en `causa`**: 62,489
- **Muchas filas tienen NULL** en `id_causa` y `causa_nombre`
- **Filas con datos completos**: Solo algunas tienen RIT y caratulado

---

## 🔍 Consultas Útiles

### Ver causas con RIT y caratulado:
```sql
SELECT 
    id,
    agenda_id,
    id_causa AS rit,
    causa_nombre AS caratulado,
    materia_estrategia_id AS competencia,
    juzgado_cuenta_id AS tribunal
FROM causa
WHERE id_causa IS NOT NULL 
  AND id_causa != ''
  AND causa_nombre IS NOT NULL
  AND causa_nombre != '';
```

### Contar causas por estado:
```sql
SELECT 
    estado,
    COUNT(*) AS total,
    COUNT(id_causa) AS con_rit,
    COUNT(causa_nombre) AS con_caratulado
FROM causa
GROUP BY estado;
```

### Causas con datos de agenda:
```sql
SELECT 
    c.id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.abogado_id,
    a.cuenta_id
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.id_causa IS NOT NULL
ORDER BY c.id;
```

---

## 🚀 Sincronizar CSV → BD

Usa el script `src/sync-csv-to-db.js`:

```bash
# Analizar diferencias
node src/sync-csv-to-db.js analyze

# Generar archivo SQL
node src/sync-csv-to-db.js sql

# Ejecutar SQL en MySQL
mysql -u root -p codi_ejamtest < sync_causas.sql
```


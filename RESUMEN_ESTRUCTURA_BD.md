# 📊 Resumen: Estructura de Base de Datos

## 🗄️ Tabla `causa` (62,489 registros)

### Estructura Visual (según phpMyAdmin):

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | INT(11) | ID único (PK) | 11, 17, 22 |
| `agenda_id` | INT(11) | FK → agenda.id | 75152, 79008 |
| `materia_estrategia_id` | INT(11) | Competencia | 1 |
| `juzgado_cuenta_id` | INT(11) | Tribunal | 8, 29, 109 |
| `id_causa` | VARCHAR/TEXT | **RIT completo** | "C-13786-2018" |
| `causa_nombre` | VARCHAR/TEXT | **Caratulado** | "PROMOTORA CMR FALABELLA S.A/YÁ" |
| `estado` | INT(11) | Estado | 1 |
| `anexo_id` | INT(11) | NULL | NULL |
| `fecha_ultimo_ingreso` | DATETIME | NULL | NULL |

### Observaciones:
- ✅ **62,489 filas** en total
- ⚠️ Muchas filas tienen `NULL` en `id_causa` y `causa_nombre`
- ✅ Solo algunas filas tienen datos completos (RIT + caratulado)
- ✅ Relación con `agenda` vía `agenda_id`

---

## 🔄 Mapeo CSV → BD

### Tu CSV (`causa.csv`) tiene:
- **4,198 causas únicas**
- **100% con RIT** (rit)
- **96% con caratulado**
- **100% con competencia**
- **81% con tribunal**

### Mapeo directo:

```sql
CSV.causa_id          → BD.id
CSV.agenda_id         → BD.agenda_id  
CSV.rit               → BD.id_causa          ⭐ RIT completo
CSV.caratulado        → BD.causa_nombre      ⭐ Caratulado
CSV.competencia       → BD.materia_estrategia_id
CSV.tribunal          → BD.juzgado_cuenta_id
```

---

## 📋 Tablas Relacionadas

### 1. Tabla `agenda`
- Relación: `causa.agenda_id` → `agenda.id`
- Contiene: cliente, RUT, abogado_id, cuenta_id
- Muchos campos pueden ser NULL

### 2. Tabla `actuacion`
- Tipos de actuaciones procesales
- Relacionada con cuadernos (1-6)
- Ejemplos: "Mandato", "Sentencia", "Embargo", etc.

### 3. Tabla `actuacion_anexo_procesal`
- Relación entre actuaciones y anexos
- `actuacion_id` → `actuacion.id`
- `anexo_procesal_id` → tabla de anexos

### 4. Tabla `accion`
- Permisos/acciones del sistema
- Relacionada con empresas

---

## 🚀 Sincronización CSV → BD

### Script creado: `src/sync-csv-to-db.js`

**Genera SQL UPDATE para actualizar la BD con datos del CSV:**

```bash
# Analizar diferencias
node src/sync-csv-to-db.js analyze

# Generar archivo SQL
node src/sync-csv-to-db.js sql sync_causas.sql

# Ejecutar en MySQL
mysql -u root -p codi_ejamtest < sync_causas.sql
```

**Qué hace:**
1. Lee `causa.csv`
2. Genera SQL UPDATE para cada causa
3. Actualiza: `id_causa` (RIT), `causa_nombre` (caratulado), `materia_estrategia_id`, `juzgado_cuenta_id`
4. Solo actualiza causas que tienen RIT

---

## 📊 Estadísticas

### CSV:
- Total: **4,198 causas**
- Con RIT: **4,198** (100%)
- Con caratulado: **4,029** (96%)
- Completas: **3,373** (80%)

### BD:
- Total: **62,489 filas**
- Con RIT (`id_causa`): Solo algunas
- Con caratulado (`causa_nombre`): Solo algunas

**Conclusión:** El CSV tiene datos más completos que la BD actual.

---

## 🔍 Consultas Útiles

### Ver causas con RIT en BD:
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
ORDER BY id;
```

### Contar causas con datos:
```sql
SELECT 
    COUNT(*) AS total,
    COUNT(id_causa) AS con_rit,
    COUNT(causa_nombre) AS con_caratulado,
    COUNT(CASE WHEN id_causa IS NOT NULL AND causa_nombre IS NOT NULL THEN 1 END) AS completas
FROM causa;
```

### Causas con datos de agenda:
```sql
SELECT 
    c.id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.id_causa IS NOT NULL
LIMIT 100;
```

---

## ✅ Próximos Pasos

1. **Generar SQL de sincronización:**
   ```bash
   node src/sync-csv-to-db.js sql
   ```

2. **Revisar el SQL generado:**
   ```bash
   head -50 sync_causas.sql
   ```

3. **Ejecutar en BD (backup primero!):**
   ```bash
   # Backup
   mysqldump -u root -p codi_ejamtest causa > backup_causa_$(date +%Y%m%d).sql
   
   # Sincronizar
   mysql -u root -p codi_ejamtest < sync_causas.sql
   ```

4. **Verificar resultados:**
   ```sql
   SELECT COUNT(*) FROM causa WHERE id_causa IS NOT NULL;
   ```



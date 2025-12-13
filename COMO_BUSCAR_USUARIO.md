# 🔍 Cómo Buscar Usuario en la Base de Datos

## 📋 Datos del Usuario (de pjud_config.json)

- **RIT**: 16707-2019
- **Cliente**: Carlos Domingo Gutierrez Ramos
- **RUT**: 8.462.961-8
- **Folio**: 20212
- **Caratulado**: 27 Juzgado Civil de Santiago
- **Tribunal**: 276
- **Competencia**: 3

---

## 🚀 Opción 1: phpMyAdmin (Recomendado)

1. Abre phpMyAdmin en tu navegador
2. Selecciona la base de datos `codi_ejamtest`
3. Ve a la pestaña **"SQL"**
4. Copia y pega esta query:

```sql
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    c.materia_estrategia_id AS competencia,
    c.juzgado_cuenta_id AS tribunal,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.folio,
    a.abogado_id,
    a.cuenta_id,
    a.email_cliente,
    a.telefono_cliente,
    a.fecha_carga,
    a.fecha_asignado,
    a.status_id
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE (
    c.id_causa = '16707-2019' 
    OR c.id_causa LIKE '%16707-2019%'
    OR c.id_causa LIKE '%16707%2019%'
    OR a.nombre_cliente LIKE '%Carlos%Domingo%Gutierrez%Ramos%'
    OR a.rut_cliente LIKE '%84629618%'
    OR a.rut_cliente LIKE '%8.462.961-8%'
    OR a.folio = '20212'
    OR c.causa_nombre LIKE '%27%Juzgado%Civil%de%Santiago%'
    OR (c.juzgado_cuenta_id = 276 AND c.materia_estrategia_id = 3)
)
ORDER BY c.id DESC
LIMIT 50;
```

5. Haz clic en **"Continuar"** o **"Ejecutar"**

---

## 🖥️ Opción 2: Terminal MySQL

```bash
mysql -u root -p codi_ejamtest < buscar_usuario_simple.sql
```

O ejecuta directamente:

```bash
mysql -u root -p codi_ejamtest -e "
SELECT 
    c.id AS causa_id,
    c.agenda_id,
    c.id_causa AS rit,
    c.causa_nombre AS caratulado,
    a.nombre_cliente AS cliente,
    a.rut_cliente AS rut,
    a.folio
FROM causa c
LEFT JOIN agenda a ON c.agenda_id = a.id
WHERE c.id_causa LIKE '%16707-2019%'
   OR a.rut_cliente LIKE '%84629618%'
   OR a.folio = '20212'
LIMIT 10;
"
```

---

## 📝 Búsquedas Individuales

Si la búsqueda combinada no encuentra resultados, prueba estas búsquedas individuales:

### Por RIT:
```sql
SELECT * FROM causa WHERE id_causa LIKE '%16707-2019%';
```

### Por RUT:
```sql
SELECT * FROM agenda WHERE rut_cliente LIKE '%84629618%';
```

### Por Folio:
```sql
SELECT * FROM agenda WHERE folio = '20212';
```

### Por Nombre:
```sql
SELECT * FROM agenda WHERE nombre_cliente LIKE '%Carlos%Gutierrez%';
```

---

## ⚠️ Notas Importantes

1. **Formato del RIT**: El RIT puede estar almacenado de diferentes formas:
   - `"16707-2019"` (sin tipo)
   - `"C-16707-2019"` (con tipo)
   - Verifica ambos formatos

2. **RUT sin puntos**: El RUT puede estar almacenado:
   - `"8.462.961-8"` (con puntos)
   - `"84629618"` (sin puntos ni guión)
   - `"8462961-8"` (sin puntos)

3. **Folio**: El folio puede ser numérico o texto, verifica ambos

---

## 📊 Archivos Disponibles

- `buscar_usuario_simple.sql` - Query simplificada (recomendada)
- `buscar_usuario_bdd.sql` - Queries completas con todas las opciones

---

## 💡 Si No Encuentra Resultados

1. Verifica que la base de datos `codi_ejamtest` exista
2. Verifica que las tablas `causa` y `agenda` tengan datos
3. Prueba búsquedas más amplias (sin filtros tan específicos)
4. Verifica el formato exacto de los datos en la BD


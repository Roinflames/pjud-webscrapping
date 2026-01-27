# 🚀 Instrucciones Rápidas: Insertar Causa C-213-2023

## Método Rápido (SQL Directo)

### 1. Conéctate a la BD:
```bash
mysql -h 127.0.0.1 -P 3307 -u root -proot codi_ejamtest
```

### 2. Ejecuta el script SQL:
```bash
mysql -h 127.0.0.1 -P 3307 -u root -proot codi_ejamtest < scripts/insertar_causa_C-213-2023.sql
```

O copia y pega directamente en MySQL:

```sql
-- Buscar tribunal
SELECT id, nombre FROM juzgado WHERE nombre LIKE '%Iquique%';

-- Insertar causa (reemplaza TRIBUNAL_ID con el encontrado arriba)
INSERT INTO causa (
    id_causa, causa_nombre, materia_estrategia_id, 
    juzgado_cuenta_id, letra, rol, anio, estado
) VALUES (
    'C-213-2023',
    'COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI SCM/FISCO DE CHILE (CDE)',
    3, TRIBUNAL_ID, 'C', '213', 2023, 1
);
```

### 3. Verificar:
```sql
SELECT * FROM causa WHERE id_causa = 'C-213-2023';
```

## Probar Detección Automática

Una vez insertada, ejecuta:

```bash
# Opción 1: Listener (detecta nuevos registros)
npm run api:listener

# Opción 2: Worker de cola
node src/worker_cola_scraping.js

# Opción 3: Monitoreo continuo (una vez)
npm run scrape:monitoreo --once
```

El sistema debería detectar la causa y ejecutar el scraping automáticamente.

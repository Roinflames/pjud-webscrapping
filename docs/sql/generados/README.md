# 📁 SQL Generados

Este directorio contiene los archivos SQL generados automáticamente por el script de scraping.

## 📋 Información

Cada vez que se procesa una causa, se genera un archivo SQL con todos los INSERT statements correspondientes.

### Estructura de archivos:

- `movimientos_{RIT}_{timestamp}.sql` - SQL generado para cada causa procesada

### Ejemplo de nombre:

```
movimientos_C_13786_2018_2026-01-16T14-30-00.sql
```

## 🗄️ Base de Datos

Los SQL se ejecutan automáticamente contra la base de datos local (`codi_ejamtest`), y también se guardan aquí para referencia o ejecución manual posterior.

## ⚠️ Nota

Estos archivos SQL son generados automáticamente y se pueden usar para:
- Verificar qué datos se insertaron
- Re-ejecutar en caso de error
- Auditoría y respaldo


# pjud-webscrapping

## 🚀 ¿Primera vez configurando un servidor Cloud?

👉 **¿Tu servidor viene SIN cPanel/Ferozo?** → [`docs/SERVIDOR_SIN_PANEL.md`](docs/SERVIDOR_SIN_PANEL.md) ⭐  
👉 **Primeros pasos:** [`docs/PRIMEROS_PASOS_HOSTING.md`](docs/PRIMEROS_PASOS_HOSTING.md)  
👉 **Cómo conectarse por SSH:** [`docs/GUIA_PRIMERA_VEZ_SSH.md`](docs/GUIA_PRIMERA_VEZ_SSH.md)  
👉 **Configuración completa:** [`docs/GUIA_CONFIGURACION_CLOUD.md`](docs/GUIA_CONFIGURACION_CLOUD.md)
Necesitamos implementar un proceso RPA que realice los siguientes pasos:

## Paso - Ingresar al CRM y buscar un cliente: [URL]()
## Paso - Ingresar al PJUD: [URL](https://oficinajudicialvirtual.pjud.cl/home/index.php)
## Paso - Ingresar en consulta de causas: [URL](https://oficinajudicialvirtual.pjud.cl/indexN.php)
![alt text](<assets/img/Imagen de WhatsApp 2025-10-20 a las 16.04.07_eed0e425.jpg>)

Ejemplos
| Competencia  | Corte            | Tribunal                        | Libro/Tipo  | Rol  | Año  |
|--------------|------------------|---------------------------------|-------------|------|------|
| Civil        | C.A. de Santiago | 18° Juzgado Civil de Santiago   | C           | 7606 | 2022 | 
| Civil        | C.A. de Santiago | 18° Juzgado Civil de Santiago   | C           | 0000 | 0000 | folio: 24734 case_id: 34748
| Civil        | C.A. de Santiago | 18° Juzgado Civil de Santiago   | C           | 0000 | 0000 | folio: 24734 case_id: 37933

## Paso - Búsqueda de ese cliente por RIT
![alt text](<assets/img/Imagen de WhatsApp 2025-10-20 a las 16.05.41_1d314e6b.jpg>)

## Paso - Detectar cambios en el PJUD
[PJUD](https://www.pjud.cl/)
[OJV](https://oficinajudicialvirtual.pjud.cl/home/)

## Paso - Descargar EBOOK
![alt text](<assets/img/Imagen de WhatsApp 2025-10-20 a las 16.07.06_bbea00f3.jpg>)

## Paso - Insertar datos en CRM
Este paso lo realizarán Hans/Jhon

## Paso - Notificación por EMAIL


📁 Estructura recomendada del proyecto
```pgsql 
src/
  automation/
    pjud/
      index.js ✅ 6. index.js — Archivo principal
      browser.js ✅ 1. browser.js — Manejo del navegador
      navigation.js ✅ 3. navigation.js — Toda la navegación del PJUD
      extract.js ✅ 4. extract.js — Extracción de tabla de movimientos
      ebook.js ✅ 5. ebook.js — Descarga del PDF eBook
      utils.js ✅ 2. utils.js — Paths, logs y carga de JSON
  config/
    pjud_config.json
  assets/
    ebook/
logs/
.env
```

# TODO
✅ logging avanzado
✅ retry automático si falla el PJUD
✅ exportar los datos a JSON/CSV
✅ procesar múltiples RIT desde una lista
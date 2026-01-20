El problema principal es que el script `src/pdfDownloader.js` utiliza selectores HTML específicos para encontrar y hacer clic en los enlaces de descarga de PDF en el sitio web de PJUD. Dado que los sitios web cambian con frecuencia, es muy probable que estos selectores ya no sean válidos.

Como agente de IA, no puedo abrir un navegador web e interactuar visualmente con el sitio para encontrar los nuevos selectores. Necesito tu ayuda para obtener esta información.

Por favor, sigue estos pasos para ayudarme a corregir el script:

1.  **Ejecuta el scraper en modo no-headless (sin interfaz gráfica):**
    *   **Opción A (modificar temporalmente el código):** Abre `src/api/scraping-api.js`. Busca la línea donde se llama a `ejecutarScraping` y cambia `headless: !!headless` a `headless: false`. Guarda el archivo.
    *   **Opción B (modificar el comando curl):** Si estás usando el comando `curl` desde `Makefile`, puedes añadir `headless:false` al JSON del cuerpo de la solicitud, así:
        ```bash
        curl -X POST http://localhost:3000/api/scraping/ejecutar -H "Content-Type: application/json" -d '{"rit":"16707-2019","competencia":"3","corte":"90","tribunal":"276","tipoCausa":"C","headless":false}'
        ```
    *   Asegúrate de que los servicios de la API estén corriendo: `npm run services:start:win`.
    *   Ejecuta el comando `make curl` (o el `curl` modificado). Esto abrirá una ventana del navegador de Playwright.

2.  **Navega manualmente a la página de detalle de una causa:**
    *   En la ventana del navegador que se abrió (controlada por Playwright), navega a la página de detalle de una causa que sabes que tiene PDFs disponibles para descargar.

3.  **Usa las herramientas de desarrollo del navegador para inspeccionar los enlaces de PDF:**
    *   Haz clic derecho en uno de los enlaces de descarga de PDF (el botón azul o rojo) y selecciona ""Inspeccionar elemento"" o ""Inspect"".
    *   En la ventana de las herramientas de desarrollo, busca el fragmento HTML del enlace y sus elementos padres.
    *   **Copia el HTML relevante** (por ejemplo, el elemento `<a>`, `<span>` o `<div>` que contiene el enlace, junto con algunos de sus elementos padres para dar contexto).
    *   **Identifica cualquier atributo único:** Busca `id`, `class`, `data-*` atributos o funciones JavaScript en el atributo `onclick` que puedan usarse para identificar de forma única estos enlaces.

4.  **Proporcióname esta información:**
    *   Pega el fragmento de HTML que copiaste y describe cualquier detalle sobre los selectores o la lógica que creas que ha cambiado.

Con esta información específica, podré analizarla y proponerte una corrección para el script `src/pdfDownloader.js`.
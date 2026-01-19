/**
 * Datos de ejemplo para la demostración del frontend
 * Simulan la estructura real de datos del scraping
 */

module.exports = {
  getDatosEjemplo: function() {
    return {
      rit: "16707-2019",
      fecha_scraping: new Date().toISOString(),
      cabecera: {
        caratulado: "JUAN PÉREZ GONZÁLEZ con EMPRESA XYZ S.A.",
        juzgado: "1° Juzgado Civil de Santiago",
        fecha_ingreso: "15/01/2024"
      },
      estado_actual: {
        estado: "EN_TRAMITE",
        descripcion: "En trámite - Notificación",
        etapa: "NOTIFICACION",
        ultimo_movimiento: {
          fecha: "20/02/2024",
          tipo: "Notificación",
          descripcion: "Se notificó la demanda al demandado"
        },
        fecha_ultimo_movimiento: "20/02/2024"
      },
      movimientos: [
        {
          indice: 1,
          folio: "1",
          fecha: "15/01/2024",
          etapa: "Ingreso",
          tramite: "Ingreso",
          tipo_movimiento: "Ingreso",
          descripcion: "Se ingresó la causa al tribunal",
          foja: "1",
          tiene_pdf: true,
          pdf_principal: "16707_2019_mov_1_azul.pdf",
          pdf_anexo: null
        },
        {
          indice: 2,
          folio: "2",
          fecha: "16/01/2024",
          etapa: "Providencia",
          tramite: "Providencia",
          tipo_movimiento: "Providencia",
          descripcion: "Se ordenó el emplazamiento del demandado",
          foja: "2",
          tiene_pdf: true,
          pdf_principal: "16707_2019_mov_2_azul.pdf",
          pdf_anexo: null
        },
        {
          indice: 3,
          folio: "3",
          fecha: "20/02/2024",
          etapa: "Notificación",
          tramite: "Notificación",
          tipo_movimiento: "Notificación",
          descripcion: "Se notificó la demanda y su proveído al demandado conforme al artículo 44 del Código de Procedimiento Civil",
          foja: "3",
          tiene_pdf: true,
          pdf_principal: "16707_2019_mov_3_azul.pdf",
          pdf_anexo: "16707_2019_mov_3_rojo.pdf"
        },
        {
          indice: 4,
          folio: "4",
          fecha: "25/02/2024",
          etapa: "Contestación",
          tramite: "Contestación",
          tipo_movimiento: "Contestación",
          descripcion: "Se presentó contestación de la demanda",
          foja: "4",
          tiene_pdf: true,
          pdf_principal: "16707_2019_mov_4_azul.pdf",
          pdf_anexo: null
        },
        {
          indice: 5,
          folio: "5",
          fecha: "01/03/2024",
          etapa: "Audiencia",
          tramite: "Audiencia",
          tipo_movimiento: "Audiencia",
          descripcion: "Se citó a las partes a audiencia de conciliación y juicio",
          foja: "5",
          tiene_pdf: false,
          pdf_principal: null,
          pdf_anexo: null
        }
      ],
      metadata: {
        total_movimientos: 5,
        total_pdfs: 4,
        pdfs_asociados: 4
      },
      total_movimientos: 5,
      total_pdfs: 4
    };
  }
};
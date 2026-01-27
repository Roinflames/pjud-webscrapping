<?php

namespace App\Controller;

use App\Entity\Causa;
use App\Entity\Ebook;
use App\Entity\Movimiento;
use App\Entity\PDF;
use App\Form\CausaForm;
use App\Repository\CausaRepository;
use App\Repository\EbookRepository;
use App\Repository\MovimientoRepository;
use App\Repository\PDFRepository;

/**
 * Controller para manejar peticiones relacionadas con causas
 */
class CausaController
{
    private CausaRepository $causaRepository;
    private MovimientoRepository $movimientoRepository;
    private PDFRepository $pdfRepository;
    private EbookRepository $ebookRepository;

    public function __construct()
    {
        $this->causaRepository = new CausaRepository();
        $this->movimientoRepository = new MovimientoRepository();
        $this->pdfRepository = new PDFRepository();
        $this->ebookRepository = new EbookRepository();
    }

    /**
     * Maneja la petición principal
     * 
     * @param array $params Parámetros GET
     * @return void
     */
    public function handleRequest(array $params): void
    {
        header('Content-Type: application/json; charset=utf-8');

        $form = new CausaForm();
        
        if (!$form->handleRequest($params)) {
            http_response_code(400);
            echo json_encode(['error' => $form->getFirstError()], JSON_UNESCAPED_UNICODE);
            return;
        }

        try {
            if ($form->getAction() === 'pdf') {
                $this->handlePdfRequest($form);
            } else {
                $this->handleMovimientosRequest($form);
            }
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
    }

    /**
     * Maneja la petición de PDF
     */
    private function handlePdfRequest(CausaForm $form): void
    {
        $pdf = $this->pdfRepository->findByRitIndiceTipo(
            $form->getRit(),
            $form->getIndice(),
            $form->getTipo()
        );

        if (!$pdf) {
            http_response_code(404);
            echo json_encode(['error' => 'PDF no encontrado'], JSON_UNESCAPED_UNICODE);
            return;
        }

        if ($form->getFormat() === 'download') {
            // Enviar como archivo PDF para descarga
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . $pdf->getNombreArchivo() . '"');
            echo base64_decode($pdf->getContenidoBase64());
            return;
        }

        // Devolver como JSON
        echo json_encode([
            'nombre' => $pdf->getNombreArchivo(),
            'base64' => $pdf->getContenidoBase64(),
            'tamano' => $pdf->getTamanoBytes()
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Maneja la petición de movimientos
     */
    private function handleMovimientosRequest(CausaForm $form): void
    {
        $rit = $form->getRit();
        $includePdfs = $form->getIncludePdfs();

        // Obtener información de la causa
        $causa = $this->causaRepository->findByRit($rit);
        
        if (!$causa) {
            http_response_code(404);
            echo json_encode(['error' => 'No se encontró la causa en la base de datos'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // Obtener movimientos
        $movimientos = $this->movimientoRepository->findByRit($rit, $includePdfs);

        if (empty($movimientos)) {
            http_response_code(404);
            echo json_encode(['error' => 'No se encontraron movimientos para este RIT en la base de datos'], JSON_UNESCAPED_UNICODE);
            return;
        }

        // Obtener ebook si existe
        $ebook = $this->ebookRepository->findByRit($rit);

        // Obtener cuadernos
        $cuadernos = $this->movimientoRepository->getCuadernosByRit($rit);

        // Formatear respuesta
        $response = $this->formatResponse($causa, $movimientos, $cuadernos, $ebook, $includePdfs);

        echo json_encode($response, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Formatea la respuesta con los datos de la causa
     */
    private function formatResponse(
        Causa $causa,
        array $movimientos,
        array $cuadernos,
        ?Ebook $ebook,
        bool $includePdfs
    ): array {
        // Formato legacy para compatibilidad
        $movimientosLegacy = [];
        $cabecera = [
            '',
            $causa->getRit(),
            $causa->getFechaIngreso() ?? '',
            $causa->getCaratulado() ?? '',
            $causa->getTribunalNombre() ?? ''
        ];

        // Formato detallado
        $movimientosDetallados = [];
        $pdfs = [];
        $totalPdfs = 0;

        foreach ($movimientos as $mov) {
            $movArray = $mov->toArray();

            // Formato legacy (9 elementos por fila)
            $movimientosLegacy[] = [
                $mov->getFolio() ?? '',
                $mov->getTienePdf() ? 'Descargar Documento' : '',
                $mov->getFolio() ?? '',
                $mov->getEtapa() ?? '',
                $mov->getTramite() ?? '',
                $mov->getDescripcion() ?? '',
                $mov->getFecha() ?? '',
                $mov->getFoja() ?? '',
                '' // Georef
            ];

            // Contar PDFs
            if ($mov->getPdfPrincipal()) {
                $totalPdfs++;
                if ($includePdfs && $mov->getPdfPrincipal()['base64']) {
                    $pdfs[$mov->getPdfPrincipal()['nombre']] = $mov->getPdfPrincipal()['base64'];
                }
            }
            if ($mov->getPdfAnexo()) {
                $totalPdfs++;
                if ($includePdfs && $mov->getPdfAnexo()['base64']) {
                    $pdfs[$mov->getPdfAnexo()['nombre']] = $mov->getPdfAnexo()['base64'];
                }
            }

            $movimientosDetallados[] = $movArray;
        }

        array_unshift($movimientosLegacy, [], $cabecera);

        $response = [
            'legacy' => $movimientosLegacy,
            'causa' => [
                'rit' => $causa->getRit(),
                'caratulado' => $causa->getCaratulado() ?? '',
                'tribunal' => $causa->getTribunalNombre() ?? '',
                'fecha_ingreso' => $causa->getFechaIngreso() ?? '',
                'estado' => $causa->getEstado() ?? 'SIN_INFORMACION',
                'etapa' => $causa->getEtapa() ?? '',
                'total_movimientos' => $causa->getTotalMovimientos() ?: count($movimientosDetallados),
                'total_pdfs' => $causa->getTotalPdfs() ?: $totalPdfs
            ],
            'cuadernos' => $cuadernos,
            'ebook' => $ebook ? [
                'nombre' => $ebook->getNombreArchivo(),
                'ruta' => $ebook->getRutaRelativa(),
                'tamano' => $ebook->getTamanoBytes(),
                'descargado' => $ebook->getDescargado()
            ] : null,
            'movimientos' => $movimientosDetallados,
            'ultimo_movimiento' => !empty($movimientosDetallados) ? $movimientosDetallados[0]['fecha'] ?? null : null
        ];

        if ($includePdfs && count($pdfs) > 0) {
            $response['pdfs'] = $pdfs;
        }

        return $response;
    }
}

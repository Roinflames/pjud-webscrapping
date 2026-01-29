<?php

namespace App\Controller;

use App\Repository\CausaRepository;
use App\Repository\MovimientoRepository;
use App\Repository\PDFRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Annotation\Route;

class CausaController extends AbstractController
{
    /**
     * @Route("/", name="home")
     * @Route("/demo", name="demo")
     */
    public function index(CausaRepository $causaRepository): Response
    {
        try {
            $causas = $causaRepository->findAll();
            $estadisticas = $causaRepository->getEstadisticas();

            return $this->render('demo/index.html.twig', [
                'causas' => $causas,
                'estadisticas' => $estadisticas,
                'error' => null
            ]);
        } catch (\Exception $e) {
            return $this->render('demo/index.html.twig', [
                'causas' => [],
                'estadisticas' => [],
                'error' => 'Error de conexión a la base de datos: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * @Route("/causa/{rit}", name="causa_detalle", methods={"GET"})
     */
    public function detalle(
        string $rit,
        CausaRepository $causaRepository,
        MovimientoRepository $movimientoRepository,
        PDFRepository $pdfRepository
    ): JsonResponse
    {
        try {
            $causa = $causaRepository->findByRit($rit);

            if (!$causa) {
                return $this->json(['error' => 'Causa no encontrada'], 404);
            }

            $movimientos = $movimientoRepository->findByRit($rit);
            $cuadernos = $movimientoRepository->getCuadernosByRit($rit);
            $etapas = $movimientoRepository->getEtapasByRit($rit);

            // Formatear movimientos con información de PDFs desde tabla pdfs
            $movimientosData = array_map(function($mov) use ($pdfRepository) {
                // Consultar PDFs desde tabla pdfs por movimiento_id
                $pdfs = $pdfRepository->findBy(['movimientoId' => $mov->getId()]);

                $pdfAzul = null;
                $pdfRojo = null;

                foreach ($pdfs as $pdf) {
                    $tipo = strtolower($pdf->getTipo() ?? '');
                    if ($tipo === 'azul' || $tipo === 'principal') {
                        $pdfAzul = $pdf->getNombreArchivo();
                    } elseif ($tipo === 'rojo' || $tipo === 'anexo') {
                        $pdfRojo = $pdf->getNombreArchivo();
                    }
                }

                $tienePdfAzul = !empty($pdfAzul);
                $tienePdfRojo = !empty($pdfRojo);

                return [
                    'id' => $mov->getId(),
                    'indice' => $mov->getIndice(),
                    'cuaderno' => $mov->getCuaderno(),
                    'etapa' => $mov->getEtapa(),
                    'tramite' => $mov->getTramite(),
                    'descripcion' => $mov->getDescripcion(),
                    'fecha' => $mov->getFecha(),
                    'foja' => $mov->getFoja(),
                    'folio' => $mov->getFolio(),
                    'tiene_pdf_azul' => $tienePdfAzul,
                    'tiene_pdf_rojo' => $tienePdfRojo,
                    'pdf_azul' => $pdfAzul,
                    'pdf_rojo' => $pdfRojo,
                ];
            }, $movimientos);

            return $this->json([
                'causa' => [
                    'rit' => $causa->getRit(),
                    'caratulado' => $causa->getCaratulado(),
                    'tribunal' => $causa->getTribunalNombre(),
                    'fecha_ingreso' => $causa->getFechaIngreso(),
                    'estado' => $causa->getEstado() ?: 'SIN_INFORMACION',
                    'etapa' => $causa->getEtapa(),
                    'total_movimientos' => $causa->getTotalMovimientos(),
                    'total_pdfs' => $causa->getTotalPdfs(),
                ],
                'movimientos' => $movimientosData,
                'cuadernos' => $cuadernos,
                'etapas' => $etapas,
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error al obtener detalle: ' . $e->getMessage()], 500);
        }
    }

    /**
     * @Route("/pdf/{rit}/{movimientoId}/{tipo}", name="pdf_download", defaults={"tipo"="PRINCIPAL"})
     */
    public function descargarPdf(
        string $rit,
        int $movimientoId,
        string $tipo,
        PDFRepository $pdfRepository
    ): Response
    {
        try {
            $pdf = $pdfRepository->findByRitAndMovimiento($rit, $movimientoId, strtoupper($tipo));

            if (!$pdf || !$pdf->getContenidoBase64()) {
                return new Response('PDF no encontrado', 404);
            }

            $contenido = base64_decode($pdf->getContenidoBase64());

            $response = new Response($contenido);
            $response->headers->set('Content-Type', 'application/pdf');
            $response->headers->set('Content-Disposition', 'inline; filename="' . $pdf->getNombreArchivo() . '"');
            $response->headers->set('Content-Length', strlen($contenido));

            return $response;
        } catch (\Exception $e) {
            return new Response('Error al descargar PDF: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @Route("/buscar", name="causa_buscar", methods={"GET"})
     */
    public function buscar(CausaRepository $causaRepository): JsonResponse
    {
        $rit = $_GET['rit'] ?? null;
        $caratulado = $_GET['caratulado'] ?? null;
        $tribunal = $_GET['tribunal'] ?? null;

        try {
            $causas = $causaRepository->searchCausas($rit, $caratulado, $tribunal);

            $causasData = array_map(function($causa) {
                return [
                    'rit' => $causa->getRit(),
                    'caratulado' => $causa->getCaratulado(),
                    'tribunal' => $causa->getTribunalNombre(),
                    'fecha_ingreso' => $causa->getFechaIngreso(),
                    'estado' => $causa->getEstado(),
                    'total_pdfs' => $causa->getTotalPdfs(),
                ];
            }, $causas);

            return $this->json([
                'causas' => $causasData,
                'total' => count($causasData)
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error en búsqueda: ' . $e->getMessage()], 500);
        }
    }
}

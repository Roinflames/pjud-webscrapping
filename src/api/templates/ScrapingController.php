<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpClient\HttpClient;

/**
 * Controlador Symfony para visualizar movimientos del PJUD
 * 
 * Configuración requerida:
 * 1. Agregar ruta en config/routes.yaml o anotaciones
 * 2. Configurar URL de la API en .env: API_SCRAPING_URL=http://localhost:3000
 * 3. Configurar token en .env: API_SCRAPING_TOKEN=tu_token
 */
class ScrapingController extends AbstractController
{
    private $apiUrl;
    private $apiToken;

    public function __construct()
    {
        // Obtener configuración desde .env o parámetros
        $this->apiUrl = $_ENV['API_SCRAPING_URL'] ?? 'http://localhost:3000';
        $this->apiToken = $_ENV['API_SCRAPING_TOKEN'] ?? '';
    }

    /**
     * @Route("/scraping/movimientos/{rit}", name="scraping_movimientos")
     */
    public function mostrarMovimientos(string $rit): Response
    {
        try {
            // Obtener datos desde la API
            $client = HttpClient::create();
            $url = sprintf('%s/api/scraping/resultado/%s', $this->apiUrl, $rit);
            
            $response = $client->request('GET', $url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiToken,
                    'Accept' => 'application/json'
                ]
            ]);

            if ($response->getStatusCode() !== 200) {
                throw new \Exception('Error obteniendo datos: ' . $response->getContent(false));
            }

            $data = $response->toArray();
            $resultado = $data['resultado'] ?? [];

            // Separar PDFs para pasarlos a la vista
            $pdfs = $resultado['pdfs'] ?? [];
            
            // Remover PDFs del resultado principal para no enviarlos a la vista (son muy grandes)
            $resultadoSinPdfs = $resultado;
            unset($resultadoSinPdfs['pdfs']);

            return $this->render('scraping/movimientos.html.twig', [
                'resultado' => $resultadoSinPdfs,
                'pdfs' => $pdfs,
                'rit' => $rit
            ]);

        } catch (\Exception $e) {
            return $this->render('scraping/error.html.twig', [
                'error' => $e->getMessage(),
                'rit' => $rit
            ]);
        }
    }

    /**
     * @Route("/scraping/ejecutar", name="scraping_ejecutar", methods={"POST"})
     */
    public function ejecutarScraping(Request $request): Response
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            // Validar campos requeridos
            $camposRequeridos = ['rit', 'competencia', 'corte', 'tribunal', 'tipoCausa'];
            foreach ($camposRequeridos as $campo) {
                if (empty($data[$campo])) {
                    return new Response(json_encode([
                        'error' => 'Campo requerido faltante: ' . $campo
                    ]), 400, ['Content-Type' => 'application/json']);
                }
            }

            // Llamar a la API
            $client = HttpClient::create();
            $url = $this->apiUrl . '/api/scraping/ejecutar';
            
            $response = $client->request('POST', $url, [
                'headers' => [
                    'Content-Type' => 'application/json'
                ],
                'json' => $data
            ]);

            return new Response($response->getContent(), $response->getStatusCode(), [
                'Content-Type' => 'application/json'
            ]);

        } catch (\Exception $e) {
            return new Response(json_encode([
                'error' => $e->getMessage()
            ]), 500, ['Content-Type' => 'application/json']);
        }
    }

    /**
     * @Route("/scraping/listar", name="scraping_listar")
     */
    public function listarRITs(): Response
    {
        try {
            $client = HttpClient::create();
            $url = $this->apiUrl . '/api/scraping/listar';
            
            $response = $client->request('GET', $url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiToken,
                    'Accept' => 'application/json'
                ]
            ]);

            $data = $response->toArray();

            return $this->render('scraping/listar.html.twig', [
                'rits' => $data['rits'] ?? [],
                'total' => $data['total'] ?? 0
            ]);

        } catch (\Exception $e) {
            return $this->render('scraping/error.html.twig', [
                'error' => $e->getMessage()
            ]);
        }
    }
}
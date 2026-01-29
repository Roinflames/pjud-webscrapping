<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Annotation\Route;

class ScraperController extends AbstractController
{
    /**
     * @Route("/scraper/run/{rit}", name="scraper_run", methods={"POST"})
     */
    public function runScraper(string $rit): JsonResponse
    {
        $projectRoot = dirname(__DIR__, 3);
        $scriptPath = $projectRoot . '/src/scrape-single.js';
        $nodeScriptPath = $projectRoot . '/src/process-causas.js';

        // Verificar que el script existe
        if (!file_exists($nodeScriptPath)) {
            return $this->json(['error' => 'Script de scraping no encontrado'], 500);
        }

        // Crear archivo temporal para el log
        $logFile = sys_get_temp_dir() . '/scraping_' . str_replace('-', '_', $rit) . '_' . time() . '.log';

        // Ejecutar el scraping en background
        $cmd = sprintf(
            'cd %s && node %s --rit=%s > %s 2>&1 &',
            escapeshellarg($projectRoot),
            escapeshellarg($nodeScriptPath),
            escapeshellarg($rit),
            escapeshellarg($logFile)
        );

        exec($cmd);

        return $this->json([
            'success' => true,
            'rit' => $rit,
            'logFile' => $logFile,
            'message' => 'Scraping iniciado'
        ]);
    }

    /**
     * @Route("/scraper/stream/{rit}", name="scraper_stream", methods={"GET"})
     */
    public function streamProgress(string $rit): StreamedResponse
    {
        $response = new StreamedResponse();
        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        $response->headers->set('X-Accel-Buffering', 'no');

        $response->setCallback(function() use ($rit) {
            $projectRoot = dirname(__DIR__, 3);
            $scriptPath = $projectRoot . '/src/scrape-single.js';

            // Construir comando
            $cmd = sprintf(
                'cd %s && node %s --rit=%s 2>&1',
                escapeshellarg($projectRoot),
                escapeshellarg($scriptPath),
                escapeshellarg($rit)
            );

            // Abrir proceso
            $descriptors = [
                0 => ['pipe', 'r'], // stdin
                1 => ['pipe', 'w'], // stdout
                2 => ['pipe', 'w']  // stderr
            ];

            $process = proc_open($cmd, $descriptors, $pipes);

            if (!is_resource($process)) {
                echo "data: " . json_encode(['error' => 'No se pudo iniciar el proceso']) . "\n\n";
                flush();
                return;
            }

            stream_set_blocking($pipes[1], false);
            stream_set_blocking($pipes[2], false);

            $buffer = '';
            $progress = 0;

            while (!feof($pipes[1]) || !feof($pipes[2])) {
                $stdout = fgets($pipes[1], 4096);
                $stderr = fgets($pipes[2], 4096);

                if ($stdout !== false) {
                    $buffer .= $stdout;

                    // Parsear líneas completas
                    while (($pos = strpos($buffer, "\n")) !== false) {
                        $line = substr($buffer, 0, $pos);
                        $buffer = substr($buffer, $pos + 1);

                        if (trim($line) === '') continue;

                        // Detectar progreso
                        $progressData = $this->parseProgressLine($line, $progress);

                        echo "data: " . json_encode($progressData) . "\n\n";
                        flush();

                        $progress = $progressData['progress'];
                    }
                }

                if ($stderr !== false && trim($stderr) !== '') {
                    echo "data: " . json_encode(['type' => 'error', 'message' => $stderr]) . "\n\n";
                    flush();
                }

                usleep(100000); // 100ms
            }

            fclose($pipes[1]);
            fclose($pipes[2]);
            proc_close($process);

            echo "data: " . json_encode(['type' => 'complete', 'progress' => 100]) . "\n\n";
            flush();
        });

        return $response;
    }

    /**
     * @Route("/scraper/status", name="scraper_status", methods={"GET"})
     */
    public function getSchedulerStatus(): JsonResponse
    {
        $statusFile = sys_get_temp_dir() . '/pjud_scheduler_status.json';

        if (!file_exists($statusFile)) {
            return $this->json([
                'running' => false,
                'message' => 'Scheduler no iniciado'
            ]);
        }

        $status = json_decode(file_get_contents($statusFile), true);

        return $this->json($status);
    }

    private function parseProgressLine(string $line, int $currentProgress): array
    {
        $line = trim($line);

        // Emojis y patrones conocidos
        if (strpos($line, '🌐 Navegando a:') !== false) {
            return ['type' => 'info', 'message' => 'Iniciando navegador...', 'progress' => 5];
        }

        if (strpos($line, '📝 Llenando formulario') !== false) {
            return ['type' => 'info', 'message' => 'Llenando formulario de búsqueda...', 'progress' => 15];
        }

        if (strpos($line, '🔍 Buscando...') !== false) {
            return ['type' => 'info', 'message' => 'Buscando causa en PJUD...', 'progress' => 25];
        }

        if (strpos($line, '🔄 Abriendo modal de detalle') !== false || strpos($line, '🔍 Abriendo modal') !== false) {
            return ['type' => 'info', 'message' => 'Abriendo detalle de la causa...', 'progress' => 35];
        }

        if (strpos($line, '📊 Extrayendo tabla') !== false) {
            return ['type' => 'info', 'message' => 'Extrayendo movimientos...', 'progress' => 50];
        }

        if (strpos($line, '📄 Descargando PDFs') !== false || strpos($line, '⬇️ Descargando PDF') !== false) {
            return ['type' => 'info', 'message' => 'Descargando PDFs...', 'progress' => 65];
        }

        if (strpos($line, '💾 Guardando en base de datos') !== false) {
            return ['type' => 'info', 'message' => 'Guardando en base de datos...', 'progress' => 85];
        }

        if (strpos($line, '✅ Datos guardados en MySQL') !== false) {
            return ['type' => 'success', 'message' => 'Datos guardados correctamente', 'progress' => 100];
        }

        if (strpos($line, '⚠️') !== false || strpos($line, 'Error') !== false) {
            return ['type' => 'warning', 'message' => $line, 'progress' => $currentProgress];
        }

        // Línea genérica
        return ['type' => 'log', 'message' => $line, 'progress' => $currentProgress];
    }
}

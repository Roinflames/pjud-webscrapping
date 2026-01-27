<?php

namespace App\Repository;

use App\Config\Database;
use App\Entity\PDF;
use PDO;

/**
 * Repository para operaciones con la entidad PDF
 */
class PDFRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getConnection();
    }

    /**
     * Busca un PDF por RIT, índice y tipo
     * 
     * @param string $rit
     * @param int $indice
     * @param string $tipo 'principal' | 'anexo'
     * @return PDF|null
     */
    public function findByRitIndiceTipo(string $rit, int $indice, string $tipo): ?PDF
    {
        $stmt = $this->pdo->prepare("
            SELECT nombre_archivo, contenido_base64, tamano_bytes
            FROM movimientos_pdf
            WHERE rit = :rit AND indice = :indice AND tipo = :tipo
        ");
        
        $stmt->execute([
            'rit' => $rit,
            'indice' => $indice,
            'tipo' => $tipo
        ]);
        
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            return null;
        }

        $pdf = new PDF();
        $pdf->setRit($rit);
        $pdf->setIndice($indice);
        $pdf->setTipo($tipo);
        $pdf->setNombreArchivo($data['nombre_archivo'] ?? null);
        $pdf->setContenidoBase64($data['contenido_base64'] ?? null);
        $pdf->setTamanoBytes($data['tamano_bytes'] ?? null);

        return $pdf;
    }

    /**
     * Obtiene todos los PDFs de un movimiento
     * 
     * @param int $movimientoId
     * @return PDF[]
     */
    public function findByMovimientoId(int $movimientoId): array
    {
        $stmt = $this->pdo->prepare("
            SELECT id, movimiento_id, rit, indice, tipo, nombre_archivo, contenido_base64, tamano_bytes
            FROM pdfs
            WHERE movimiento_id = :movimiento_id
        ");
        
        $stmt->execute(['movimiento_id' => $movimientoId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $pdfs = [];
        foreach ($rows as $row) {
            $pdfs[] = PDF::fromArray($row);
        }

        return $pdfs;
    }
}

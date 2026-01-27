<?php

namespace App\Repository;

use App\Config\Database;
use App\Entity\Ebook;
use PDO;

/**
 * Repository para operaciones con la entidad Ebook
 */
class EbookRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getConnection();
    }

    /**
     * Busca un ebook por RIT de la causa
     * 
     * @param string $rit
     * @return Ebook|null
     */
    public function findByRit(string $rit): ?Ebook
    {
        $stmt = $this->pdo->prepare("
            SELECT
                e.nombre_archivo,
                e.ruta_relativa,
                e.tamano_bytes,
                e.descargado
            FROM ebooks e
            JOIN causas c ON e.causa_id = c.id
            WHERE c.rit = :rit
            LIMIT 1
        ");
        
        $stmt->execute(['rit' => $rit]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            return null;
        }

        return Ebook::fromArray($data);
    }
}

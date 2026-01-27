<?php

namespace App\Repository;

use App\Config\Database;
use App\Entity\Causa;
use PDO;
use PDOException;

/**
 * Repository para operaciones con la entidad Causa
 */
class CausaRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getConnection();
    }

    /**
     * Busca una causa por RIT
     * 
     * @param string $rit
     * @return Causa|null
     */
    public function findByRit(string $rit): ?Causa
    {
        $stmt = $this->pdo->prepare("
            SELECT
                c.rit,
                c.caratulado,
                c.tribunal_nombre,
                c.fecha_ingreso,
                c.estado,
                c.etapa,
                c.total_movimientos,
                c.total_pdfs
            FROM causas c
            WHERE c.rit = :rit
        ");
        
        $stmt->execute(['rit' => $rit]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            return null;
        }

        return Causa::fromArray($data);
    }

    /**
     * Obtiene todas las causas ordenadas por fecha de creación
     * 
     * @return Causa[]
     */
    public function findAll(): array
    {
        $stmt = $this->pdo->query("
            SELECT
                c.id,
                c.rit,
                c.caratulado,
                c.tribunal_nombre,
                c.fecha_ingreso,
                c.estado,
                c.total_movimientos,
                c.total_pdfs
            FROM causas c
            ORDER BY c.created_at DESC
        ");

        $results = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $results[] = Causa::fromArray($row);
        }

        return $results;
    }
}

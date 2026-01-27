<?php

namespace App\Repository;

use App\Config\Database;
use App\Entity\Movimiento;
use PDO;
use PDOException;

/**
 * Repository para operaciones con la entidad Movimiento
 */
class MovimientoRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getConnection();
    }

    /**
     * Busca todos los movimientos de una causa por RIT
     *
     * @param string $rit
     * @param bool $includePdfs Si true, incluye informaci�n de PDFs disponibles
     * @return Movimiento[]
     */
    public function findByRit(string $rit, bool $includePdfs = true): array
    {
        if ($includePdfs) {
            $stmt = $this->pdo->prepare("
                SELECT
                    m.id,
                    m.rit,
                    m.folio,
                    m.fecha,
                    m.etapa,
                    m.tramite,
                    m.descripcion,
                    m.foja,
                    (SELECT COUNT(*) FROM pdfs p WHERE p.movimiento_id = m.id AND p.tipo = 'azul') > 0 as tiene_pdf_azul,
                    (SELECT COUNT(*) FROM pdfs p WHERE p.movimiento_id = m.id AND p.tipo = 'rojo') > 0 as tiene_pdf_rojo,
                    (SELECT nombre_archivo FROM pdfs p WHERE p.movimiento_id = m.id AND p.tipo = 'azul' LIMIT 1) as pdf_azul,
                    (SELECT nombre_archivo FROM pdfs p WHERE p.movimiento_id = m.id AND p.tipo = 'rojo' LIMIT 1) as pdf_rojo
                FROM movimientos m
                WHERE m.rit = :rit
                ORDER BY m.folio ASC
            ");
        } else {
            $stmt = $this->pdo->prepare("
                SELECT id, rit, folio, fecha, etapa, tramite, descripcion, foja
                FROM movimientos m
                WHERE m.rit = :rit
                ORDER BY m.folio ASC
            ");
        }

        $stmt->execute(['rit' => $rit]);

        $results = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Ajustar nombres de campos para que coincidan con la entidad
            if (isset($row['tiene_pdf_azul'])) {
                $row['tiene_pdf'] = $row['tiene_pdf_azul'] || $row['tiene_pdf_rojo'];
            }
            if (isset($row['id_cuaderno'])) {
                $row['cuaderno_id'] = $row['id_cuaderno'];
            }
            if (isset($row['nombre'])) {
                $row['cuaderno'] = $row['nombre'];
            }

            $results[] = Movimiento::fromArray($row);
        }

        return $results;
    }

    /**
     * Obtiene los cuadernos distintos de una causa
     *
     * @param string $rit
     * @return array Array con id_cuaderno y nombre
     */
    public function getCuadernosByRit(string $rit): array
    {
        // Verificar si existe la columna id_cuaderno
        try {
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT id_cuaderno, cuaderno_nombre as nombre
                FROM movimientos
                WHERE rit = :rit AND id_cuaderno IS NOT NULL
                ORDER BY id_cuaderno
            ");
            $stmt->execute(['rit' => $rit]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            // Si falla (columna no existe), retornar array vacío
            return [];
        }
    }

    /**
     * Busca un movimiento espec�fico por RIT y folio
     *
     * @param string $rit
     * @param string $folio
     * @return Movimiento|null
     */
    public function findByRitAndFolio(string $rit, string $folio): ?Movimiento
    {
        $stmt = $this->pdo->prepare("
            SELECT
                m.*,
                (SELECT COUNT(*) FROM pdfs p WHERE p.movimiento_id = m.id AND p.tipo = 'azul') > 0 as tiene_pdf_azul,
                (SELECT COUNT(*) FROM pdfs p WHERE p.movimiento_id = m.id AND p.tipo = 'rojo') > 0 as tiene_pdf_rojo,
                (SELECT nombre_archivo FROM pdfs p WHERE p.movimiento_id = m.id AND p.tipo = 'azul' LIMIT 1) as pdf_azul,
                (SELECT nombre_archivo FROM pdfs p WHERE p.movimiento_id = m.id AND p.tipo = 'rojo' LIMIT 1) as pdf_rojo
            FROM movimientos m
            WHERE m.rit = :rit AND m.folio = :folio
            LIMIT 1
        ");

        $stmt->execute(['rit' => $rit, 'folio' => $folio]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            return null;
        }

        // Ajustar nombres de campos
        $data['tiene_pdf'] = $data['tiene_pdf_azul'] || $data['tiene_pdf_rojo'];
        if (isset($data['id_cuaderno'])) {
            $data['cuaderno_id'] = $data['id_cuaderno'];
        }
        if (isset($data['nombre'])) {
            $data['cuaderno'] = $data['nombre'];
        }

        return Movimiento::fromArray($data);
    }

    /**
     * Cuenta los movimientos de una causa
     *
     * @param string $rit
     * @return int
     */
    public function countByRit(string $rit): int
    {
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as total
            FROM movimientos
            WHERE rit = :rit
        ");

        $stmt->execute(['rit' => $rit]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return (int)($result['total'] ?? 0);
    }
}

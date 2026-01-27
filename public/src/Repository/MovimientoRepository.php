<?php

namespace App\Repository;

use App\Config\Database;
use App\Entity\Movimiento;
use PDO;

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
     * Busca movimientos por RIT
     * 
     * @param string $rit
     * @param bool $includePdfs Si incluir PDFs en base64
     * @return Movimiento[]
     */
    public function findByRit(string $rit, bool $includePdfs = false): array
    {
        if ($includePdfs) {
            // Consulta con PDFs en base64
            $stmt = $this->pdo->prepare("
                SELECT
                    m.folio,
                    m.tiene_pdf,
                    m.etapa,
                    m.tramite,
                    m.descripcion,
                    m.fecha,
                    m.foja,
                    m.indice,
                    m.cuaderno,
                    m.cuaderno_id,
                    m.pdf_azul,
                    m.pdf_rojo,
                    pp.contenido_base64 AS pdf_principal_base64,
                    pp.nombre_archivo AS pdf_principal_nombre,
                    pa.contenido_base64 AS pdf_anexo_base64,
                    pa.nombre_archivo AS pdf_anexo_nombre
                FROM movimientos m
                LEFT JOIN pdfs pp ON m.id = pp.movimiento_id AND pp.tipo = 'PRINCIPAL'
                LEFT JOIN pdfs pa ON m.id = pa.movimiento_id AND pa.tipo = 'ANEXO'
                WHERE m.rit = :rit
                ORDER BY m.indice DESC
            ");
        } else {
            // Consulta sin PDFs (más rápida)
            $stmt = $this->pdo->prepare("
                SELECT
                    m.folio,
                    m.tiene_pdf,
                    m.etapa,
                    m.tramite,
                    m.descripcion,
                    m.fecha,
                    m.foja,
                    m.indice,
                    m.cuaderno,
                    m.cuaderno_id,
                    m.pdf_azul,
                    m.pdf_rojo,
                    pp.nombre_archivo AS pdf_principal_nombre,
                    pa.nombre_archivo AS pdf_anexo_nombre
                FROM movimientos m
                LEFT JOIN pdfs pp ON m.id = pp.movimiento_id AND pp.tipo = 'PRINCIPAL'
                LEFT JOIN pdfs pa ON m.id = pa.movimiento_id AND pa.tipo = 'ANEXO'
                WHERE m.rit = :rit
                ORDER BY m.indice DESC
            ");
        }

        $stmt->execute(['rit' => $rit]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $movimientos = [];
        foreach ($rows as $row) {
            $movimiento = Movimiento::fromArray([
                'rit' => $rit,
                'folio' => $row['folio'] ?? '',
                'tiene_pdf' => (bool)($row['tiene_pdf'] ?? false),
                'etapa' => $row['etapa'] ?? '',
                'tramite' => $row['tramite'] ?? '',
                'descripcion' => $row['descripcion'] ?? '',
                'fecha' => $row['fecha'] ?? '',
                'foja' => $row['foja'] ?? '',
                'indice' => $row['indice'] ?? null,
                'cuaderno' => $row['cuaderno'] ?? 'Principal',
                'cuaderno_id' => $row['cuaderno_id'] ?? '1',
                'pdf_azul' => $row['pdf_azul'] ?? null,
                'pdf_rojo' => $row['pdf_rojo'] ?? null
            ]);

            // Agregar información de PDFs si está disponible
            if (!empty($row['pdf_principal_nombre'])) {
                $movimiento->setPdfPrincipal([
                    'nombre' => $row['pdf_principal_nombre'],
                    'base64' => $includePdfs ? ($row['pdf_principal_base64'] ?? null) : null
                ]);
            }
            if (!empty($row['pdf_anexo_nombre'])) {
                $movimiento->setPdfAnexo([
                    'nombre' => $row['pdf_anexo_nombre'],
                    'base64' => $includePdfs ? ($row['pdf_anexo_base64'] ?? null) : null
                ]);
            }

            $movimientos[] = $movimiento;
        }

        return $movimientos;
    }

    /**
     * Obtiene cuadernos únicos para un RIT
     * 
     * @param string $rit
     * @return array
     */
    public function getCuadernosByRit(string $rit): array
    {
        $movimientos = $this->findByRit($rit);
        $cuadernos = [];

        foreach ($movimientos as $mov) {
            $cuadId = $mov->getCuadernoId();
            if (!isset($cuadernos[$cuadId])) {
                $cuadernos[$cuadId] = [
                    'id' => $cuadId,
                    'nombre' => $mov->getCuaderno(),
                    'total_movimientos' => 0
                ];
            }
            $cuadernos[$cuadId]['total_movimientos']++;
        }

        return array_values($cuadernos);
    }
}

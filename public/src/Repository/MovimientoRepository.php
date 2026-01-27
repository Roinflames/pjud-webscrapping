<?php

namespace App\Repository;

use App\Config\Database;
use App\Entity\Movimiento;
use PDO;

/**
 * Repository para operaciones con la entidad Movimiento
 *
 * Lee directamente desde MySQL (tablas `movimientos` y `pdfs`)
 * y arma objetos Movimiento con la información necesaria para el front `/demo`.
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
     * @param bool   $includePdfs Si incluir PDFs en base64 (para respuestas más pesadas)
     *
     * @return Movimiento[]
     */
    public function findByRit(string $rit, bool $includePdfs = false): array
    {
        if ($includePdfs) {
            // Consulta con PDFs en base64 (JOIN a tabla `pdfs`)
            $stmt = $this->pdo->prepare("
                SELECT
                    m.id,
                    m.rit,
                    m.folio,
                    m.tiene_pdf,
                    m.etapa,
                    m.tramite,
                    m.descripcion,
                    m.fecha,
                    m.foja,
                    m.indice,
                    m.pdf_principal AS pdf_azul,
                    m.pdf_anexo    AS pdf_rojo,
                    pp.contenido_base64 AS pdf_principal_base64,
                    pp.nombre_archivo   AS pdf_principal_nombre,
                    pa.contenido_base64 AS pdf_anexo_base64,
                    pa.nombre_archivo   AS pdf_anexo_nombre
                FROM movimientos m
                LEFT JOIN pdfs pp 
                    ON m.id = pp.movimiento_id AND pp.tipo = 'PRINCIPAL'
                LEFT JOIN pdfs pa 
                    ON m.id = pa.movimiento_id AND pa.tipo = 'ANEXO'
                WHERE m.rit = :rit
                ORDER BY m.indice DESC
            ");
        } else {
            // Consulta sin base64 (solo nombres, más liviana)
            $stmt = $this->pdo->prepare("
                SELECT
                    m.id,
                    m.rit,
                    m.folio,
                    m.tiene_pdf,
                    m.etapa,
                    m.tramite,
                    m.descripcion,
                    m.fecha,
                    m.foja,
                    m.indice,
                    m.pdf_principal AS pdf_azul,
                    m.pdf_anexo    AS pdf_rojo,
                    pp.nombre_archivo AS pdf_principal_nombre,
                    pa.nombre_archivo AS pdf_anexo_nombre
                FROM movimientos m
                LEFT JOIN pdfs pp 
                    ON m.id = pp.movimiento_id AND pp.tipo = 'PRINCIPAL'
                LEFT JOIN pdfs pa 
                    ON m.id = pa.movimiento_id AND pa.tipo = 'ANEXO'
                WHERE m.rit = :rit
                ORDER BY m.indice DESC
            ");
        }

        $stmt->execute(['rit' => $rit]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $movimientos = [];

        foreach ($rows as $row) {
            // Construir entidad Movimiento básica
            $movimiento = Movimiento::fromArray([
                'id'          => $row['id'] ?? null,
                'rit'         => $row['rit'] ?? $rit,
                'folio'       => $row['folio'] ?? null,
                'tiene_pdf'   => (bool)($row['tiene_pdf'] ?? false),
                'etapa'       => $row['etapa'] ?? null,
                'tramite'     => $row['tramite'] ?? null,
                'descripcion' => $row['descripcion'] ?? null,
                'fecha'       => $row['fecha'] ?? null,
                'foja'        => $row['foja'] ?? null,
                'indice'      => $row['indice'] ?? null,
                'cuaderno'    => 'Principal', // Por defecto (columna no existe en BD)
                'cuaderno_id' => '1', // Por defecto (columna no existe en BD)
                'pdf_azul'    => $row['pdf_azul'] ?? null,
                'pdf_rojo'    => $row['pdf_rojo'] ?? null,
            ]);

            // Adjuntar información de PDFs si está disponible
            if (!empty($row['pdf_principal_nombre'])) {
                $movimiento->setPdfPrincipal([
                    'nombre' => $row['pdf_principal_nombre'],
                    'base64' => $includePdfs ? ($row['pdf_principal_base64'] ?? null) : null,
                ]);
            }

            if (!empty($row['pdf_anexo_nombre'])) {
                $movimiento->setPdfAnexo([
                    'nombre' => $row['pdf_anexo_nombre'],
                    'base64' => $includePdfs ? ($row['pdf_anexo_base64'] ?? null) : null,
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
                    'id'               => $cuadId,
                    'nombre'           => $mov->getCuaderno(),
                    'total_movimientos'=> 0,
                ];
            }
            $cuadernos[$cuadId]['total_movimientos']++;
        }

        return array_values($cuadernos);
    }
}


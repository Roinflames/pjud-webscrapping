<?php

namespace App\Repository;

use App\Entity\PDF;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method PDF|null find($id, $lockMode = null, $lockVersion = null)
 * @method PDF|null findOneBy(array $criteria, array $orderBy = null)
 * @method PDF[]    findAll()
 * @method PDF[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class PDFRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PDF::class);
    }

    /**
     * Encuentra PDFs por RIT
     */
    public function findByRit(string $rit): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.rit = :rit')
            ->setParameter('rit', $rit)
            ->orderBy('p.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Encuentra un PDF específico por RIT, movimiento y tipo
     */
    public function findByRitAndMovimiento(string $rit, int $movimientoId, string $tipo = 'PRINCIPAL'): ?PDF
    {
        return $this->createQueryBuilder('p')
            ->where('p.rit = :rit')
            ->andWhere('p.movimientoId = :movimientoId')
            ->andWhere('p.tipo = :tipo')
            ->setParameter('rit', $rit)
            ->setParameter('movimientoId', $movimientoId)
            ->setParameter('tipo', $tipo)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Cuenta PDFs descargados vs no descargados
     */
    public function getEstadisticasDescarga(): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = '
            SELECT
                COUNT(*) as total_pdfs,
                SUM(CASE WHEN descargado = 1 THEN 1 ELSE 0 END) as descargados,
                SUM(CASE WHEN descargado = 0 THEN 1 ELSE 0 END) as pendientes
            FROM pdfs
        ';

        $stmt = $conn->prepare($sql);
        $result = $stmt->executeQuery();

        return $result->fetchAssociative();
    }
}

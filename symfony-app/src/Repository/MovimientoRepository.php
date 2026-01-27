<?php

namespace App\Repository;

use App\Entity\Movimiento;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method Movimiento|null find($id, $lockMode = null, $lockVersion = null)
 * @method Movimiento|null findOneBy(array $criteria, array $orderBy = null)
 * @method Movimiento[]    findAll()
 * @method Movimiento[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class MovimientoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Movimiento::class);
    }

    /**
     * Encuentra movimientos por RIT, ordenados por índice
     */
    public function findByRit(string $rit): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.rit = :rit')
            ->setParameter('rit', $rit)
            ->orderBy('m.indice', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtiene cuadernos únicos de una causa
     */
    public function getCuadernosByRit(string $rit): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = '
            SELECT DISTINCT cuaderno, cuaderno_id, COUNT(*) as total
            FROM movimientos
            WHERE rit = :rit
            GROUP BY cuaderno, cuaderno_id
            ORDER BY cuaderno_id
        ';

        $stmt = $conn->prepare($sql);
        $stmt->bindValue('rit', $rit);
        $result = $stmt->executeQuery();

        return $result->fetchAllAssociative();
    }

    /**
     * Obtiene etapas únicas de una causa
     */
    public function getEtapasByRit(string $rit): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = '
            SELECT DISTINCT etapa, etapa_codigo, COUNT(*) as total
            FROM movimientos
            WHERE rit = :rit AND etapa IS NOT NULL
            GROUP BY etapa, etapa_codigo
            ORDER BY etapa
        ';

        $stmt = $conn->prepare($sql);
        $stmt->bindValue('rit', $rit);
        $result = $stmt->executeQuery();

        return $result->fetchAllAssociative();
    }
}

<?php

namespace App\Repository;

use App\Entity\Causa;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method Causa|null find($id, $lockMode = null, $lockVersion = null)
 * @method Causa|null findOneBy(array $criteria, array $orderBy = null)
 * @method Causa[]    findAll()
 * @method Causa[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CausaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Causa::class);
    }

    /**
     * Encuentra una causa por RIT
     */
    public function findByRit(string $rit): ?Causa
    {
        return $this->findOneBy(['rit' => $rit]);
    }

    /**
     * Obtiene todas las causas con sus movimientos y PDFs
     */
    public function findAllWithRelations(): array
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.movimientos', 'm')
            ->leftJoin('c.pdfs', 'p')
            ->addSelect('m', 'p')
            ->orderBy('c.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Busca causas por criterios múltiples
     */
    public function searchCausas(?string $rit = null, ?string $caratulado = null, ?string $tribunal = null): array
    {
        $qb = $this->createQueryBuilder('c');

        if ($rit) {
            $qb->andWhere('c.rit LIKE :rit')
               ->setParameter('rit', '%' . $rit . '%');
        }

        if ($caratulado) {
            $qb->andWhere('c.caratulado LIKE :caratulado')
               ->setParameter('caratulado', '%' . $caratulado . '%');
        }

        if ($tribunal) {
            $qb->andWhere('c.tribunalNombre LIKE :tribunal')
               ->setParameter('tribunal', '%' . $tribunal . '%');
        }

        return $qb->orderBy('c.id', 'DESC')
                  ->getQuery()
                  ->getResult();
    }

    /**
     * Obtiene estadísticas generales
     */
    public function getEstadisticas(): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = '
            SELECT
                COUNT(*) as total_causas,
                SUM(total_movimientos) as total_movimientos,
                SUM(total_pdfs) as total_pdfs,
                SUM(CASE WHEN scraping_exitoso = 1 THEN 1 ELSE 0 END) as causas_exitosas,
                SUM(CASE WHEN scraping_exitoso = 0 THEN 1 ELSE 0 END) as causas_fallidas
            FROM causas
        ';

        $stmt = $conn->prepare($sql);
        $result = $stmt->executeQuery();

        return $result->fetchAssociative();
    }
}

<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\CausaRepository")
 * @ORM\Table(name="causas")
 */
class Causa
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer", options={"unsigned"=true})
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=50, unique=true)
     */
    private $rit;

    /**
     * @ORM\Column(type="string", length=1, name="tipo_causa")
     */
    private $tipoCausa = 'C';

    /**
     * @ORM\Column(type="string", length=20)
     */
    private $rol;

    /**
     * @ORM\Column(type="smallint", options={"unsigned"=true})
     */
    private $anio;

    /**
     * @ORM\Column(type="string", length=10, nullable=true, name="competencia_id")
     */
    private $competenciaId;

    /**
     * @ORM\Column(type="string", length=100, nullable=true, name="competencia_nombre")
     */
    private $competenciaNombre;

    /**
     * @ORM\Column(type="string", length=10, nullable=true, name="corte_id")
     */
    private $corteId;

    /**
     * @ORM\Column(type="string", length=100, nullable=true, name="corte_nombre")
     */
    private $corteNombre;

    /**
     * @ORM\Column(type="string", length=10, nullable=true, name="tribunal_id")
     */
    private $tribunalId;

    /**
     * @ORM\Column(type="string", length=200, nullable=true, name="tribunal_nombre")
     */
    private $tribunalNombre;

    /**
     * @ORM\Column(type="string", length=500, nullable=true)
     */
    private $caratulado;

    /**
     * @ORM\Column(type="string", length=20, nullable=true, name="fecha_ingreso")
     */
    private $fechaIngreso;

    /**
     * @ORM\Column(type="string", length=20, nullable=true)
     */
    private $estado = 'SIN_INFORMACION';

    /**
     * @ORM\Column(type="string", length=50, nullable=true)
     */
    private $etapa;

    /**
     * @ORM\Column(type="string", length=500, nullable=true, name="estado_descripcion")
     */
    private $estadoDescripcion;

    /**
     * @ORM\Column(type="integer", name="total_movimientos")
     */
    private $totalMovimientos = 0;

    /**
     * @ORM\Column(type="integer", name="total_pdfs")
     */
    private $totalPdfs = 0;

    /**
     * @ORM\Column(type="datetime", nullable=true, name="fecha_ultimo_scraping")
     */
    private $fechaUltimoScraping;

    /**
     * @ORM\Column(type="boolean", name="scraping_exitoso")
     */
    private $scrapingExitoso = false;

    /**
     * @ORM\Column(type="text", nullable=true, name="error_scraping")
     */
    private $errorScraping;

    /**
     * @ORM\Column(type="datetime", name="created_at")
     */
    private $createdAt;

    /**
     * @ORM\Column(type="datetime", name="updated_at")
     */
    private $updatedAt;

    /**
     * @ORM\OneToMany(targetEntity="App\Entity\Movimiento", mappedBy="causa")
     */
    private $movimientos;

    /**
     * @ORM\OneToMany(targetEntity="App\Entity\PDF", mappedBy="causa")
     */
    private $pdfs;

    public function __construct()
    {
        $this->movimientos = new ArrayCollection();
        $this->pdfs = new ArrayCollection();
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    // Getters y Setters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getRit(): ?string
    {
        return $this->rit;
    }

    public function setRit(string $rit): self
    {
        $this->rit = $rit;
        return $this;
    }

    public function getTipoCausa(): ?string
    {
        return $this->tipoCausa;
    }

    public function setTipoCausa(string $tipoCausa): self
    {
        $this->tipoCausa = $tipoCausa;
        return $this;
    }

    public function getRol(): ?string
    {
        return $this->rol;
    }

    public function setRol(string $rol): self
    {
        $this->rol = $rol;
        return $this;
    }

    public function getAnio(): ?int
    {
        return $this->anio;
    }

    public function setAnio(int $anio): self
    {
        $this->anio = $anio;
        return $this;
    }

    public function getCompetenciaId(): ?string
    {
        return $this->competenciaId;
    }

    public function setCompetenciaId(?string $competenciaId): self
    {
        $this->competenciaId = $competenciaId;
        return $this;
    }

    public function getCompetenciaNombre(): ?string
    {
        return $this->competenciaNombre;
    }

    public function setCompetenciaNombre(?string $competenciaNombre): self
    {
        $this->competenciaNombre = $competenciaNombre;
        return $this;
    }

    public function getCorteId(): ?string
    {
        return $this->corteId;
    }

    public function setCorteId(?string $corteId): self
    {
        $this->corteId = $corteId;
        return $this;
    }

    public function getCorteNombre(): ?string
    {
        return $this->corteNombre;
    }

    public function setCorteNombre(?string $corteNombre): self
    {
        $this->corteNombre = $corteNombre;
        return $this;
    }

    public function getTribunalId(): ?string
    {
        return $this->tribunalId;
    }

    public function setTribunalId(?string $tribunalId): self
    {
        $this->tribunalId = $tribunalId;
        return $this;
    }

    public function getTribunalNombre(): ?string
    {
        return $this->tribunalNombre;
    }

    public function setTribunalNombre(?string $tribunalNombre): self
    {
        $this->tribunalNombre = $tribunalNombre;
        return $this;
    }

    public function getCaratulado(): ?string
    {
        return $this->caratulado;
    }

    public function setCaratulado(?string $caratulado): self
    {
        $this->caratulado = $caratulado;
        return $this;
    }

    public function getFechaIngreso(): ?string
    {
        return $this->fechaIngreso;
    }

    public function setFechaIngreso(?string $fechaIngreso): self
    {
        $this->fechaIngreso = $fechaIngreso;
        return $this;
    }

    public function getEstado(): ?string
    {
        return $this->estado;
    }

    public function setEstado(?string $estado): self
    {
        $this->estado = $estado;
        return $this;
    }

    public function getEtapa(): ?string
    {
        return $this->etapa;
    }

    public function setEtapa(?string $etapa): self
    {
        $this->etapa = $etapa;
        return $this;
    }

    public function getEstadoDescripcion(): ?string
    {
        return $this->estadoDescripcion;
    }

    public function setEstadoDescripcion(?string $estadoDescripcion): self
    {
        $this->estadoDescripcion = $estadoDescripcion;
        return $this;
    }

    public function getTotalMovimientos(): ?int
    {
        return $this->totalMovimientos;
    }

    public function setTotalMovimientos(int $totalMovimientos): self
    {
        $this->totalMovimientos = $totalMovimientos;
        return $this;
    }

    public function getTotalPdfs(): ?int
    {
        return $this->totalPdfs;
    }

    public function setTotalPdfs(int $totalPdfs): self
    {
        $this->totalPdfs = $totalPdfs;
        return $this;
    }

    public function getFechaUltimoScraping(): ?\DateTimeInterface
    {
        return $this->fechaUltimoScraping;
    }

    public function setFechaUltimoScraping(?\DateTimeInterface $fechaUltimoScraping): self
    {
        $this->fechaUltimoScraping = $fechaUltimoScraping;
        return $this;
    }

    public function getScrapingExitoso(): ?bool
    {
        return $this->scrapingExitoso;
    }

    public function setScrapingExitoso(bool $scrapingExitoso): self
    {
        $this->scrapingExitoso = $scrapingExitoso;
        return $this;
    }

    public function getErrorScraping(): ?string
    {
        return $this->errorScraping;
    }

    public function setErrorScraping(?string $errorScraping): self
    {
        $this->errorScraping = $errorScraping;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    /**
     * @return Collection|Movimiento[]
     */
    public function getMovimientos(): Collection
    {
        return $this->movimientos;
    }

    /**
     * @return Collection|PDF[]
     */
    public function getPdfs(): Collection
    {
        return $this->pdfs;
    }
}

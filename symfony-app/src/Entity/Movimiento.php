<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\MovimientoRepository")
 * @ORM\Table(name="movimientos")
 */
class Movimiento
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer", options={"unsigned"=true})
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="App\Entity\Causa", inversedBy="movimientos")
     * @ORM\JoinColumn(name="causa_id", referencedColumnName="id", nullable=false)
     */
    private $causa;

    /**
     * @ORM\Column(type="string", length=50)
     */
    private $rit;

    /**
     * @ORM\Column(type="integer")
     */
    private $indice;

    /**
     * @ORM\Column(type="string", length=100, nullable=true)
     */
    private $etapa;

    /**
     * @ORM\Column(type="string", length=50, nullable=true, name="etapa_codigo")
     */
    private $etapaCodigo;

    /**
     * @ORM\Column(type="string", length=200, nullable=true)
     */
    private $tramite;

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $descripcion;

    /**
     * @ORM\Column(type="string", length=20, nullable=true)
     */
    private $fecha;

    /**
     * @ORM\Column(type="date", nullable=true, name="fecha_parsed")
     */
    private $fechaParsed;

    /**
     * @ORM\Column(type="string", length=50, nullable=true)
     */
    private $foja;

    /**
     * @ORM\Column(type="string", length=50, nullable=true)
     */
    private $folio;

    /**
     * @ORM\Column(type="boolean", name="tiene_pdf")
     */
    private $tienePdf = false;

    /**
     * @ORM\Column(type="string", length=255, nullable=true, name="pdf_path")
     */
    private $pdfPath;

    /**
     * @ORM\Column(type="text", nullable=true, name="raw_data")
     */
    private $rawData;

    /**
     * @ORM\Column(type="datetime", name="created_at")
     */
    private $createdAt;

    /**
     * @ORM\Column(type="datetime", name="updated_at")
     */
    private $updatedAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    // Getters y Setters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCausa(): ?Causa
    {
        return $this->causa;
    }

    public function setCausa(?Causa $causa): self
    {
        $this->causa = $causa;
        return $this;
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

    public function getIndice(): ?int
    {
        return $this->indice;
    }

    public function setIndice(int $indice): self
    {
        $this->indice = $indice;
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

    public function getEtapaCodigo(): ?string
    {
        return $this->etapaCodigo;
    }

    public function setEtapaCodigo(?string $etapaCodigo): self
    {
        $this->etapaCodigo = $etapaCodigo;
        return $this;
    }

    public function getTramite(): ?string
    {
        return $this->tramite;
    }

    public function setTramite(?string $tramite): self
    {
        $this->tramite = $tramite;
        return $this;
    }

    public function getDescripcion(): ?string
    {
        return $this->descripcion;
    }

    public function setDescripcion(?string $descripcion): self
    {
        $this->descripcion = $descripcion;
        return $this;
    }

    public function getFecha(): ?string
    {
        return $this->fecha;
    }

    public function setFecha(?string $fecha): self
    {
        $this->fecha = $fecha;
        return $this;
    }

    public function getFechaParsed(): ?\DateTimeInterface
    {
        return $this->fechaParsed;
    }

    public function setFechaParsed(?\DateTimeInterface $fechaParsed): self
    {
        $this->fechaParsed = $fechaParsed;
        return $this;
    }

    public function getFoja(): ?string
    {
        return $this->foja;
    }

    public function setFoja(?string $foja): self
    {
        $this->foja = $foja;
        return $this;
    }

    public function getFolio(): ?string
    {
        return $this->folio;
    }

    public function setFolio(?string $folio): self
    {
        $this->folio = $folio;
        return $this;
    }

    public function getTienePdf(): ?bool
    {
        return $this->tienePdf;
    }

    public function setTienePdf(bool $tienePdf): self
    {
        $this->tienePdf = $tienePdf;
        return $this;
    }

    public function getPdfPath(): ?string
    {
        return $this->pdfPath;
    }

    public function setPdfPath(?string $pdfPath): self
    {
        $this->pdfPath = $pdfPath;
        return $this;
    }

    // Métodos compatibles con frontend
    public function getTienePdfAzul(): bool
    {
        return $this->tienePdf && $this->pdfPath !== null;
    }

    public function getTienePdfRojo(): bool
    {
        return false; // No hay PDFs rojos en la estructura actual
    }

    public function getRawData(): ?string
    {
        return $this->rawData;
    }

    public function setRawData(?string $rawData): self
    {
        $this->rawData = $rawData;
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
}

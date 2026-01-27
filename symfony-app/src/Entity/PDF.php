<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\PDFRepository")
 * @ORM\Table(name="pdfs")
 */
class PDF
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer", options={"unsigned"=true})
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="App\Entity\Causa", inversedBy="pdfs")
     * @ORM\JoinColumn(name="causa_id", referencedColumnName="id", nullable=false)
     */
    private $causa;

    /**
     * @ORM\Column(type="integer", nullable=true, name="movimiento_id", options={"unsigned"=true})
     */
    private $movimientoId;

    /**
     * @ORM\Column(type="string", length=50)
     */
    private $rit;

    /**
     * @ORM\Column(type="string", length=20)
     */
    private $tipo = 'PRINCIPAL';

    /**
     * @ORM\Column(type="string", length=255, name="nombre_archivo")
     */
    private $nombreArchivo;

    /**
     * @ORM\Column(type="text", nullable=true, name="contenido_base64")
     */
    private $contenidoBase64;

    /**
     * @ORM\Column(type="string", length=500, nullable=true, name="ruta_relativa")
     */
    private $rutaRelativa;

    /**
     * @ORM\Column(type="integer", nullable=true, name="tamano_bytes", options={"unsigned"=true})
     */
    private $tamanoBytes;

    /**
     * @ORM\Column(type="string", length=32, nullable=true, name="hash_md5")
     */
    private $hashMd5;

    /**
     * @ORM\Column(type="boolean")
     */
    private $descargado = false;

    /**
     * @ORM\Column(type="datetime", nullable=true, name="fecha_descarga")
     */
    private $fechaDescarga;

    /**
     * @ORM\Column(type="string", length=500, nullable=true, name="error_descarga")
     */
    private $errorDescarga;

    /**
     * @ORM\Column(type="datetime", name="created_at")
     */
    private $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
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

    public function getMovimientoId(): ?int
    {
        return $this->movimientoId;
    }

    public function setMovimientoId(?int $movimientoId): self
    {
        $this->movimientoId = $movimientoId;
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

    public function getTipo(): ?string
    {
        return $this->tipo;
    }

    public function setTipo(string $tipo): self
    {
        $this->tipo = $tipo;
        return $this;
    }

    public function getNombreArchivo(): ?string
    {
        return $this->nombreArchivo;
    }

    public function setNombreArchivo(string $nombreArchivo): self
    {
        $this->nombreArchivo = $nombreArchivo;
        return $this;
    }

    public function getContenidoBase64(): ?string
    {
        return $this->contenidoBase64;
    }

    public function setContenidoBase64(?string $contenidoBase64): self
    {
        $this->contenidoBase64 = $contenidoBase64;
        return $this;
    }

    public function getRutaRelativa(): ?string
    {
        return $this->rutaRelativa;
    }

    public function setRutaRelativa(?string $rutaRelativa): self
    {
        $this->rutaRelativa = $rutaRelativa;
        return $this;
    }

    public function getTamanoBytes(): ?int
    {
        return $this->tamanoBytes;
    }

    public function setTamanoBytes(?int $tamanoBytes): self
    {
        $this->tamanoBytes = $tamanoBytes;
        return $this;
    }

    public function getHashMd5(): ?string
    {
        return $this->hashMd5;
    }

    public function setHashMd5(?string $hashMd5): self
    {
        $this->hashMd5 = $hashMd5;
        return $this;
    }

    public function getDescargado(): ?bool
    {
        return $this->descargado;
    }

    public function setDescargado(bool $descargado): self
    {
        $this->descargado = $descargado;
        return $this;
    }

    public function getFechaDescarga(): ?\DateTimeInterface
    {
        return $this->fechaDescarga;
    }

    public function setFechaDescarga(?\DateTimeInterface $fechaDescarga): self
    {
        $this->fechaDescarga = $fechaDescarga;
        return $this;
    }

    public function getErrorDescarga(): ?string
    {
        return $this->errorDescarga;
    }

    public function setErrorDescarga(?string $errorDescarga): self
    {
        $this->errorDescarga = $errorDescarga;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }
}

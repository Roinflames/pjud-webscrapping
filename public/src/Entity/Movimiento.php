<?php

namespace App\Entity;

/**
 * Entidad Movimiento
 */
class Movimiento
{
    private ?int $id = null;
    private string $rit;
    private ?string $folio = null;
    private bool $tienePdf = false;
    private ?string $etapa = null;
    private ?string $tramite = null;
    private ?string $descripcion = null;
    private ?string $fecha = null;
    private ?string $foja = null;
    private ?int $indice = null;
    private ?string $cuaderno = null;
    private ?string $cuadernoId = null;
    private ?string $pdfAzul = null;
    private ?string $pdfRojo = null;
    private ?array $pdfPrincipal = null;
    private ?array $pdfAnexo = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(?int $id): self
    {
        $this->id = $id;
        return $this;
    }

    public function getRit(): string
    {
        return $this->rit;
    }

    public function setRit(string $rit): self
    {
        $this->rit = $rit;
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

    public function getTienePdf(): bool
    {
        return $this->tienePdf;
    }

    public function setTienePdf(bool $tienePdf): self
    {
        $this->tienePdf = $tienePdf;
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

    public function getFoja(): ?string
    {
        return $this->foja;
    }

    public function setFoja(?string $foja): self
    {
        $this->foja = $foja;
        return $this;
    }

    public function getIndice(): ?int
    {
        return $this->indice;
    }

    public function setIndice(?int $indice): self
    {
        $this->indice = $indice;
        return $this;
    }

    public function getCuaderno(): ?string
    {
        return $this->cuaderno;
    }

    public function setCuaderno(?string $cuaderno): self
    {
        $this->cuaderno = $cuaderno;
        return $this;
    }

    public function getCuadernoId(): ?string
    {
        return $this->cuadernoId;
    }

    public function setCuadernoId(?string $cuadernoId): self
    {
        $this->cuadernoId = $cuadernoId;
        return $this;
    }

    public function getPdfAzul(): ?string
    {
        return $this->pdfAzul;
    }

    public function setPdfAzul(?string $pdfAzul): self
    {
        $this->pdfAzul = $pdfAzul;
        return $this;
    }

    public function getPdfRojo(): ?string
    {
        return $this->pdfRojo;
    }

    public function setPdfRojo(?string $pdfRojo): self
    {
        $this->pdfRojo = $pdfRojo;
        return $this;
    }

    public function getPdfPrincipal(): ?array
    {
        return $this->pdfPrincipal;
    }

    public function setPdfPrincipal(?array $pdfPrincipal): self
    {
        $this->pdfPrincipal = $pdfPrincipal;
        return $this;
    }

    public function getPdfAnexo(): ?array
    {
        return $this->pdfAnexo;
    }

    public function setPdfAnexo(?array $pdfAnexo): self
    {
        $this->pdfAnexo = $pdfAnexo;
        return $this;
    }

    /**
     * Convierte la entidad a array
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'rit' => $this->rit,
            'folio' => $this->folio,
            'tiene_pdf' => $this->tienePdf,
            'etapa' => $this->etapa,
            'tramite' => $this->tramite,
            'descripcion' => $this->descripcion,
            'fecha' => $this->fecha,
            'foja' => $this->foja,
            'indice' => $this->indice,
            'cuaderno' => $this->cuaderno ?? 'Principal',
            'cuaderno_id' => $this->cuadernoId ?? '1',
            'tiene_pdf_azul' => !empty($this->pdfAzul),
            'tiene_pdf_rojo' => !empty($this->pdfRojo),
            'pdf_azul' => $this->pdfAzul,
            'pdf_rojo' => $this->pdfRojo,
            'pdf_principal' => $this->pdfPrincipal,
            'pdf_anexo' => $this->pdfAnexo
        ];
    }

    /**
     * Crea una instancia desde un array de datos
     */
    public static function fromArray(array $data): self
    {
        $movimiento = new self();
        $movimiento->id = $data['id'] ?? null;
        $movimiento->rit = $data['rit'] ?? '';
        $movimiento->folio = $data['folio'] ?? null;
        $movimiento->tienePdf = (bool)($data['tiene_pdf'] ?? false);
        $movimiento->etapa = $data['etapa'] ?? null;
        $movimiento->tramite = $data['tramite'] ?? null;
        $movimiento->descripcion = $data['descripcion'] ?? null;
        $movimiento->fecha = $data['fecha'] ?? null;
        $movimiento->foja = $data['foja'] ?? null;
        $movimiento->indice = $data['indice'] ?? null;
        $movimiento->cuaderno = $data['cuaderno'] ?? 'Principal';
        $movimiento->cuadernoId = $data['cuaderno_id'] ?? '1';
        $movimiento->pdfAzul = $data['pdf_azul'] ?? null;
        $movimiento->pdfRojo = $data['pdf_rojo'] ?? null;
        
        return $movimiento;
    }
}

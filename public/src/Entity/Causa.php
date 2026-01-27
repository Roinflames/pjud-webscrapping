<?php

namespace App\Entity;

/**
 * Entidad Causa
 */
class Causa
{
    private ?int $id = null;
    private string $rit;
    private ?string $caratulado = null;
    private ?string $tribunalNombre = null;
    private ?string $fechaIngreso = null;
    private ?string $estado = null;
    private ?string $etapa = null;
    private int $totalMovimientos = 0;
    private int $totalPdfs = 0;
    private ?string $createdAt = null;

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

    public function getCaratulado(): ?string
    {
        return $this->caratulado;
    }

    public function setCaratulado(?string $caratulado): self
    {
        $this->caratulado = $caratulado;
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

    public function getTotalMovimientos(): int
    {
        return $this->totalMovimientos;
    }

    public function setTotalMovimientos(int $totalMovimientos): self
    {
        $this->totalMovimientos = $totalMovimientos;
        return $this;
    }

    public function getTotalPdfs(): int
    {
        return $this->totalPdfs;
    }

    public function setTotalPdfs(int $totalPdfs): self
    {
        $this->totalPdfs = $totalPdfs;
        return $this;
    }

    public function getCreatedAt(): ?string
    {
        return $this->createdAt;
    }

    public function setCreatedAt(?string $createdAt): self
    {
        $this->createdAt = $createdAt;
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
            'caratulado' => $this->caratulado,
            'tribunal_nombre' => $this->tribunalNombre,
            'fecha_ingreso' => $this->fechaIngreso,
            'estado' => $this->estado,
            'etapa' => $this->etapa,
            'total_movimientos' => $this->totalMovimientos,
            'total_pdfs' => $this->totalPdfs,
            'created_at' => $this->createdAt
        ];
    }

    /**
     * Crea una instancia desde un array de datos
     */
    public static function fromArray(array $data): self
    {
        $causa = new self();
        $causa->id = $data['id'] ?? null;
        $causa->rit = $data['rit'] ?? '';
        $causa->caratulado = $data['caratulado'] ?? null;
        $causa->tribunalNombre = $data['tribunal_nombre'] ?? null;
        $causa->fechaIngreso = $data['fecha_ingreso'] ?? null;
        $causa->estado = $data['estado'] ?? null;
        $causa->etapa = $data['etapa'] ?? null;
        $causa->totalMovimientos = $data['total_movimientos'] ?? 0;
        $causa->totalPdfs = $data['total_pdfs'] ?? 0;
        $causa->createdAt = $data['created_at'] ?? null;
        
        return $causa;
    }
}

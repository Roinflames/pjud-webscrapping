<?php

namespace App\Entity;

/**
 * Entidad PDF
 */
class PDF
{
    private ?int $id = null;
    private ?int $movimientoId = null;
    private string $rit;
    private ?int $indice = null;
    private string $tipo; // 'principal' | 'anexo'
    private ?string $nombreArchivo = null;
    private ?string $contenidoBase64 = null;
    private ?int $tamanoBytes = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(?int $id): self
    {
        $this->id = $id;
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

    public function getRit(): string
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

    public function setIndice(?int $indice): self
    {
        $this->indice = $indice;
        return $this;
    }

    public function getTipo(): string
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

    public function setNombreArchivo(?string $nombreArchivo): self
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

    public function getTamanoBytes(): ?int
    {
        return $this->tamanoBytes;
    }

    public function setTamanoBytes(?int $tamanoBytes): self
    {
        $this->tamanoBytes = $tamanoBytes;
        return $this;
    }

    /**
     * Convierte la entidad a array
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'movimiento_id' => $this->movimientoId,
            'rit' => $this->rit,
            'indice' => $this->indice,
            'tipo' => $this->tipo,
            'nombre_archivo' => $this->nombreArchivo,
            'contenido_base64' => $this->contenidoBase64,
            'tamano_bytes' => $this->tamanoBytes
        ];
    }

    /**
     * Crea una instancia desde un array de datos
     */
    public static function fromArray(array $data): self
    {
        $pdf = new self();
        $pdf->id = $data['id'] ?? null;
        $pdf->movimientoId = $data['movimiento_id'] ?? null;
        $pdf->rit = $data['rit'] ?? '';
        $pdf->indice = $data['indice'] ?? null;
        $pdf->tipo = $data['tipo'] ?? 'principal';
        $pdf->nombreArchivo = $data['nombre_archivo'] ?? null;
        $pdf->contenidoBase64 = $data['contenido_base64'] ?? null;
        $pdf->tamanoBytes = $data['tamano_bytes'] ?? null;
        
        return $pdf;
    }
}

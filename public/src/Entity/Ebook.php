<?php

namespace App\Entity;

/**
 * Entidad Ebook
 */
class Ebook
{
    private ?int $id = null;
    private ?int $causaId = null;
    private ?string $nombreArchivo = null;
    private ?string $rutaRelativa = null;
    private ?int $tamanoBytes = null;
    private bool $descargado = false;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(?int $id): self
    {
        $this->id = $id;
        return $this;
    }

    public function getCausaId(): ?int
    {
        return $this->causaId;
    }

    public function setCausaId(?int $causaId): self
    {
        $this->causaId = $causaId;
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

    public function getDescargado(): bool
    {
        return $this->descargado;
    }

    public function setDescargado(bool $descargado): self
    {
        $this->descargado = $descargado;
        return $this;
    }

    /**
     * Convierte la entidad a array
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'causa_id' => $this->causaId,
            'nombre_archivo' => $this->nombreArchivo,
            'ruta_relativa' => $this->rutaRelativa,
            'tamano_bytes' => $this->tamanoBytes,
            'descargado' => $this->descargado
        ];
    }

    /**
     * Crea una instancia desde un array de datos
     */
    public static function fromArray(array $data): self
    {
        $ebook = new self();
        $ebook->id = $data['id'] ?? null;
        $ebook->causaId = $data['causa_id'] ?? null;
        $ebook->nombreArchivo = $data['nombre_archivo'] ?? null;
        $ebook->rutaRelativa = $data['ruta_relativa'] ?? null;
        $ebook->tamanoBytes = $data['tamano_bytes'] ?? null;
        $ebook->descargado = (bool)($data['descargado'] ?? false);
        
        return $ebook;
    }
}

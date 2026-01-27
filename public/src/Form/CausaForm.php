<?php

namespace App\Form;

/**
 * Form para validar y procesar parámetros de peticiones de causa
 */
class CausaForm
{
    private array $errors = [];
    private ?string $rit = null;
    private string $action = 'movimientos';
    private ?int $indice = null;
    private string $tipo = 'principal';
    private string $format = 'json';
    private bool $includePdfs = false;

    /**
     * Valida y procesa los parámetros de la petición
     * 
     * @param array $params Parámetros GET
     * @return bool true si es válido, false si hay errores
     */
    public function handleRequest(array $params): bool
    {
        $this->errors = [];

        // Validar RIT
        $this->rit = $params['rol'] ?? null;
        if (empty($this->rit)) {
            $this->errors[] = 'Falta parámetro rol';
            return false;
        }

        // Validar formato de RIT (ej: C-12345-2024 o 12345-2024)
        if (!preg_match('/^C?-?\d+-\d{4}$/', $this->rit)) {
            $this->errors[] = 'Formato de RIT inválido';
            return false;
        }

        // Validar action
        $this->action = $params['action'] ?? 'movimientos';
        if (!in_array($this->action, ['movimientos', 'pdf'])) {
            $this->errors[] = 'Action inválido. Debe ser "movimientos" o "pdf"';
            return false;
        }

        // Si action es 'pdf', validar indice y tipo
        if ($this->action === 'pdf') {
            $this->indice = isset($params['indice']) ? (int)$params['indice'] : null;
            if ($this->indice === null) {
                $this->errors[] = 'Falta parámetro indice para acción pdf';
                return false;
            }

            $this->tipo = $params['tipo'] ?? 'principal';
            if (!in_array($this->tipo, ['principal', 'anexo'])) {
                $this->errors[] = 'Tipo inválido. Debe ser "principal" o "anexo"';
                return false;
            }

            $this->format = $params['format'] ?? 'json';
            if (!in_array($this->format, ['json', 'download'])) {
                $this->errors[] = 'Format inválido. Debe ser "json" o "download"';
                return false;
            }
        }

        // Validar include_pdfs
        $this->includePdfs = isset($params['include_pdfs']) && $params['include_pdfs'] === 'true';

        return true;
    }

    /**
     * Obtiene los errores de validación
     * 
     * @return array
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Obtiene el primer error
     * 
     * @return string|null
     */
    public function getFirstError(): ?string
    {
        return $this->errors[0] ?? null;
    }

    public function getRit(): ?string
    {
        return $this->rit;
    }

    public function getAction(): string
    {
        return $this->action;
    }

    public function getIndice(): ?int
    {
        return $this->indice;
    }

    public function getTipo(): string
    {
        return $this->tipo;
    }

    public function getFormat(): string
    {
        return $this->format;
    }

    public function getIncludePdfs(): bool
    {
        return $this->includePdfs;
    }
}

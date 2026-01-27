<?php

/**
 * API endpoint para obtener información de causas
 * Refactorizado usando patrón Controller-Entity-Form-Repository
 */

require_once __DIR__ . '/../src/autoload.php';

use App\Controller\CausaController;

// Obtener parámetros GET
$params = $_GET;

// Crear controller y manejar la petición
$controller = new CausaController();
$controller->handleRequest($params);

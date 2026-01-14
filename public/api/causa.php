<?php
header('Content-Type: application/json; charset=utf-8');

$rol = $_GET['rol'] ?? null;

if (!$rol) {
    http_response_code(400);
    echo json_encode(['error' => 'Falta parámetro rol']);
    exit;
}

/*
  Convención de nombre:
  C-16707-2019  -> resultado_16707_2019.json
*/
$rol_limpio = strtolower($rol);
$rol_limpio = str_replace(['c-', 'C-'], '', $rol_limpio);
$rol_limpio = str_replace('-', '_', $rol_limpio);

$archivo = __DIR__ . "/../../public/outputs/resultado_{$rol_limpio}.json";

if (!file_exists($archivo)) {
    http_response_code(404);
    echo json_encode(['error' => 'Archivo de resultados no encontrado']);
    exit;
}

echo file_get_contents($archivo);

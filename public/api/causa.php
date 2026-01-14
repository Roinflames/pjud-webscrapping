<?php
header('Content-Type: application/json; charset=utf-8');

$rol = $_GET['rol'] ?? null;
$rol_limpio = preg_replace('/-/', '_', $rol, 1);

if (!$rol) {
    http_response_code(400);
    echo json_encode(['error' => 'Falta parámetro rol']);
    exit;
}

/*
  Convención de nombre:
  El ROL de entrada (ej: "C-16707-2019") se usa directamente para buscar el archivo
  correspondiente, ej: "resultado_C-16707-2019.json".

  $rol = C-3596-2024
  $archivo = resultado_C_3596-2024
*/
$archivo = __DIR__ . "/../../public/outputs/resultado_{$rol_limpio}.json";

if (!file_exists($archivo)) {
    http_response_code(404);
    // Corregido: Se elimina el espacio extra y se devuelve un objeto JSON válido.
    echo json_encode(['error' => 'Archivo de resultados no encontrado', 'buscando' => $rol, 'rol_limpio' => $rol_limpio]);
    exit;
}

echo file_get_contents($archivo);

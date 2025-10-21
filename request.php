<?php
/**
 * request.php
 *
 * Este es un archivo de ejemplo para resolver consultas de la integración con Hans.
 * 
 * Construye un JSON con los datos del caso (tomados de la imagen),
 * opcionalmente lo compacta (quita valores null) y/o convierte las claves a snake_case,
 * y lo envía por POST a un endpoint usando cURL.
 *
 * Uso: php request.php
 */

// === CONFIG ===
$endpoint = "https://api.ejemplo.com/casos"; // <- reemplaza por tu endpoint
$send_compact = true;      // quitar campos null antes de enviar
$use_snake_case = true;    // convertir claves a snake_case antes de enviar
$timeout_seconds = 10;

// === Datos (extraídos de la imagen) ===
$payload = [
    "ReferenciaCliente"     => "111",
    "NaveDescripcionCaso"   => "Rodrigo/pp",
    "AsuntoCaratula"        => "Demanda",
    "ReferenciaDemandante"  => "111",
    "FechaInicio"           => "2025-10-20",
    "AbogadoPrincipal"      => "HZ",
    "AbogadosColaboradores" => null,
    "TipoCobro" => [
        "CobroFijo"       => false,
        "CobroPorcentaje" => false
    ],
    "FechaIngresoTribunal" => null,
    "JuezArbitro"          => null,
    "RolArbitral"          => false,
    "BillOfLading"         => "A-456-2024",
    "TipoMoneda"           => null,
    "Cuantia"              => 3000,
    "Observaciones"        => null,
    "FechaRegistro"        => "2025-10-20T16:09:00",
    "FechaCierre"          => null,
    "UltimaModificacion"   => "2025-10-20 HZ",
    "DatosPJUD" => [
        "Competencia" => "Civil",
        "Corte"       => "C.A. de Santiago",
        "Tribunal"    => "18° Juzgado Civil de Santiago",
        "LibroTipo"   => "C",
        "Rol"         => "7906",
        "Año"         => 2022
    ],
    "RefCaso"       => "79",
    "EtapaProcesal" => "Ingreso",
    "EstadoCaso"    => "Abierto",
    "EstadoInterno" => "Tramitacion",
    "TipoCaso"      => "Cobro Pagare",
    "TotHTrab"      => "0:00",
    "NSubcasos"     => 0,
    "Congelado"     => false
];

// === Helpers ===
function array_remove_nulls($arr) {
    $result = [];
    foreach ($arr as $k => $v) {
        if (is_array($v)) {
            $nested = array_remove_nulls($v);
            // conservar arrays vacíos si hacen sentido; aquí los omitimos si quedan vacíos
            if ($nested !== [] && $nested !== null) {
                $result[$k] = $nested;
            }
        } else {
            if ($v !== null) {
                $result[$k] = $v;
            }
        }
    }
    return $result;
}

function to_snake_case($input) {
    // convierte "FechaRegistro" -> "fecha_registro"
    $pattern = '/([a-z])([A-Z])/';
    $snake = strtolower(preg_replace($pattern, '$1_$2', $input));
    // reemplaza caracteres especiales (por ejemplo "Año" -> "ano")
    $snake = iconv('UTF-8', 'ASCII//TRANSLIT', $snake);
    $snake = preg_replace('/[^a-z0-9_]/', '', $snake);
    return $snake;
}

function keys_to_snake_case($arr) {
    $out = [];
    foreach ($arr as $k => $v) {
        $newKey = to_snake_case($k);
        if (is_array($v)) {
            $out[$newKey] = keys_to_snake_case($v);
        } else {
            $out[$newKey] = $v;
        }
    }
    return $out;
}

// === Preparar payload según opciones ===
$to_send = $payload;

if ($send_compact) {
    $to_send = array_remove_nulls($to_send);
}

if ($use_snake_case) {
    $to_send = keys_to_snake_case($to_send);
}

// Codificar JSON
$json = json_encode($to_send, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
if ($json === false) {
    echo "Error al codificar JSON: " . json_last_error_msg() . PHP_EOL;
    exit(1);
}

// === Envío via cURL ===
$ch = curl_init($endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Accept: application/json"
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
curl_setopt($ch, CURLOPT_TIMEOUT, $timeout_seconds);

// Si tu endpoint requiere autenticación Bearer, descomenta y edita:
// curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge([ "Authorization: Bearer TU_TOKEN" ], $headers));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

// === Resultado ===
echo "Payload enviado:" . PHP_EOL;
echo $json . PHP_EOL . PHP_EOL;
if ($curlErr) {
    echo "Error cURL: $curlErr" . PHP_EOL;
    exit(1);
}
echo "HTTP status: $httpCode" . PHP_EOL;
echo "Respuesta del servidor:" . PHP_EOL;
echo $response . PHP_EOL;

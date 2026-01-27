<?php

/**
 * Autoloader simple para las clases del proyecto
 */
spl_autoload_register(function ($class) {
    // Convertir namespace a ruta de archivo
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/';
    
    // Verificar si la clase usa el prefijo del namespace
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    // Obtener el nombre de la clase relativo al namespace
    $relativeClass = substr($class, $len);
    
    // Convertir namespace separators a directory separators
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
    
    // Si el archivo existe, cargarlo
    if (file_exists($file)) {
        require $file;
    }
});

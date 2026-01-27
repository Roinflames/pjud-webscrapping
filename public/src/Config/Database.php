<?php

namespace App\Config;

use PDO;
use PDOException;

/**
 * Clase para gestionar la conexión a la base de datos
 */
class Database
{
    private static ?PDO $connection = null;

    /**
     * Obtiene una instancia de PDO (singleton)
     * 
     * @return PDO
     * @throws PDOException
     */
    /**
     * Carga variables de entorno desde .env si existe
     * Busca en: raíz del proyecto (../../.env) o en public/.env
     */
    private static function loadEnv(): void
    {
        // Buscar .env en la raíz del proyecto (subiendo desde public/src/Config)
        $envFile = realpath(__DIR__ . '/../../.env') ?: realpath(__DIR__ . '/../../../.env');
        if ($envFile && file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || strpos($line, '#') === 0) continue; // Skip comments/empty
                if (strpos($line, '=') === false) continue;
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                // Remover comillas si las tiene
                $value = trim($value, '"\'');
                if (!getenv($key)) {
                    putenv("{$key}={$value}");
                    $_ENV[$key] = $value;
                }
            }
        }
    }

    public static function getConnection(): PDO
    {
        if (self::$connection === null) {
            self::loadEnv(); // Cargar .env antes de leer variables
            
            $dbHost = getenv('DB_HOST') ?: 'localhost';
            $dbPort = getenv('DB_PORT') ?: '3306';
            $dbName = getenv('DB_NAME') ?: 'codi_ejamtest';
            $dbUser = getenv('DB_USER') ?: 'root';
            $dbPass = getenv('DB_PASS') ?: '';

            self::$connection = new PDO(
                "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4",
                $dbUser,
                $dbPass,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_TIMEOUT => 3,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]
            );
        }

        return self::$connection;
    }

    /**
     * Cierra la conexión (útil para testing)
     */
    public static function closeConnection(): void
    {
        self::$connection = null;
    }
}

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
    public static function getConnection(): PDO
    {
        if (self::$connection === null) {
            $dbHost = getenv('DB_HOST') ?: 'localhost';
            $dbName = getenv('DB_NAME') ?: 'codi_ejamtest';
            $dbUser = getenv('DB_USER') ?: 'root';
            $dbPass = getenv('DB_PASS') ?: '';

            self::$connection = new PDO(
                "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
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

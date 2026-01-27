<?php

namespace App\Config;

use PDO;
use PDOException;

/**
 * Clase para manejar la conexi�n a la base de datos
 */
class Database
{
    private static ?PDO $connection = null;

    /**
     * Obtiene la conexi�n PDO (Singleton)
     *
     * @return PDO
     * @throws PDOException
     */
    public static function getConnection(): PDO
    {
        if (self::$connection === null) {
            $dbHost = getenv('DB_HOST') ?: 'localhost';
            $dbPort = getenv('DB_PORT') ?: '3306';
            $dbName = getenv('DB_NAME') ?: 'codi_ejamtest';
            $dbUser = getenv('DB_USER') ?: 'root';
            $dbPass = getenv('DB_PASS') ?: '';

            $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";

            self::$connection = new PDO($dsn, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 5
            ]);
        }

        return self::$connection;
    }

    /**
     * Cierra la conexi�n (�til para tests)
     */
    public static function closeConnection(): void
    {
        self::$connection = null;
    }
}

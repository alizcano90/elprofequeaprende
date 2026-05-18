<?php
declare(strict_types=1);

function getConnection(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $localConfig = __DIR__ . '/config.local.php';
    $databaseLocalConfig = __DIR__ . '/database.local.php';
    $config = is_file($localConfig) ? require $localConfig : [];
    if (is_file($databaseLocalConfig)) {
        $config = array_replace($config, require $databaseLocalConfig);
    }

    $host = getenv('DB_HOST') ?: ($config['db_host'] ?? null);
    $name = getenv('DB_NAME') ?: ($config['db_name'] ?? null);
    $user = getenv('DB_USER') ?: ($config['db_user'] ?? null);
    $pass = getenv('DB_PASS') ?: ($config['db_pass'] ?? null);
    $charset = getenv('DB_CHARSET') ?: ($config['db_charset'] ?? 'utf8mb4');

    if (!$host || !$name || !$user) {
        throw new RuntimeException('La conexion a base de datos no esta configurada.');
    }

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $host, $name, $charset);

    try {
        $pdo = new PDO($dsn, $user, (string)$pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $exception) {
        error_log('Error de conexion PDO: ' . $exception->getMessage());
        throw new RuntimeException('No fue posible conectar con la base de datos.');
    }

    return $pdo;
}

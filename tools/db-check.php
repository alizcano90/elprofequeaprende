<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

$expectedToken = getenv('DB_CHECK_TOKEN') ?: '';
$providedToken = $_GET['token'] ?? '';

if ($expectedToken === '' || !is_string($providedToken) || !hash_equals($expectedToken, $providedToken)) {
    http_response_code(404);
    exit('Not found');
}

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = getConnection();
    echo "PDO: OK\n";

    $tableStmt = $pdo->query("SHOW TABLES LIKE 'users'");
    $usersExists = (bool)$tableStmt->fetchColumn();
    echo 'users table: ' . ($usersExists ? 'OK' : 'MISSING') . "\n";

    if ($usersExists) {
        $columns = [];
        $stmt = $pdo->query('SHOW COLUMNS FROM users');
        foreach ($stmt->fetchAll() as $row) {
            $columns[] = $row['Field'];
        }

        foreach (['full_name', 'email', 'phone_e164', 'password_hash', 'role', 'status'] as $column) {
            echo $column . ': ' . (in_array($column, $columns, true) ? 'OK' : 'MISSING') . "\n";
        }
    }
} catch (Throwable $e) {
    error_log('db-check failed: ' . $e->getMessage());
    http_response_code(500);
    echo "DB CHECK FAILED\n";
}

<?php
declare(strict_types=1);

function table_exists(PDO $pdo, string $table): bool
{
    try {
        $stmt = $pdo->prepare('SHOW TABLES LIKE :table_name');
        $stmt->execute(['table_name' => $table]);
        return (bool)$stmt->fetchColumn();
    } catch (Throwable $e) {
        error_log('table_exists failed: ' . $e->getMessage());
        return false;
    }
}

function get_current_user_plan(PDO $pdo, int $userId): array
{
    $fallback = [
        'name' => 'Plan Gratuito',
        'status' => 'active',
        'start_date' => null,
        'end_date' => null,
        'benefits' => ['Recursos gratuitos', 'Tips y tutoriales', 'Herramientas basicas', 'Acceso a demostraciones'],
    ];

    if (!table_exists($pdo, 'user_subscriptions') || !table_exists($pdo, 'plans')) {
        return $fallback;
    }

    try {
        $stmt = $pdo->prepare(
            "SELECT p.name, p.description, us.status, us.start_date, us.end_date
             FROM user_subscriptions us
             INNER JOIN plans p ON p.id = us.plan_id
             WHERE us.user_id = :user_id AND us.status = 'active'
             ORDER BY us.start_date DESC
             LIMIT 1"
        );
        $stmt->execute(['user_id' => $userId]);
        $plan = $stmt->fetch();
        if (!$plan) {
            return $fallback;
        }
        return [
            'name' => (string)$plan['name'],
            'status' => (string)$plan['status'],
            'start_date' => $plan['start_date'] ?? null,
            'end_date' => $plan['end_date'] ?? null,
            'benefits' => array_filter(array_map('trim', explode("\n", (string)($plan['description'] ?? '')))) ?: $fallback['benefits'],
        ];
    } catch (Throwable $e) {
        error_log('get_current_user_plan failed: ' . $e->getMessage());
        return $fallback;
    }
}

function get_dashboard_stats(PDO $pdo, int $userId): array
{
    return [
        'resources' => 14,
        'courses' => 1,
        'tools' => 4,
        'schedules' => table_exists($pdo, 'schedules') ? dashboard_count($pdo, 'schedules', 'user_id', $userId) : 0,
    ];
}

function dashboard_count(PDO $pdo, string $table, string $column, int $userId): int
{
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM {$table} WHERE {$column} = :user_id");
        $stmt->execute(['user_id' => $userId]);
        return (int)$stmt->fetchColumn();
    } catch (Throwable $e) {
        error_log('dashboard_count failed: ' . $e->getMessage());
        return 0;
    }
}

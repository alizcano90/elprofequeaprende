<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $seed = epqa_map_seed(epqa_seed());
    epqa_json(['ok' => true, 'schedule' => [
        'id' => 'demo',
        'name' => 'Horario semilla EPQA',
        'status' => 'DRAFT',
        'slots' => $seed['slots'],
    ]]);
}

if ($method === 'POST') {
    if (!epqa_can_edit()) {
        epqa_json(['ok' => false, 'error' => 'Rol sin permiso de edicion.'], 403);
    }
    $input = epqa_input();
    $slots = is_array($input['slots'] ?? null) ? $input['slots'] : [];
    $name = trim((string)($input['name'] ?? 'Horario EPQA'));
    $pdo = epqa_db();
    if (!$pdo instanceof PDO) {
        $_SESSION['epqa_schedule'] = ['name' => $name, 'slots' => $slots, 'savedAt' => date('c')];
        epqa_json(['ok' => true, 'mode' => 'session-demo', 'message' => 'Horario guardado en sesion local. Configure MySQL para persistencia definitiva.']);
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('INSERT INTO schedules (institution_id, name, status, created_by) VALUES (:institution_id, :name, "DRAFT", :created_by)');
        $stmt->execute(['institution_id' => EPQA_INSTITUTION_ID, 'name' => $name, 'created_by' => epqa_user()['id'] ?? null]);
        $scheduleId = (int)$pdo->lastInsertId();
        $pdo->commit();
        epqa_json(['ok' => true, 'id' => $scheduleId, 'message' => 'Horario creado. Use importadores SQL/API para poblar slots numericos.']);
    } catch (Throwable $exception) {
        $pdo->rollBack();
        epqa_json(['ok' => false, 'error' => 'No fue posible guardar el horario.'], 500);
    }
}

epqa_json(['ok' => false, 'error' => 'Metodo no permitido.'], 405);

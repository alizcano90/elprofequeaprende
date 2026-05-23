<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$userId = epqa_current_user_id();
$pdo = epqa_db();

if (!$pdo instanceof PDO || !epqa_table_exists($pdo, 'horario_schedules')) {
    epqa_json([
        'ok' => true,
        'mode' => 'database-missing',
        'message' => 'Ejecute horarios/sql/003_multiusuario_freemium.sql para activar horarios multiusuario.',
        'plan' => ['plan_code' => 'free', 'max_schedules' => 1, 'can_create_multiple' => false],
        'limit' => ['allowed' => true, 'count' => 0, 'max' => 1],
        'schedules' => [],
        'active' => null,
    ]);
}

if ($method === 'GET') {
    $scheduleId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $plan = epqa_plan_for_user($pdo, $userId);
    $limit = epqa_can_create_schedule($pdo, $userId);

    $stmt = $pdo->prepare(
        'SELECT id, name, institution_name, status, plan_scope, active_version_id, created_at, updated_at
         FROM horario_schedules
         WHERE user_id = :user_id AND deleted_at IS NULL
         ORDER BY updated_at DESC, id DESC'
    );
    $stmt->execute(['user_id' => $userId]);
    $schedules = $stmt->fetchAll();

    if (!$scheduleId && $schedules) {
        $scheduleId = (int)$schedules[0]['id'];
    }

    $active = null;
    if ($scheduleId > 0) {
        $schedule = epqa_assert_schedule_belongs($pdo, $scheduleId, $userId);
        $snapshot = epqa_latest_snapshot($pdo, $scheduleId, $userId);
        $active = [
            'id' => $scheduleId,
            'schedule' => $schedule,
            'data' => $snapshot['data'] ?? $snapshot ?? null,
            'slots' => $snapshot['slots'] ?? ($snapshot['data']['slots'] ?? []),
            'audit' => $snapshot['audit'] ?? null,
        ];
    }

    epqa_json([
        'ok' => true,
        'plan' => $plan,
        'limit' => $limit,
        'schedules' => $schedules,
        'active' => $active,
    ]);
}

if ($method !== 'POST') {
    epqa_json(['ok' => false, 'error' => 'Metodo no permitido.'], 405);
}

$input = epqa_input();
$action = (string)($input['action'] ?? 'create');

if ($action === 'create') {
    $limit = epqa_can_create_schedule($pdo, $userId);
    if (!$limit['allowed']) {
        epqa_limit_response($limit);
    }

    $data = is_array($input['data'] ?? null) ? $input['data'] : [
        'project' => ['name' => $input['name'] ?? 'Horario EPQA'],
        'sites' => [],
        'days' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        'teachers' => [],
        'groups' => [],
        'rooms' => [],
        'subjects' => [],
        'loads' => [],
        'slots' => [],
        'rules' => ['critical' => [], 'teacherSite' => [], 'room' => [], 'block' => []],
    ];
    $slots = is_array($input['slots'] ?? null) ? $input['slots'] : ($data['slots'] ?? []);
    $name = trim((string)($input['name'] ?? ($data['project']['name'] ?? 'Horario EPQA')));
    $institution = trim((string)($input['institution_name'] ?? ($data['project']['institution'] ?? $data['project']['name'] ?? '')));
    $plan = epqa_plan_for_user($pdo, $userId);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO horario_schedules (user_id, name, institution_name, status, plan_scope, metadata)
             VALUES (:user_id, :name, :institution_name, "draft", :plan_scope, :metadata)'
        );
        $stmt->execute([
            'user_id' => $userId,
            'name' => $name !== '' ? $name : 'Horario EPQA',
            'institution_name' => $institution !== '' ? $institution : null,
            'plan_scope' => $plan['plan_code'] ?? 'free',
            'metadata' => epqa_json_value(['createdFrom' => $input['createdFrom'] ?? 'manual']),
        ]);
        $scheduleId = (int)$pdo->lastInsertId();
        $snapshot = ['data' => $data, 'slots' => $slots, 'audit' => $input['audit'] ?? null];
        epqa_insert_version($pdo, $scheduleId, $userId, $snapshot, $input['audit'] ?? null, 'CREATE_SCHEDULE', $name);
        epqa_log_decision($pdo, $scheduleId, $userId, 'CREATE_SCHEDULE', $snapshot, [], 'Creacion de horario');
        $pdo->commit();
        epqa_json(['ok' => true, 'id' => $scheduleId, 'message' => 'Horario creado.']);
    } catch (Throwable $exception) {
        $pdo->rollBack();
        epqa_json(['ok' => false, 'error' => 'No fue posible crear el horario.'], 500);
    }
}

if ($action === 'duplicate') {
    $sourceId = (int)($input['schedule_id'] ?? 0);
    $source = epqa_assert_schedule_belongs($pdo, $sourceId, $userId);
    $limit = epqa_can_create_schedule($pdo, $userId);
    if (!$limit['allowed']) {
        epqa_limit_response($limit);
    }
    $snapshot = epqa_latest_snapshot($pdo, $sourceId, $userId) ?? [];
    $name = trim((string)($input['name'] ?? ('Copia de ' . $source['name'])));

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO horario_schedules (user_id, name, institution_name, status, plan_scope, metadata)
             VALUES (:user_id, :name, :institution_name, "draft", :plan_scope, :metadata)'
        );
        $stmt->execute([
            'user_id' => $userId,
            'name' => $name,
            'institution_name' => $source['institution_name'],
            'plan_scope' => $source['plan_scope'],
            'metadata' => $source['metadata'] ?? null,
        ]);
        $newId = (int)$pdo->lastInsertId();
        epqa_insert_version($pdo, $newId, $userId, $snapshot, $snapshot['audit'] ?? null, 'DUPLICATE_SCHEDULE', $name);
        epqa_log_decision($pdo, $newId, $userId, 'DUPLICATE_SCHEDULE', ['source_schedule_id' => $sourceId], [], 'Duplicacion de horario');
        $pdo->commit();
        epqa_json(['ok' => true, 'id' => $newId, 'message' => 'Horario duplicado.']);
    } catch (Throwable $exception) {
        $pdo->rollBack();
        epqa_json(['ok' => false, 'error' => 'No fue posible duplicar el horario.'], 500);
    }
}

if ($action === 'delete') {
    $scheduleId = (int)($input['schedule_id'] ?? 0);
    epqa_assert_schedule_belongs($pdo, $scheduleId, $userId);
    $stmt = $pdo->prepare('UPDATE horario_schedules SET deleted_at = NOW(), status = "archived" WHERE id = :id AND user_id = :user_id');
    $stmt->execute(['id' => $scheduleId, 'user_id' => $userId]);
    epqa_log_decision($pdo, $scheduleId, $userId, 'DELETE_SCHEDULE', [], [], 'Eliminacion logica de horario');
    epqa_json(['ok' => true, 'message' => 'Horario eliminado.']);
}

epqa_json(['ok' => false, 'error' => 'Accion no soportada.'], 400);

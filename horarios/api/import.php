<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

epqa_require_method('POST');
if (!epqa_can_edit()) {
    epqa_json(['ok' => false, 'error' => 'Rol sin permiso de importacion.'], 403);
}

$input = epqa_input();
$requestedScheduleId = (int)($input['schedule_id'] ?? 0);
$replaceExisting = (bool)($input['replace_existing'] ?? false);
if (isset($input['data']) && is_array($input['data'])) {
    $input = $input['data'];
}

$hasProject = isset($input['project']) && is_array($input['project']);
$hasAssignments = isset($input['assignments']) && is_array($input['assignments']);
$hasLoads = isset($input['loads']) && is_array($input['loads']);
$hasGroupsWithLoads = false;
foreach (($input['groups'] ?? []) as $group) {
    if (is_array($group) && isset($group['loads']) && is_array($group['loads'])) {
        $hasGroupsWithLoads = true;
        break;
    }
}
$hasProtectedLoads = isset($input['protectedTeacherSubjectGroupLoads']) && is_array($input['protectedTeacherSubjectGroupLoads']);

if (!$hasProject) {
    epqa_json(['ok' => false, 'error' => 'El JSON no trae project. Debe pegar el objeto completo, iniciando con { y terminando con }.'], 422);
}

if (!$hasAssignments && !$hasLoads && !$hasGroupsWithLoads && !$hasProtectedLoads) {
    epqa_json([
        'ok' => false,
        'error' => 'No encontre datos de horario. Incluya assignments, loads, groups[].loads o protectedTeacherSubjectGroupLoads.',
        'receivedKeys' => array_keys($input),
    ], 422);
}

$userId = epqa_current_user_id();
$pdo = epqa_db();
$scheduleId = $requestedScheduleId;

if ($pdo instanceof PDO && epqa_table_exists($pdo, 'horario_schedules')) {
    if ($scheduleId > 0) {
        epqa_assert_schedule_belongs($pdo, $scheduleId, $userId);
    } else {
        $limit = epqa_can_create_schedule($pdo, $userId);
        if (!$limit['allowed'] && !$replaceExisting) {
            epqa_json([
                'ok' => false,
                'code' => 'FREE_IMPORT_LIMIT_REACHED',
                'message' => 'Tu plan gratuito permite crear un horario. Puedes reemplazar tu horario existente, cancelar o actualizar tu plan.',
                'limit' => $limit,
            ], 403);
        }

        if (!$limit['allowed'] && $replaceExisting) {
            $stmt = $pdo->prepare('SELECT id FROM horario_schedules WHERE user_id = :user_id AND deleted_at IS NULL ORDER BY updated_at DESC, id DESC LIMIT 1');
            $stmt->execute(['user_id' => $userId]);
            $scheduleId = (int)$stmt->fetchColumn();
            if ($scheduleId <= 0) {
                epqa_limit_response($limit);
            }
        } else {
            $plan = epqa_plan_for_user($pdo, $userId);
            $stmt = $pdo->prepare(
                'INSERT INTO horario_schedules (user_id, name, institution_name, status, plan_scope, metadata)
                 VALUES (:user_id, :name, :institution_name, "draft", :plan_scope, :metadata)'
            );
            $stmt->execute([
                'user_id' => $userId,
                'name' => (string)($input['project']['name'] ?? 'Horario importado'),
                'institution_name' => (string)($input['project']['institution'] ?? $input['project']['name'] ?? ''),
                'plan_scope' => $plan['plan_code'] ?? 'free',
                'metadata' => epqa_json_value(['createdFrom' => 'json-import']),
            ]);
            $scheduleId = (int)$pdo->lastInsertId();
        }
    }

    $snapshot = ['data' => $input, 'slots' => $input['slots'] ?? [], 'audit' => null];
    epqa_insert_version($pdo, $scheduleId, $userId, $snapshot, null, $replaceExisting ? 'REPLACE_IMPORT_JSON' : 'IMPORT_JSON', (string)($input['project']['name'] ?? 'Importacion JSON'));
    epqa_log_import_export($pdo, $scheduleId, $userId, 'import', 'json', null, $input, [
        'assignments' => $hasAssignments ? count($input['assignments']) : 0,
        'loads' => $hasLoads ? count($input['loads']) : ($hasProtectedLoads ? count($input['protectedTeacherSubjectGroupLoads']) : 0),
    ]);
    epqa_log_decision($pdo, $scheduleId, $userId, $replaceExisting ? 'REPLACE_IMPORT_JSON' : 'IMPORT_JSON', $snapshot, [], 'Importacion JSON');
}

$_SESSION['epqa_import_' . $userId] = $input;
epqa_json([
    'ok' => true,
    'schedule_id' => $scheduleId ?: null,
    'message' => $scheduleId ? 'JSON validado y asociado a tu horario.' : 'JSON validado y cargado en sesion.',
    'assignments' => $hasAssignments ? count($input['assignments']) : 0,
    'loads' => $hasLoads ? count($input['loads']) : ($hasProtectedLoads ? count($input['protectedTeacherSubjectGroupLoads']) : 0),
    'groupsWithLoads' => $hasGroupsWithLoads,
]);

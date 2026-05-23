<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

epqa_require_method('POST');
if (!epqa_can_edit()) {
    epqa_json(['ok' => false, 'error' => 'Rol sin permiso de edicion.'], 403);
}

$input = epqa_input();
$counts = is_array($input['counts'] ?? null) ? $input['counts'] : ['P0' => 0, 'P1' => 0, 'P2' => 0];
$final = (bool)($input['final'] ?? false);
$userId = epqa_current_user_id();
$scheduleId = (int)($input['schedule_id'] ?? 0);

if ($final && (int)($counts['P0'] ?? 0) > 0) {
    epqa_json(['ok' => false, 'error' => 'No se puede marcar FINAL con conflictos P0 en NO CUMPLE.'], 409);
}

$pdo = epqa_db();
if ($pdo instanceof PDO && epqa_table_exists($pdo, 'horario_schedules')) {
    if ($scheduleId <= 0) {
        epqa_json(['ok' => false, 'error' => 'Seleccione un horario antes de guardar version.'], 422);
    }
    epqa_assert_schedule_belongs($pdo, $scheduleId, $userId);
    $status = $final ? 'finalized' : ((int)($counts['P0'] ?? 0) > 0 ? 'auditing' : 'publishable');
    $snapshot = is_array($input['snapshot'] ?? null) ? $input['snapshot'] : [];
    epqa_insert_version($pdo, $scheduleId, $userId, $snapshot, ['counts' => $counts], $final ? 'SAVE_FINAL_VERSION' : 'SAVE_DRAFT_VERSION');
    $stmt = $pdo->prepare('UPDATE horario_schedules SET status = :status, updated_at = NOW() WHERE id = :id AND user_id = :user_id');
    $stmt->execute(['status' => $status, 'id' => $scheduleId, 'user_id' => $userId]);
    epqa_log_decision($pdo, $scheduleId, $userId, $final ? 'SAVE_FINAL_VERSION' : 'SAVE_DRAFT_VERSION', $snapshot, [], 'Guardado de version');
}

$_SESSION['epqa_version_' . $userId] = [
    'status' => $final ? 'FINAL' : 'DRAFT',
    'counts' => $counts,
    'snapshot' => $input['snapshot'] ?? [],
    'schedule_id' => $scheduleId ?: null,
    'createdAt' => date('c'),
];

epqa_json([
    'ok' => true,
    'status' => $_SESSION['epqa_version_' . $userId]['status'],
    'schedule_id' => $scheduleId ?: null,
    'message' => $final ? 'Version FINAL registrada.' : 'Version borrador registrada.',
]);

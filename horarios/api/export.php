<?php

// Archivo: export.php
// Guardado: 2026-05-23 11:21:41
// Autor: Andrés Lizcano
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$userId = epqa_current_user_id();
$scheduleId = (int)($_GET['schedule_id'] ?? 0);
$kind = (string)($_GET['kind'] ?? 'backup');
$pdo = epqa_db();

if (!$pdo instanceof PDO || !epqa_table_exists($pdo, 'horario_schedules')) {
    epqa_json([
        'ok' => false,
        'mode' => 'database-missing',
        'error' => 'No hay base de datos multiusuario activa para exportar horarios.',
    ], 503);
}

if ($scheduleId <= 0) {
    epqa_json(['ok' => false, 'error' => 'Falta schedule_id.'], 422);
}

$schedule = epqa_assert_schedule_belongs($pdo, $scheduleId, $userId);
$plan = epqa_plan_for_user($pdo, $userId);
if (!(bool)($plan['can_export'] ?? true)) {
    epqa_json(['ok' => false, 'error' => 'Tu plan actual no permite exportar.'], 403);
}

$snapshot = epqa_latest_snapshot($pdo, $scheduleId, $userId) ?? [];
$data = $snapshot['data'] ?? $snapshot;
$payload = match ($kind) {
    'institution' => [
        'project' => $data['project'] ?? [],
        'sites' => $data['sites'] ?? [],
        'rooms' => $data['rooms'] ?? [],
        'days' => $data['days'] ?? [],
    ],
    'loads' => [
        'project' => $data['project'] ?? [],
        'loads' => $data['loads'] ?? [],
        'teachers' => $data['teachers'] ?? [],
        'groups' => $data['groups'] ?? [],
        'subjects' => $data['subjects'] ?? [],
    ],
    'audit' => [
        'schedule' => $schedule,
        'audit' => $snapshot['audit'] ?? [],
    ],
    'complete' => $data,
    default => [
        'schemaVersion' => '1.0.0',
        'module' => 'EPQA_Horarios_Inteligentes',
        'schedule' => $schedule,
        'data' => $data,
        'slots' => $snapshot['slots'] ?? ($data['slots'] ?? []),
        'audit' => $snapshot['audit'] ?? null,
    ],
};

epqa_log_import_export($pdo, $scheduleId, $userId, 'export', 'json', 'epqa_horario_' . $scheduleId . '_' . $kind . '.json', [], [
    'kind' => $kind,
    'schedule_id' => $scheduleId,
]);
epqa_log_decision($pdo, $scheduleId, $userId, 'EXPORT_JSON', ['kind' => $kind], [], 'Exportacion JSON');

epqa_json([
    'ok' => true,
    'schedule_id' => $scheduleId,
    'kind' => $kind,
    'file_name' => 'epqa_horario_' . $scheduleId . '_' . $kind . '.json',
    'data' => $payload,
]);

<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/includes/session.php';
require_once dirname(__DIR__, 2) . '/includes/auth.php';

start_secure_session();

const EPQA_INSTITUTION_ID = 1;

function epqa_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function epqa_seed_path(): string
{
    return dirname(__DIR__) . '/data/horario_seed_epqa.json';
}

function epqa_seed(): array
{
    $json = file_get_contents(epqa_seed_path());
    if ($json === false) {
        epqa_json(['ok' => false, 'error' => 'No se encontro el JSON semilla.'], 500);
    }
    $data = json_decode($json, true);
    if (!is_array($data)) {
        epqa_json(['ok' => false, 'error' => 'JSON semilla invalido.'], 500);
    }
    return $data;
}

function epqa_db(): ?PDO
{
    $configFile = dirname(__DIR__, 2) . '/config/database.php';
    if (!is_file($configFile)) {
        return null;
    }
    require_once $configFile;
    try {
        return getConnection();
    } catch (Throwable $exception) {
        return null;
    }
}

function epqa_table_exists(PDO $pdo, string $table): bool
{
    try {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table');
        $stmt->execute(['table' => $table]);
        return (int)$stmt->fetchColumn() > 0;
    } catch (Throwable $exception) {
        return false;
    }
}

function epqa_json_value(array $value): string
{
    return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';
}

function getCurrentUserId(): int
{
    $id = user_id();
    if ($id === null || $id <= 0) {
        epqa_json(['ok' => false, 'error' => 'Debes iniciar sesion para usar horarios.'], 401);
    }
    return $id;
}

function epqa_current_user_id(): int
{
    return getCurrentUserId();
}

function epqa_current_user(): array
{
    $user = current_user();
    if (!$user) {
        getCurrentUserId();
    }
    return $user ?: ['id' => getCurrentUserId(), 'full_name' => 'Usuario EPQA', 'role' => 'user'];
}

function epqa_require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== $method) {
        epqa_json(['ok' => false, 'error' => 'Metodo no permitido.'], 405);
    }
}

function epqa_input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function epqa_user(): array
{
    $user = epqa_current_user();
    return [
        'id' => (int)$user['id'],
        'name' => (string)($user['full_name'] ?? $user['email'] ?? 'Usuario EPQA'),
        'email' => (string)($user['email'] ?? ''),
        'role' => (string)($user['role'] ?? 'user'),
    ];
}

function epqa_can_edit(): bool
{
    return getCurrentUserId() > 0;
}

function epqa_plan_for_user(PDO $pdo, int $userId): array
{
    if (!epqa_table_exists($pdo, 'horario_user_limits')) {
        return [
            'plan_code' => 'free',
            'max_schedules' => 1,
            'can_create_multiple' => false,
            'can_export' => true,
        ];
    }

    $stmt = $pdo->prepare('SELECT * FROM horario_user_limits WHERE user_id = :user_id LIMIT 1');
    $stmt->execute(['user_id' => $userId]);
    $row = $stmt->fetch();
    if ($row) {
        return $row;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO horario_user_limits (user_id, plan_code, max_schedules, can_create_multiple, can_export, can_use_advanced_audit)
         VALUES (:user_id, "free", 1, 0, 1, 1)'
    );
    $stmt->execute(['user_id' => $userId]);
    return [
        'user_id' => $userId,
        'plan_code' => 'free',
        'max_schedules' => 1,
        'can_create_multiple' => false,
        'can_export' => true,
    ];
}

function epqa_count_user_schedules(PDO $pdo, int $userId): int
{
    if (!epqa_table_exists($pdo, 'horario_schedules')) {
        return 0;
    }
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM horario_schedules WHERE user_id = :user_id AND deleted_at IS NULL');
    $stmt->execute(['user_id' => $userId]);
    return (int)$stmt->fetchColumn();
}

function epqa_can_create_schedule(PDO $pdo, int $userId): array
{
    $plan = epqa_plan_for_user($pdo, $userId);
    $count = epqa_count_user_schedules($pdo, $userId);
    $max = (int)($plan['max_schedules'] ?? 1);
    $multiple = (bool)($plan['can_create_multiple'] ?? false);
    $allowed = $multiple || $max <= 0 || $count < $max;
    return ['allowed' => $allowed, 'plan' => $plan, 'count' => $count, 'max' => $max];
}

function epqa_limit_response(array $limit): void
{
    epqa_json([
        'ok' => false,
        'code' => 'FREE_LIMIT_REACHED',
        'message' => 'Tu plan gratuito permite crear un horario. Para crear más horarios, actualiza tu plan.',
        'limit' => $limit,
    ], 403);
}

function epqa_assert_schedule_belongs(PDO $pdo, int $scheduleId, int $userId): array
{
    $stmt = $pdo->prepare('SELECT * FROM horario_schedules WHERE id = :id AND user_id = :user_id AND deleted_at IS NULL LIMIT 1');
    $stmt->execute(['id' => $scheduleId, 'user_id' => $userId]);
    $schedule = $stmt->fetch();
    if (!$schedule) {
        epqa_json(['ok' => false, 'error' => 'No tienes permiso para acceder a este horario.'], 403);
    }
    return $schedule;
}

function epqa_latest_snapshot(PDO $pdo, int $scheduleId, int $userId): ?array
{
    if (!epqa_table_exists($pdo, 'horario_schedule_versions')) {
        return null;
    }
    $stmt = $pdo->prepare(
        'SELECT snapshot FROM horario_schedule_versions
         WHERE schedule_id = :schedule_id AND user_id = :user_id
         ORDER BY version_number DESC, id DESC LIMIT 1'
    );
    $stmt->execute(['schedule_id' => $scheduleId, 'user_id' => $userId]);
    $raw = $stmt->fetchColumn();
    if (!$raw) {
        return null;
    }
    $decoded = json_decode((string)$raw, true);
    return is_array($decoded) ? $decoded : null;
}

function epqa_latest_non_empty_snapshot(PDO $pdo, int $scheduleId, int $userId): ?array
{
    if (!epqa_table_exists($pdo, 'horario_schedule_versions')) {
        return null;
    }
    $stmt = $pdo->prepare(
        'SELECT snapshot FROM horario_schedule_versions
         WHERE schedule_id = :schedule_id AND user_id = :user_id
         ORDER BY version_number DESC, id DESC'
    );
    $stmt->execute(['schedule_id' => $scheduleId, 'user_id' => $userId]);
    while (($raw = $stmt->fetchColumn()) !== false) {
        if (!$raw) {
            continue;
        }
        $decoded = json_decode((string)$raw, true);
        if (is_array($decoded) && epqa_snapshot_has_data($decoded)) {
            return $decoded;
        }
    }
    return null;
}

function epqa_snapshot_has_data(array $snapshot): bool
{
    $data = isset($snapshot['data']) && is_array($snapshot['data']) ? $snapshot['data'] : $snapshot;
    if (!is_array($data)) {
        return false;
    }
    $teachers = is_array($data['teachers'] ?? null) ? count($data['teachers']) : 0;
    $loads = is_array($data['loads'] ?? null) ? count($data['loads']) : 0;
    $subjects = is_array($data['subjects'] ?? null) ? count($data['subjects']) : 0;
    $sites = is_array($data['sites'] ?? null) ? count($data['sites']) : 0;
    $rooms = is_array($data['rooms'] ?? null) ? count($data['rooms']) : 0;
    $slots = is_array($data['slots'] ?? null) ? count($data['slots']) : 0;
    $groups = 0;
    if (is_array($data['groups'] ?? null)) {
        $groups = count($data['groups']);
    } elseif (is_array($data['groups']['primary'] ?? null) || is_array($data['groups']['secondary'] ?? null)) {
        $groups = count($data['groups']['primary'] ?? []) + count($data['groups']['secondary'] ?? []);
    }
    $project = is_array($data['project'] ?? null) ? $data['project'] : [];
    $projectText = trim((string)($project['institution'] ?? $project['name'] ?? $data['institution_name'] ?? $data['institution'] ?? $data['name'] ?? ''));
    $rules = is_array($data['rules'] ?? null) ? $data['rules'] : [];
    $general = is_array($rules['general'] ?? null) ? $rules['general'] : [];
    $hasMeaningfulRules =
        !empty($rules['critical']) ||
        !empty($rules['teacherSite']) ||
        !empty($rules['room']) ||
        !empty($rules['block']) ||
        !empty($general['dailyExceptions']) ||
        ((int)($general['maxTeacherHoursPerDay'] ?? 6) !== 6);
    return (bool)($teachers || $groups || $subjects || $loads || $sites || $rooms || $slots || $projectText !== '' || $hasMeaningfulRules);
}

function epqa_next_version_number(PDO $pdo, int $scheduleId, int $userId): int
{
    $stmt = $pdo->prepare('SELECT COALESCE(MAX(version_number), 0) + 1 FROM horario_schedule_versions WHERE schedule_id = :schedule_id AND user_id = :user_id');
    $stmt->execute(['schedule_id' => $scheduleId, 'user_id' => $userId]);
    return (int)$stmt->fetchColumn();
}

function epqa_insert_version(PDO $pdo, int $scheduleId, int $userId, array $snapshot, ?array $audit, string $action, ?string $name = null): int
{
    $version = epqa_next_version_number($pdo, $scheduleId, $userId);
    $stmt = $pdo->prepare(
        'INSERT INTO horario_schedule_versions (schedule_id, user_id, version_number, name, snapshot, audit_summary, created_by_action)
         VALUES (:schedule_id, :user_id, :version_number, :name, :snapshot, :audit_summary, :action)'
    );
    $stmt->execute([
        'schedule_id' => $scheduleId,
        'user_id' => $userId,
        'version_number' => $version,
        'name' => $name,
        'snapshot' => epqa_json_value($snapshot),
        'audit_summary' => $audit ? epqa_json_value($audit) : null,
        'action' => $action,
    ]);
    $versionId = (int)$pdo->lastInsertId();
    $stmt = $pdo->prepare('UPDATE horario_schedules SET active_version_id = :version_id, updated_at = NOW() WHERE id = :schedule_id AND user_id = :user_id');
    $stmt->execute(['version_id' => $versionId, 'schedule_id' => $scheduleId, 'user_id' => $userId]);
    return $versionId;
}

function epqa_log_decision(PDO $pdo, int $scheduleId, int $userId, string $action, array $after = [], array $before = [], ?string $justification = null): void
{
    if (!epqa_table_exists($pdo, 'horario_decision_log')) {
        return;
    }
    $stmt = $pdo->prepare(
        'INSERT INTO horario_decision_log (schedule_id, user_id, action_type, before_state, after_state, justification)
         VALUES (:schedule_id, :user_id, :action_type, :before_state, :after_state, :justification)'
    );
    $stmt->execute([
        'schedule_id' => $scheduleId,
        'user_id' => $userId,
        'action_type' => $action,
        'before_state' => $before ? epqa_json_value($before) : null,
        'after_state' => $after ? epqa_json_value($after) : null,
        'justification' => $justification,
    ]);
}

function epqa_log_import_export(PDO $pdo, ?int $scheduleId, int $userId, string $type, string $format, ?string $fileName, array $payload, array $summary, string $status = 'success', ?string $message = null): void
{
    if (!epqa_table_exists($pdo, 'horario_import_exports')) {
        return;
    }
    $stmt = $pdo->prepare(
        'INSERT INTO horario_import_exports (schedule_id, user_id, type, format, file_name, payload, summary, status, message)
         VALUES (:schedule_id, :user_id, :type, :format, :file_name, :payload, :summary, :status, :message)'
    );
    $stmt->execute([
        'schedule_id' => $scheduleId,
        'user_id' => $userId,
        'type' => $type,
        'format' => $format,
        'file_name' => $fileName,
        'payload' => $payload ? epqa_json_value($payload) : null,
        'summary' => $summary ? epqa_json_value($summary) : null,
        'status' => $status,
        'message' => $message,
    ]);
}

function epqa_slug(string $text): string
{
    $text = strtolower(trim($text));
    $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text) ?: $text;
    $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?: $text;
    return trim($text, '-');
}

function epqa_key(?string $text): string
{
    $text = trim((string)$text);
    $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
    $text = $ascii !== false ? $ascii : $text;
    $text = str_replace('_', ' ', $text);
    $text = preg_replace('/\s+/', ' ', $text) ?: $text;
    return strtoupper($text);
}

function epqa_is_ti_subject(?string $subject): bool
{
    $key = epqa_key($subject);
    return str_contains($key, 'TECNOLOGIA E INFORMATICA')
        || $key === 'DPC'
        || str_contains($key, 'EMPRENDIMIENTO')
        || str_contains($key, 'PENSAMIENTO COMPUTACIONAL');
}

function epqa_is_pe_subject(?string $subject): bool
{
    $key = epqa_key($subject);
    return $key === 'EDUFISICA' || str_contains($key, 'EDUCACION FISICA');
}

function epqa_is_ti_room(?string $room): bool
{
    $key = epqa_key($room);
    return str_contains($key, 'SALA TI') || str_contains($key, 'SALA_TI');
}

function epqa_is_court_room(?string $room): bool
{
    $key = epqa_key($room);
    return str_contains($key, 'CANCHA') || str_contains($key, 'ESPACIO ALTERNO EF');
}

function epqa_is_protected_room(?string $room): bool
{
    return epqa_is_ti_room($room) || epqa_is_court_room($room);
}

function epqa_map_seed(array $seed): array
{
    $teachers = [];
    foreach ($seed['teachers'] ?? [] as $teacher) {
        $teachers[$teacher['name']] = $teacher;
    }

    $rooms = [];
    foreach ($seed['rooms'] ?? [] as $room) {
        $rooms[$room['name']] = $room;
    }

    $loads = [];
    foreach ($seed['assignments'] ?? [] as $load) {
        $loads[$load['id']] = $load;
    }

    $slots = [];
    foreach ($seed['initialSlots'] ?? [] as $index => $slot) {
        if (!isset($loads[$slot['loadId']])) {
            continue;
        }
        $load = $loads[$slot['loadId']];
        $slots[] = [
            'id' => 'slot-' . ($index + 1),
            'loadId' => $slot['loadId'],
            'day' => $slot['day'],
            'period' => (int)$slot['period'],
            'group' => $load['group'],
            'level' => $load['level'],
            'subject' => $load['subject'],
            'teacher' => $load['teacher'],
            'room' => $load['room'],
            'site' => $load['site'],
            'source' => 'seed',
            'locked' => false,
        ];
    }

    return [
        'project' => $seed['project'] ?? [],
        'sites' => $seed['sites'] ?? [],
        'days' => $seed['days'] ?? [],
        'periods' => $seed['periods'] ?? [],
        'groups' => $seed['groups'] ?? [],
        'rooms' => $seed['rooms'] ?? [],
        'teachers' => $seed['teachers'] ?? [],
        'subjects' => $seed['subjects'] ?? [],
        'loads' => array_values($loads),
        'slots' => $slots,
        'rules' => [
            'critical' => $seed['criticalRules'] ?? [],
            'teacherSite' => $seed['teacherSiteRules'] ?? [],
            'room' => $seed['roomRules'] ?? [],
            'block' => $seed['blockRules'] ?? [],
        ],
    ];
}

<?php
declare(strict_types=1);

session_name('EPQA_HORARIOS');
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

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
    if (empty($_SESSION['epqa_user'])) {
        $_SESSION['epqa_user'] = [
            'id' => 1,
            'name' => 'Administrador EPQA',
            'role' => 'admin',
        ];
    }
    return $_SESSION['epqa_user'];
}

function epqa_can_edit(): bool
{
    $role = epqa_user()['role'] ?? 'visor';
    return in_array($role, ['admin', 'editor'], true);
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

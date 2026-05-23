<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

epqa_json([
    'ok' => true,
    'mode' => epqa_db() instanceof PDO ? 'database-ready' : 'empty',
    'user' => epqa_user(),
    'data' => [
        'project' => ['name' => '', 'institution' => ''],
        'sites' => [],
        'days' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        'teachers' => [],
        'groups' => [],
        'rooms' => [],
        'subjects' => [],
        'loads' => [],
        'slots' => [],
        'rules' => ['critical' => [], 'teacherSite' => [], 'room' => [], 'block' => []],
    ],
]);

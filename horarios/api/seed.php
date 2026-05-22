<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$seed = epqa_seed();
epqa_json([
    'ok' => true,
    'mode' => epqa_db() instanceof PDO ? 'database-ready' : 'seed-demo',
    'user' => epqa_user(),
    'data' => epqa_map_seed($seed),
]);

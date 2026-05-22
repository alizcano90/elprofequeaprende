<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$seed = epqa_map_seed(epqa_seed());
epqa_json([
    'ok' => true,
    'message' => 'La exportacion PDF/Excel se genera en el navegador con jsPDF y SheetJS.',
    'sheets' => ['Base', 'Matriz_Grados', 'Matriz_Profes', 'Auditoria'],
    'data' => $seed,
]);

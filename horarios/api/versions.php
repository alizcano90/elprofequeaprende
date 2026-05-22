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

if ($final && (int)($counts['P0'] ?? 0) > 0) {
    epqa_json(['ok' => false, 'error' => 'No se puede marcar FINAL con conflictos P0 en NO CUMPLE.'], 409);
}

$_SESSION['epqa_version'] = [
    'status' => $final ? 'FINAL' : 'DRAFT',
    'counts' => $counts,
    'snapshot' => $input['snapshot'] ?? [],
    'createdAt' => date('c'),
];

epqa_json([
    'ok' => true,
    'status' => $_SESSION['epqa_version']['status'],
    'message' => $final ? 'Version FINAL registrada.' : 'Version borrador registrada.',
]);

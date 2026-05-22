<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

epqa_require_method('POST');
if (!epqa_can_edit()) {
    epqa_json(['ok' => false, 'error' => 'Rol sin permiso de importacion.'], 403);
}

$input = epqa_input();
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

$_SESSION['epqa_import'] = $input;
epqa_json([
    'ok' => true,
    'message' => 'JSON validado y cargado en sesion. Para persistir, ejecute el SQL y conecte MySQL.',
    'assignments' => $hasAssignments ? count($input['assignments']) : 0,
    'loads' => $hasLoads ? count($input['loads']) : ($hasProtectedLoads ? count($input['protectedTeacherSubjectGroupLoads']) : 0),
    'groupsWithLoads' => $hasGroupsWithLoads,
]);

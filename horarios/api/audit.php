<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

epqa_require_method('POST');
$input = epqa_input();
$userId = epqa_current_user_id();
$scheduleId = (int)($input['schedule_id'] ?? 0);
$pdo = epqa_db();
if ($scheduleId > 0 && $pdo instanceof PDO && epqa_table_exists($pdo, 'horario_schedules')) {
    epqa_assert_schedule_belongs($pdo, $scheduleId, $userId);
}
$slots = is_array($input['slots'] ?? null) ? $input['slots'] : [];
$loads = is_array($input['loads'] ?? null) ? $input['loads'] : [];
$rules = is_array($input['rules'] ?? null) ? $input['rules'] : [];

function epqa_day_name(string $day): string
{
    $key = epqa_key($day);
    return [
        'LUNES' => 'Lunes',
        'MARTES' => 'Martes',
        'MIERCOLES' => 'Miercoles',
        'JUEVES' => 'Jueves',
        'VIERNES' => 'Viernes',
    ][$key] ?? $day;
}

function epqa_teacher_match(string $a, string $b): bool
{
    $left = epqa_key($a);
    $right = epqa_key($b);
    return $left === $right || ($left !== '' && $right !== '' && (str_starts_with($left, $right) || str_starts_with($right, $left)));
}

function epqa_slot_duration(array $slot): int
{
    return max(1, (int)($slot['duration'] ?? 1));
}

function epqa_rule_day_matches(array $rule, string $day): bool
{
    $ruleDay = (string)($rule['day'] ?? '');
    return $ruleDay === '__ALL_DAYS__' || epqa_day_name($ruleDay) === $day;
}

$weekDays = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

$loadById = [];
foreach ($loads as $load) {
    if (isset($load['id'])) {
        $loadById[(string)$load['id']] = $load;
    }
}

$results = [];
$counts = ['P0' => 0, 'P1' => 0, 'P2' => 0];

$add = static function (string $priority, string $code, string $status, string $explanation, string $suggestion = '') use (&$results, &$counts): void {
    if ($status === 'NO CUMPLE') {
        $counts[$priority]++;
    }
    $results[] = [
        'priority' => $priority,
        'code' => $code,
        'status' => $status,
        'explanation' => $explanation,
        'suggestion' => $suggestion,
    ];
};

$teacherTime = [];
$groupTime = [];
$roomTime = [];
foreach ($slots as $slot) {
    $day = epqa_day_name((string)($slot['day'] ?? ''));
    $time = $day . '-' . ($slot['period'] ?? '');
    $teacherKey = ($slot['teacher'] ?? '') . '-' . $time;
    $groupKey = ($slot['group'] ?? '') . '-' . $time;
    $room = (string)($slot['room'] ?? '');
    $roomKey = $room . '-' . ($slot['site'] ?? '') . '-' . $time;

    $teacherTime[$teacherKey][] = $slot;
    $groupTime[$groupKey][] = $slot;
    if (epqa_is_protected_room($room)) {
        $roomTime[$roomKey][] = $slot;
    }

    $load = $loadById[(string)($slot['loadId'] ?? '')] ?? null;
    if (!$load) {
        foreach ($loads as $candidate) {
            if (
                epqa_teacher_match((string)($slot['teacher'] ?? ''), (string)($candidate['teacher'] ?? '')) &&
                epqa_key((string)($slot['subject'] ?? '')) === epqa_key((string)($candidate['subject'] ?? '')) &&
                (string)($slot['group'] ?? '') === (string)($candidate['group'] ?? '')
            ) {
                $load = $candidate;
                break;
            }
        }
    }
    if (!$load) {
        $add('P0', 'keep-original-load', 'NO CUMPLE', 'Hay una celda sin carga docente original asociada.', 'Use una carga registrada antes de ubicarla.');
        continue;
    }
    foreach (['teacher', 'subject', 'group'] as $field) {
        $matches = $field === 'teacher'
            ? epqa_teacher_match((string)($slot[$field] ?? ''), (string)($load[$field] ?? ''))
            : (($slot[$field] ?? null) === ($load[$field] ?? null));
        if (!$matches) {
            $add('P0', 'keep-original-load', 'NO CUMPLE', 'Intento de reasignar ' . $field . ' en ' . ($slot['loadId'] ?? 'sin id') . '.', 'Solicite confirmacion explicita y cree una version auditada.');
        }
    }
    if (epqa_is_ti_subject((string)($slot['subject'] ?? '')) && !epqa_is_ti_room((string)($slot['room'] ?? ''))) {
        $add('P0', 'room-ti', 'NO CUMPLE', ($slot['subject'] ?? 'Materia TI') . ' debe estar en Sala TI.', 'Mueva la clase a Sala TI o libere la franja.');
    }
    if (epqa_is_pe_subject((string)($slot['subject'] ?? '')) && !epqa_is_court_room((string)($slot['room'] ?? ''))) {
        $add('P0', 'pe-room', 'NO CUMPLE', 'Educacion Fisica debe estar en Cancha.', 'Ubique el bloque en Cancha.');
    }
}

foreach ($rules['teacherSite'] ?? [] as $siteRule) {
    foreach ($slots as $slot) {
        if (($slot['teacher'] ?? '') !== ($siteRule['teacher'] ?? '')) {
            continue;
        }
        $slotDay = epqa_day_name((string)($slot['day'] ?? ''));
        $expectedSite = $siteRule['days'][$slotDay] ?? $siteRule['days'][$slot['day'] ?? ''] ?? null;
        if ($expectedSite && ($slot['site'] ?? '') !== $expectedSite) {
            $add('P0', 'teacher-site', 'NO CUMPLE', ($slot['teacher'] ?? 'Docente') . ' debe estar en sede ' . $expectedSite . ' el dia ' . $slotDay, 'Respete la sede inamovible del docente viajero.');
        }
    }
}

foreach ($teacherTime as $items) {
    if (count($items) > 1) {
        $add('P0', 'no-teacher-overlap', 'NO CUMPLE', $items[0]['teacher'] . ' tiene dos clases en la misma franja.', 'Mueva una de las clases a otra hora.');
    }
}
foreach ($groupTime as $items) {
    if (count($items) > 1) {
        $add('P0', 'no-group-overlap', 'NO CUMPLE', $items[0]['group'] . ' tiene dos clases simultaneas.', 'Deje solo una clase por grupo y franja.');
    }
}
foreach ($roomTime as $items) {
    if (count($items) > 1) {
        $add('P0', 'no-room-overlap', 'NO CUMPLE', $items[0]['room'] . ' esta ocupada por mas de una clase.', 'Libere el espacio o cambie la franja.');
    }
}

$maxTeacherHoursPerDay = max(1, (int)($rules['general']['maxTeacherHoursPerDay'] ?? $rules['maxTeacherHoursPerDay'] ?? 6));
$dailyExceptions = is_array($rules['general']['dailyExceptions'] ?? null) ? $rules['general']['dailyExceptions'] : [];
$teacherDayHours = [];
foreach ($slots as $slot) {
    $key = (string)($slot['teacher'] ?? '') . '|' . epqa_day_name((string)($slot['day'] ?? ''));
    $teacherDayHours[$key] = ($teacherDayHours[$key] ?? 0) + epqa_slot_duration($slot);
}
foreach ($teacherDayHours as $key => $hours) {
    [$teacher, $day] = explode('|', $key, 2);
    $allowed = $maxTeacherHoursPerDay;
    foreach ($dailyExceptions as $rule) {
        if (($rule['type'] ?? '') === 'allow' && epqa_teacher_match($teacher, (string)($rule['teacher'] ?? '')) && epqa_rule_day_matches($rule, $day)) {
            $allowed = max($allowed, (int)($rule['hours'] ?? $allowed));
        }
    }
    if ($hours > $allowed) {
        $add('P0', 'max-teacher-hours-day', 'NO CUMPLE', $teacher . ' tiene ' . $hours . 'h el dia ' . $day . '; el maximo permitido es ' . $allowed . 'h.', 'Distribuya la carga del docente en otro dia o cree una excepcion.');
    }
}
foreach ($dailyExceptions as $rule) {
    if (($rule['type'] ?? '') !== 'require') {
        continue;
    }
    $teacher = (string)($rule['teacher'] ?? '');
    $day = epqa_day_name((string)($rule['day'] ?? ''));
    if ((string)($rule['day'] ?? '') === '__ALL_DAYS__') {
        continue;
    }
    $required = (int)($rule['hours'] ?? 0);
    $current = 0;
    foreach ($teacherDayHours as $key => $hours) {
        [$currentTeacher, $currentDay] = explode('|', $key, 2);
        if (epqa_teacher_match($currentTeacher, $teacher) && $currentDay === $day) {
            $current = $hours;
            break;
        }
    }
    if ($required > 0 && $current !== $required) {
        $priority = in_array(($rule['priority'] ?? 'P0'), ['P0', 'P1', 'P2'], true) ? (string)$rule['priority'] : 'P0';
        $add($priority, 'required-teacher-hours-day', 'NO CUMPLE', $teacher . ' debe tener exactamente ' . $required . 'h el dia ' . $day . '; actualmente tiene ' . $current . 'h.', 'Ajuste la jornada del docente para cumplir la excepcion.');
    }
}

$byLoadDay = [];
foreach ($slots as $slot) {
    $period = (int)($slot['period'] ?? 0);
    for ($offset = 0; $offset < epqa_slot_duration($slot); $offset++) {
        $byLoadDay[($slot['loadId'] ?? '') . '-' . epqa_day_name((string)($slot['day'] ?? ''))][] = $period + $offset;
    }
}
foreach ($loads as $load) {
    $subject = (string)($load['subject'] ?? '');
    if (epqa_is_pe_subject($subject)) {
        $ok = false;
        foreach ($byLoadDay[($load['id'] ?? '') . '-Lunes'] ?? [] as $period) {
            $periods = $byLoadDay[($load['id'] ?? '') . '-Lunes'] ?? [];
            if (in_array($period + 1, $periods, true)) {
                $ok = true;
            }
        }
        foreach (['Martes', 'Miercoles', 'Jueves', 'Viernes'] as $day) {
            $periods = $byLoadDay[($load['id'] ?? '') . '-' . $day] ?? [];
            sort($periods);
            for ($i = 0; $i < count($periods) - 1; $i++) {
                if ($periods[$i + 1] === $periods[$i] + 1) {
                    $ok = true;
                }
            }
        }
        if (!$ok && (int)($load['hours'] ?? 0) >= 2) {
            $add('P0', 'pe-block', 'NO CUMPLE', 'Educacion Fisica de ' . ($load['group'] ?? '') . ' no tiene bloque real de 2h.', 'Arrastre las dos horas a franjas consecutivas.');
        }
    }
}

$andresHours = 0;
foreach ($slots as $slot) {
    if (epqa_teacher_match((string)($slot['teacher'] ?? ''), 'ANDRES')) {
        $andresHours += epqa_slot_duration($slot);
    }
}
if ($andresHours !== 27) {
    $add('P0', 'andres-load', 'NO CUMPLE', 'Andres tiene ' . $andresHours . ' horas ubicadas; la regla exige 27.', 'Complete o repare las cargas de Andres sin reasignarlas.');
}

foreach ($rules['block'] ?? [] as $blockRule) {
    if (($blockRule['priority'] ?? '') !== 'P0') {
        continue;
    }
    foreach ($loads as $load) {
        if (($blockRule['teacher'] ?? null) && epqa_key((string)($load['teacher'] ?? '')) !== epqa_key((string)$blockRule['teacher'])) {
            continue;
        }
        if (!empty($blockRule['groups']) && !in_array((string)($load['group'] ?? ''), $blockRule['groups'], true)) {
            continue;
        }
        if (!empty($blockRule['subjects']) && !in_array(epqa_key((string)($load['subject'] ?? '')), array_map('epqa_key', $blockRule['subjects']), true)) {
            continue;
        }
        $minConsecutive = (int)($blockRule['minConsecutive'] ?? 1);
        $exactBlock = isset($blockRule['exactBlock']) ? (int)$blockRule['exactBlock'] : null;
        $ok = false;
        foreach ($weekDays as $day) {
            $periods = $byLoadDay[($load['id'] ?? '') . '-' . $day] ?? [];
            sort($periods);
            $run = 1;
            for ($i = 1; $i < count($periods); $i++) {
                $run = ($periods[$i] === $periods[$i - 1] + 1) ? $run + 1 : 1;
                if ($run >= $minConsecutive && (!$exactBlock || $run === $exactBlock)) {
                    $ok = true;
                }
            }
        }
        if (!$ok && (int)($load['hours'] ?? 0) >= $minConsecutive) {
            $add('P0', 'block-' . ($load['id'] ?? 'load'), 'NO CUMPLE', ($load['teacher'] ?? '') . ' requiere bloque de ' . $minConsecutive . 'h en ' . ($load['group'] ?? '') . '.', 'Ubique las horas consecutivas sin cambiar docente, materia ni grupo.');
        }
    }
}

$secondaryHoursByTeacher = [];
$teacherExceptions = [];
foreach (epqa_seed()['teachers'] ?? [] as $teacher) {
    $teacherExceptions[epqa_key((string)($teacher['name'] ?? ''))] = (bool)($teacher['exceptionMin22'] ?? false);
}
foreach ($loads as $load) {
    if (($load['level'] ?? '') === 'secondary') {
        $teacher = (string)($load['teacher'] ?? '');
        $secondaryHoursByTeacher[$teacher] = ($secondaryHoursByTeacher[$teacher] ?? 0) + max(0, (int)($load['hours'] ?? 0));
    }
}
foreach ($slots as $slot) {
    if (($slot['level'] ?? '') === 'secondary') {
        $teacher = (string)($slot['teacher'] ?? '');
        $slotHours = $secondaryHoursByTeacher[$teacher . '|slots'] ?? 0;
        $secondaryHoursByTeacher[$teacher . '|slots'] = $slotHours + epqa_slot_duration($slot);
    }
}
foreach ($secondaryHoursByTeacher as $teacher => $hours) {
    if (str_ends_with((string)$teacher, '|slots')) {
        continue;
    }
    $placedHours = $secondaryHoursByTeacher[$teacher . '|slots'] ?? 0;
    $countedHours = max($hours, $placedHours);
    if ($teacher !== '' && !($teacherExceptions[epqa_key((string)$teacher)] ?? false) && $countedHours < 22) {
        $add('P0', 'secondary-min-load', 'NO CUMPLE', $teacher . ' tiene ' . $countedHours . 'h en secundaria; minimo 22h salvo excepcion.', 'Registre excepcion o complete carga sin reasignaciones indebidas.');
    }
}

$subjectDayHours = [];
foreach ($slots as $slot) {
    $key = implode('|', [
        epqa_day_name((string)($slot['day'] ?? '')),
        (string)($slot['group'] ?? ''),
        epqa_key((string)($slot['subject'] ?? '')),
    ]);
    $subjectDayHours[$key] = ($subjectDayHours[$key] ?? 0) + epqa_slot_duration($slot);
}
foreach ($subjectDayHours as $key => $hours) {
    if ($hours <= 2) {
        continue;
    }
    [$day, $group, $subjectKey] = explode('|', $key, 3);
    $subjectName = '';
    foreach ($slots as $slot) {
        if (
            epqa_day_name((string)($slot['day'] ?? '')) === $day &&
            (string)($slot['group'] ?? '') === $group &&
            epqa_key((string)($slot['subject'] ?? '')) === $subjectKey
        ) {
            $subjectName = (string)($slot['subject'] ?? $subjectKey);
            break;
        }
    }
    $add('P1', 'same-subject-day-hours', 'NO CUMPLE', $group . ' tiene ' . $hours . 'h de ' . $subjectName . ' el dia ' . $day . '.', 'Revise si esa intensidad diaria es pedagogicamente conveniente o registre excepcion.');
}

foreach ($loads as $load) {
    $strongSubjects = ['Castellano', 'Matematicas', 'Tecnologia e Informatica', 'Ingles', 'Sociales', 'Fisica', 'Quimica', 'Biologia'];
    if (($load['level'] ?? '') === 'primary' && epqa_key((string)($load['subject'] ?? '')) === 'BIOLOGIA') {
        continue;
    }
    if (in_array(epqa_key((string)($load['subject'] ?? '')), array_map('epqa_key', $strongSubjects), true) && (int)($load['hours'] ?? 0) > 2) {
        $hasBlock = false;
        foreach ($weekDays as $day) {
            $periods = $byLoadDay[($load['id'] ?? '') . '-' . $day] ?? [];
            sort($periods);
            for ($i = 0; $i < count($periods) - 1; $i++) {
                if ($periods[$i + 1] === $periods[$i] + 1) {
                    $hasBlock = true;
                }
            }
        }
        $add('P1', 'pedagogic-block', $hasBlock ? 'CUMPLE' : 'NO CUMPLE', ($load['subject'] ?? '') . ' de ' . ($load['group'] ?? '') . ' requiere al menos un bloque de 2h.', 'Ubique dos horas consecutivas si la disponibilidad lo permite.');
    }
}

if (!$results) {
    $add('P0', 'base', 'CUMPLE', 'Sin conflictos P0 detectados.', '');
}

if ($scheduleId > 0 && $pdo instanceof PDO && epqa_table_exists($pdo, 'horario_audit_pendings')) {
    $delete = $pdo->prepare('DELETE FROM horario_audit_pendings WHERE schedule_id = :schedule_id AND user_id = :user_id');
    $delete->execute(['schedule_id' => $scheduleId, 'user_id' => $userId]);
    $insert = $pdo->prepare(
        'INSERT INTO horario_audit_pendings (schedule_id, user_id, priority, type, status, title, description, cause, metadata)
         VALUES (:schedule_id, :user_id, :priority, :type, :status, :title, :description, :cause, :metadata)'
    );
    foreach ($results as $row) {
        if (($row['status'] ?? '') !== 'NO CUMPLE') {
            continue;
        }
        $insert->execute([
            'schedule_id' => $scheduleId,
            'user_id' => $userId,
            'priority' => $row['priority'],
            'type' => $row['code'],
            'status' => 'pending',
            'title' => $row['code'],
            'description' => $row['explanation'],
            'cause' => $row['suggestion'] ?? null,
            'metadata' => epqa_json_value($row),
        ]);
    }
}

$score = max(0, 100 - ($counts['P0'] * 20) - ($counts['P1'] * 8) - ($counts['P2'] * 3));
epqa_json(['ok' => true, 'counts' => $counts, 'score' => $score, 'results' => $results]);

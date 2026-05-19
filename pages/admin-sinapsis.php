<?php
require_superadmin();
$pdo = getConnection();
$localMessage = null;
$localType = 'success';
$temporaryPasswords = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        verify_csrf();
        if (!sinapsis_schema_ready($pdo)) {
            throw new RuntimeException('Falta ejecutar database/sinapsis_family_schema.sql.');
        }
        $action = clean_text($_POST['action'] ?? '');

        if ($action === 'create_family') {
            $result = sinapsis_create_guardian_and_student($pdo, $_POST);
            $temporaryPasswords = $result['temporary_passwords'];
            $localMessage = 'Acudiente y estudiante vinculados correctamente.';
        }

        if ($action === 'create_challenge') {
            $title = clean_text($_POST['title'] ?? '');
            if ($title === '') {
                throw new RuntimeException('El titulo del reto es obligatorio.');
            }
            $slug = sinapsis_slug(clean_text($_POST['slug'] ?? '') ?: $title);
            $stmt = $pdo->prepare(
                'INSERT INTO sinapsis_challenges (title, slug, description, instructions, category, skill_area, difficulty, estimated_time, status, created_at)
                 VALUES (:title, :slug, :description, :instructions, :category, :skill_area, :difficulty, :estimated_time, :status, NOW())
                 ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), instructions = VALUES(instructions), status = VALUES(status)'
            );
            $stmt->execute([
                'title' => $title,
                'slug' => $slug,
                'description' => clean_text($_POST['description'] ?? ''),
                'instructions' => clean_text($_POST['instructions'] ?? ''),
                'category' => clean_text($_POST['category'] ?? 'general'),
                'skill_area' => clean_text($_POST['skill_area'] ?? 'other'),
                'difficulty' => clean_text($_POST['difficulty'] ?? 'basic'),
                'estimated_time' => clean_text($_POST['estimated_time'] ?? ''),
                'status' => clean_text($_POST['status'] ?? 'active'),
            ]);
            $localMessage = 'Reto guardado correctamente.';
        }

        if ($action === 'assign_challenge') {
            $challengeId = (int)($_POST['challenge_id'] ?? 0);
            $studentId = (int)($_POST['student_id'] ?? 0);
            $groupId = (int)($_POST['assign_group_id'] ?? 0);
            $category = clean_text($_POST['assign_category'] ?? '');
            if (!$challengeId) {
                throw new RuntimeException('Selecciona un reto.');
            }
            if ($studentId > 0) {
                $targets = [$studentId];
            } elseif ($groupId > 0) {
                $stmt = $pdo->prepare('SELECT id FROM sinapsis_students WHERE status = "active" AND group_id = :group_id');
                $stmt->execute(['group_id' => $groupId]);
                $targets = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
            } else {
                $stmt = $pdo->prepare('SELECT id FROM sinapsis_students WHERE status = "active" AND (:category = "" OR category = :category)');
                $stmt->execute(['category' => $category]);
                $targets = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
            }
            $insert = $pdo->prepare(
                'INSERT INTO sinapsis_student_challenges (student_id, challenge_id, assigned_by, status, assigned_at)
                 VALUES (:student_id, :challenge_id, :assigned_by, "assigned", NOW())
                 ON DUPLICATE KEY UPDATE status = IF(status = "validated", status, "assigned"), assigned_by = VALUES(assigned_by)'
            );
            foreach ($targets as $targetId) {
                $insert->execute(['student_id' => $targetId, 'challenge_id' => $challengeId, 'assigned_by' => user_id()]);
            }
            $localMessage = 'Reto asignado a ' . count($targets) . ' estudiante(s).';
        }

        if ($action === 'validate_challenge') {
            $stmt = $pdo->prepare('UPDATE sinapsis_student_challenges SET status = "validated", validated_at = NOW(), validated_by = :user_id WHERE id = :id');
            $stmt->execute(['user_id' => user_id(), 'id' => (int)($_POST['student_challenge_id'] ?? 0)]);
            $localMessage = 'Reto validado.';
        }

        if ($action === 'create_progress') {
            $photoPath = sanitize_sinapsis_photo_path($_POST['photo_path'] ?? '');
            $stmt = $pdo->prepare(
                'INSERT INTO sinapsis_progress (student_id, title, description, skill_area, level, progress_date, photo_path, visible_to_family, created_by, created_at)
                 VALUES (:student_id, :title, :description, :skill_area, :level, :progress_date, :photo_path, :visible_to_family, :created_by, NOW())'
            );
            $stmt->execute([
                'student_id' => (int)($_POST['student_id'] ?? 0),
                'title' => clean_text($_POST['title'] ?? ''),
                'description' => clean_text($_POST['description'] ?? ''),
                'skill_area' => clean_text($_POST['skill_area'] ?? 'other'),
                'level' => clean_text($_POST['level'] ?? 'inicio'),
                'progress_date' => clean_text($_POST['progress_date'] ?? date('Y-m-d')),
                'photo_path' => $photoPath,
                'visible_to_family' => !empty($_POST['visible_to_family']) ? 1 : 0,
                'created_by' => user_id(),
            ]);
            $localMessage = 'Avance registrado correctamente.';
        }

        if ($action === 'create_receipt') {
            $studentId = (int)($_POST['student_id'] ?? 0);
            $stmt = $pdo->prepare('SELECT guardian_user_id FROM sinapsis_guardian_students WHERE student_id = :student_id AND is_primary = 1 LIMIT 1');
            $stmt->execute(['student_id' => $studentId]);
            $guardianId = (int)$stmt->fetchColumn();
            if (!$guardianId) {
                throw new RuntimeException('El estudiante no tiene acudiente principal.');
            }
            sinapsis_create_receipt(
                $pdo,
                $studentId,
                $guardianId,
                (int)($_POST['year'] ?? date('Y')),
                (int)($_POST['month'] ?? date('n')),
                clean_text($_POST['due_date'] ?? date('Y-m-10')),
                (int)($_POST['amount_cop'] ?? SINAPSIS_MONTHLY_FEE)
            );
            $localMessage = 'Recibo generado correctamente.';
        }

        if ($action === 'generate_month_receipts') {
            $year = (int)($_POST['year'] ?? date('Y'));
            $month = (int)($_POST['month'] ?? date('n'));
            $dueDate = clean_text($_POST['due_date'] ?? date('Y-m-10'));
            $stmt = $pdo->query(
                'SELECT s.id AS student_id, gs.guardian_user_id, COALESCE(g.monthly_fee_cop, e.monthly_fee_cop, 80000) AS fee
                 FROM sinapsis_students s
                 INNER JOIN sinapsis_guardian_students gs ON gs.student_id = s.id AND gs.is_primary = 1 AND gs.status = "active"
                 LEFT JOIN sinapsis_enrollments e ON e.student_id = s.id AND e.status = "active"
                 LEFT JOIN sinapsis_groups g ON g.id = COALESCE(s.group_id, e.group_id)
                 WHERE s.status = "active"'
            );
            $created = 0;
            foreach ($stmt->fetchAll() as $row) {
                sinapsis_create_receipt($pdo, (int)$row['student_id'], (int)$row['guardian_user_id'], $year, $month, $dueDate, (int)$row['fee']);
                $created++;
            }
            $localMessage = 'Recibos del mes generados para ' . $created . ' estudiante(s) activos.';
        }

        if ($action === 'update_receipt_status') {
            $status = clean_text($_POST['status'] ?? 'pending');
            $stmt = $pdo->prepare(
                'UPDATE sinapsis_payment_receipts
                 SET status = :status, paid_at = IF(:status_paid = "paid", NOW(), paid_at), payment_method = :payment_method, reference = :reference, internal_notes = :internal_notes, updated_at = NOW()
                 WHERE id = :id'
            );
            $stmt->execute([
                'status' => $status,
                'status_paid' => $status,
                'payment_method' => clean_text($_POST['payment_method'] ?? '') ?: null,
                'reference' => clean_text($_POST['reference'] ?? ''),
                'internal_notes' => clean_text($_POST['internal_notes'] ?? ''),
                'id' => (int)($_POST['receipt_id'] ?? 0),
            ]);
            $localMessage = 'Estado del recibo actualizado.';
        }

        if ($action === 'update_student_status') {
            $pdo->prepare('UPDATE sinapsis_students SET status = :status, updated_at = NOW() WHERE id = :id')
                ->execute(['status' => clean_text($_POST['status'] ?? 'inactive'), 'id' => (int)($_POST['student_id'] ?? 0)]);
            $localMessage = 'Estado del estudiante actualizado.';
        }

        if ($action === 'update_guardian_status') {
            $pdo->prepare('UPDATE users SET status = :status, updated_at = NOW() WHERE id = :id AND role = "guardian"')
                ->execute(['status' => clean_text($_POST['status'] ?? 'inactive'), 'id' => (int)($_POST['guardian_id'] ?? 0)]);
            $localMessage = 'Estado del acudiente actualizado.';
        }

        if ($action === 'update_challenge_status') {
            $pdo->prepare('UPDATE sinapsis_challenges SET status = :status, updated_at = NOW() WHERE id = :id')
                ->execute(['status' => clean_text($_POST['status'] ?? 'inactive'), 'id' => (int)($_POST['challenge_id'] ?? 0)]);
            $localMessage = 'Estado del reto actualizado.';
        }
    } catch (Throwable $e) {
        error_log('admin-sinapsis failed: ' . $e->getMessage());
        $localType = 'error';
        $localMessage = $e->getMessage();
    }
}

$schemaReady = sinapsis_schema_ready($pdo);
$summary = sinapsis_admin_summary($pdo);
$groups = sinapsis_groups($pdo);
$students = $schemaReady ? sinapsis_all_students($pdo) : [];
$guardians = $schemaReady ? sinapsis_all_guardians($pdo) : [];
$challenges = $schemaReady ? sinapsis_challenges($pdo) : [];
$activeChallenges = $schemaReady ? sinapsis_challenges($pdo, true) : [];
$progress = $schemaReady ? sinapsis_recent_progress($pdo) : [];
$receipts = $schemaReady ? sinapsis_receipts($pdo) : [];
$submitted = [];
foreach ($students as $studentRow) {
    foreach (sinapsis_challenges_for_student($pdo, (int)$studentRow['id']) as $challengeRow) {
        if ((string)$challengeRow['status'] === 'submitted') {
            $submitted[] = $challengeRow;
        }
    }
}
?>
<section class="container section-pad sinapsis-admin">
  <div class="dashboard-hero reveal-up">
    <div>
      <p class="stem-label">Superusuario</p>
      <h1>Admin TecnoClan Sinapsis</h1>
      <p>Gestiona acudientes, estudiantes, retos, avances y recibos de pago.</p>
    </div>
  </div>
  <?php if ($localMessage): ?><div class="alert alert-<?= e($localType) ?> auth-alert auth-alert-<?= e($localType) ?>"><?= e($localMessage) ?></div><?php endif; ?>
  <?php if ($temporaryPasswords): ?>
    <div class="alert alert-warning auth-alert auth-alert-warning">
      Contrasenas temporales, mostrar una sola vez: <?= e(implode(' | ', $temporaryPasswords)) ?>
    </div>
  <?php endif; ?>
  <?php if (!$schemaReady): ?>
    <div class="alert alert-warning auth-alert auth-alert-warning">Falta ejecutar la migracion <strong>database/sinapsis_family_schema.sql</strong>.</div>
  <?php endif; ?>
</section>

<section class="container pb-4">
  <div class="sinapsis-tabs reveal-up">
    <a href="#resumen">Resumen</a><a href="#familias">Crear familia</a><a href="#retos">Retos</a><a href="#avances">Avances</a><a href="#recibos">Recibos</a><a href="#convenios">Convenios</a>
  </div>
</section>

<section class="container pb-4" id="resumen">
  <div class="dashboard-stat-grid">
    <article class="sinapsis-stat"><strong><?= (int)$summary['active_students'] ?></strong><span>Estudiantes activos</span></article>
    <article class="sinapsis-stat"><strong><?= (int)$summary['guardians'] ?></strong><span>Acudientes activos</span></article>
    <article class="sinapsis-stat"><strong><?= (int)$summary['active_challenges'] ?></strong><span>Retos activos</span></article>
    <article class="sinapsis-stat"><strong><?= (int)$summary['pending'] ?></strong><span>Retos pendientes</span></article>
    <article class="sinapsis-stat"><strong><?= (int)$summary['submitted'] ?></strong><span>Retos enviados</span></article>
    <article class="sinapsis-stat"><strong><?= (int)$summary['pending_payments'] ?></strong><span>Pagos pendientes</span></article>
    <article class="sinapsis-stat"><strong><?= (int)$summary['overdue_payments'] ?></strong><span>Pagos vencidos</span></article>
    <article class="sinapsis-stat"><strong><?= e(sinapsis_money((int)$summary['month_income'])) ?></strong><span>Recaudo del mes</span></article>
  </div>
</section>

<section class="container pb-4" id="familias">
  <form method="post" class="surface-card admin-form">
    <div class="surface-card-body">
      <h2>Crear acudiente y estudiante</h2>
      <?= csrf_field() ?><input type="hidden" name="action" value="create_family">
      <div class="auth-grid">
        <div class="form-group"><label>Nombre completo del acudiente</label><input class="form-control" name="guardian_name" required></div>
        <div class="form-group"><label>Correo del acudiente</label><input class="form-control" type="email" name="guardian_email"></div>
      </div>
      <div class="auth-grid">
        <div class="form-group"><label>Celular</label><input class="form-control" name="guardian_phone" placeholder="3001234567"></div>
        <div class="form-group"><label>Relacion</label><select class="form-control" name="relationship"><option>Madre</option><option>Padre</option><option selected>Acudiente</option><option>Familiar</option><option>Otro</option></select></div>
      </div>
      <div class="auth-grid">
        <div class="form-group"><label>Contrasena temporal opcional</label><input class="form-control" name="guardian_temp_password"></div>
        <div class="form-group"><label>Estado acudiente</label><select class="form-control" name="guardian_status"><option value="active">active</option><option value="inactive">inactive</option></select></div>
      </div>
      <hr>
      <div class="auth-grid">
        <div class="form-group"><label>Nombre completo del estudiante</label><input class="form-control" name="student_name" required></div>
        <div class="form-group"><label>Fecha de nacimiento</label><input class="form-control" type="date" name="birth_date"></div>
      </div>
      <div class="auth-grid">
        <div class="form-group"><label>Documento opcional</label><input class="form-control" name="document_number"></div>
        <div class="form-group"><label>Categoria</label><select class="form-control" name="category"><option value="kids">kids</option><option value="teens">teens</option><option value="lhlc">lhlc</option></select></div>
      </div>
      <div class="auth-grid">
        <div class="form-group"><label>Ruta actual</label><input class="form-control" name="route_current" placeholder="Scratch + storytelling"></div>
        <div class="form-group"><label>Grupo / horario</label><select class="form-control" name="group_id"><option value="">Sin grupo</option><?php foreach ($groups as $group): ?><option value="<?= (int)$group['id'] ?>"><?= e((string)$group['name']) ?> - <?= e((string)$group['schedule_label']) ?></option><?php endforeach; ?></select></div>
      </div>
      <div class="auth-grid">
        <div class="form-group"><label>Horario manual</label><input class="form-control" name="schedule_label" placeholder="Lunes 3:30 p. m. a 4:30 p. m."></div>
        <div class="form-group"><label>Estado estudiante</label><select class="form-control" name="student_status"><option value="active">active</option><option value="inactive">inactive</option><option value="paused">paused</option><option value="graduated">graduated</option></select></div>
      </div>
      <label class="form-check"><input type="checkbox" name="create_student_user" value="1"><span>Crear usuario estudiante</span></label>
      <div class="form-group"><label>Email opcional del estudiante</label><input class="form-control" type="email" name="student_email"></div>
      <label class="form-check"><input type="checkbox" name="create_current_receipt" value="1" checked><span>Crear recibo del mes actual por <?= e(sinapsis_money(SINAPSIS_MONTHLY_FEE)) ?></span></label>
      <button class="btn-auth-primary" type="submit">Crear y vincular</button>
    </div>
  </form>
</section>

<section class="container pb-4">
  <div class="admin-table-wrap reveal-up">
    <h2>Estudiantes</h2>
    <table class="admin-table"><thead><tr><th>Nombre</th><th>Categoria</th><th>Estado</th><th>Acudiente</th><th>Grupo</th><th>Acciones</th></tr></thead><tbody>
      <?php foreach ($students as $s): ?>
        <tr>
          <td><?= e((string)$s['full_name']) ?></td><td><?= e((string)($s['visible_category'] ?: $s['category'])) ?></td><td><span class="badge-status badge-<?= e((string)$s['status']) ?>"><?= e(sinapsis_badge((string)$s['status'])) ?></span></td><td><?= e((string)($s['guardian_email'] ?? 'Sin vincular')) ?></td><td><?= e((string)($s['group_name'] ?? $s['schedule_label'] ?? '')) ?></td>
          <td><form method="post" class="inline-form"><?= csrf_field() ?><input type="hidden" name="action" value="update_student_status"><input type="hidden" name="student_id" value="<?= (int)$s['id'] ?>"><a class="mini-button" href="#avances">Registrar avance</a><a class="mini-button" href="#retos">Asignar reto</a><a class="mini-button" href="#recibos">Generar recibo</a><button class="mini-button" name="status" value="<?= (string)$s['status'] === 'active' ? 'inactive' : 'active' ?>"><?= (string)$s['status'] === 'active' ? 'Inhabilitar' : 'Habilitar' ?></button></form></td>
        </tr>
      <?php endforeach; ?>
    </tbody></table>
  </div>
</section>

<section class="container pb-4">
  <div class="admin-table-wrap reveal-up">
    <h2>Acudientes</h2>
    <table class="admin-table"><thead><tr><th>Nombre</th><th>Correo/celular</th><th>Estado</th><th>Estudiantes</th><th>Acciones</th></tr></thead><tbody>
      <?php foreach ($guardians as $g): ?>
        <tr><td><?= e((string)$g['full_name']) ?></td><td><?= e((string)($g['email'] ?: $g['phone_e164'])) ?></td><td><?= e((string)$g['status']) ?></td><td><?= e((string)($g['students'] ?? '')) ?></td><td><form method="post" class="inline-form"><?= csrf_field() ?><input type="hidden" name="action" value="update_guardian_status"><input type="hidden" name="guardian_id" value="<?= (int)$g['id'] ?>"><button class="mini-button" name="status" value="<?= (string)$g['status'] === 'active' ? 'inactive' : 'active' ?>"><?= (string)$g['status'] === 'active' ? 'Inhabilitar' : 'Habilitar' ?></button></form></td></tr>
      <?php endforeach; ?>
    </tbody></table>
  </div>
</section>

<section class="container pb-4" id="retos">
  <div class="dashboard-grid">
    <form method="post" class="surface-card admin-form"><div class="surface-card-body">
      <h2>Crear reto</h2><?= csrf_field() ?><input type="hidden" name="action" value="create_challenge">
      <div class="form-group"><label>Titulo</label><input class="form-control" name="title" required></div>
      <div class="form-group"><label>Slug opcional</label><input class="form-control" name="slug"></div>
      <div class="form-group"><label>Descripcion</label><textarea class="form-control" name="description" rows="2"></textarea></div>
      <div class="form-group"><label>Instrucciones</label><textarea class="form-control" name="instructions" rows="3"></textarea></div>
      <div class="auth-grid"><div class="form-group"><label>Categoria</label><select class="form-control" name="category"><option value="general">general</option><option value="kids">kids</option><option value="teens">teens</option><option value="lhlc">lhlc</option></select></div><div class="form-group"><label>Area</label><select class="form-control" name="skill_area"><?php foreach (['scratch','lego','storytelling','videogames','microbit','makecode','soft_skills','logic','other'] as $area): ?><option value="<?= e($area) ?>"><?= e($area) ?></option><?php endforeach; ?></select></div></div>
      <div class="auth-grid"><div class="form-group"><label>Dificultad</label><select class="form-control" name="difficulty"><option value="basic">basic</option><option value="intermediate">intermediate</option><option value="advanced">advanced</option></select></div><div class="form-group"><label>Tiempo estimado</label><input class="form-control" name="estimated_time"></div></div>
      <button class="btn-auth-primary" type="submit">Guardar reto</button>
    </div></form>
    <form method="post" class="surface-card admin-form"><div class="surface-card-body">
      <h2>Asignar reto</h2><?= csrf_field() ?><input type="hidden" name="action" value="assign_challenge">
      <div class="form-group"><label>Reto</label><select class="form-control" name="challenge_id"><?php foreach ($activeChallenges as $c): ?><option value="<?= (int)$c['id'] ?>"><?= e((string)$c['title']) ?></option><?php endforeach; ?></select></div>
      <div class="form-group"><label>Estudiante especifico</label><select class="form-control" name="student_id"><option value="0">Asignar por grupo o categoria</option><?php foreach ($students as $s): ?><option value="<?= (int)$s['id'] ?>"><?= e((string)$s['full_name']) ?></option><?php endforeach; ?></select></div>
      <div class="form-group"><label>Grupo si no eliges estudiante</label><select class="form-control" name="assign_group_id"><option value="0">Sin grupo especifico</option><?php foreach ($groups as $group): ?><option value="<?= (int)$group['id'] ?>"><?= e((string)$group['name']) ?> - <?= e((string)$group['schedule_label']) ?></option><?php endforeach; ?></select></div>
      <div class="form-group"><label>Categoria si no eliges estudiante ni grupo</label><select class="form-control" name="assign_category"><option value="">Todos activos</option><option value="kids">kids</option><option value="teens">teens</option><option value="lhlc">lhlc</option></select></div>
      <button class="btn-auth-primary" type="submit">Asignar</button>
    </div></form>
  </div>
  <div class="admin-table-wrap reveal-up mt-4">
    <h2>Retos</h2>
    <table class="admin-table"><thead><tr><th>Titulo</th><th>Categoria</th><th>Area</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      <?php foreach ($challenges as $c): ?><tr><td><?= e((string)$c['title']) ?></td><td><?= e((string)$c['category']) ?></td><td><?= e((string)$c['skill_area']) ?></td><td><?= e((string)$c['status']) ?></td><td><form method="post" class="inline-form"><?= csrf_field() ?><input type="hidden" name="action" value="update_challenge_status"><input type="hidden" name="challenge_id" value="<?= (int)$c['id'] ?>"><button class="mini-button" name="status" value="<?= (string)$c['status'] === 'active' ? 'inactive' : 'active' ?>"><?= (string)$c['status'] === 'active' ? 'Inactivar' : 'Activar' ?></button></form></td></tr><?php endforeach; ?>
    </tbody></table>
  </div>
  <div class="admin-table-wrap reveal-up mt-4">
    <h2>Retos enviados por estudiantes</h2>
    <table class="admin-table"><thead><tr><th>Reto</th><th>Nota</th><th>Accion</th></tr></thead><tbody>
      <?php foreach ($submitted as $item): ?><tr><td><?= e((string)$item['title']) ?></td><td><?= e((string)($item['student_note'] ?? '')) ?></td><td><form method="post" class="inline-form"><?= csrf_field() ?><input type="hidden" name="action" value="validate_challenge"><input type="hidden" name="student_challenge_id" value="<?= (int)$item['id'] ?>"><button class="mini-button">Validar</button></form></td></tr><?php endforeach; ?>
    </tbody></table>
  </div>
</section>

<section class="container pb-4" id="avances">
  <form method="post" class="surface-card admin-form"><div class="surface-card-body">
    <h2>Registrar avance</h2><?= csrf_field() ?><input type="hidden" name="action" value="create_progress">
    <div class="form-group"><label>Estudiante</label><select class="form-control" name="student_id"><?php foreach ($students as $student): ?><option value="<?= (int)$student['id'] ?>"><?= e((string)$student['full_name']) ?></option><?php endforeach; ?></select></div>
    <div class="form-group"><label>Titulo</label><input class="form-control" name="title" required></div>
    <div class="form-group"><label>Descripcion</label><textarea class="form-control" name="description" rows="3"></textarea></div>
    <div class="auth-grid"><div class="form-group"><label>Area</label><select class="form-control" name="skill_area"><?php foreach (['scratch','lego','storytelling','videogames','microbit','makecode','soft_skills','logic','other'] as $area): ?><option value="<?= e($area) ?>"><?= e($area) ?></option><?php endforeach; ?></select></div><div class="form-group"><label>Nivel</label><select class="form-control" name="level"><?php foreach (['inicio','en_proceso','logrado','destacado'] as $level): ?><option value="<?= e($level) ?>"><?= e($level) ?></option><?php endforeach; ?></select></div></div>
    <div class="auth-grid"><div class="form-group"><label>Fecha</label><input class="form-control" type="date" name="progress_date" value="<?= e(date('Y-m-d')) ?>"></div><div class="form-group"><label>Ruta de foto</label><input class="form-control" name="photo_path" placeholder="assets/img/sinapsis/galeria/sinapsis-foto-01.jpg"></div></div>
    <label class="form-check"><input type="checkbox" name="visible_to_family" value="1" checked><span>Visible para familia</span></label>
    <button class="btn-auth-primary" type="submit">Registrar avance</button>
  </div></form>
  <div class="admin-table-wrap reveal-up mt-4"><h2>Ultimos avances</h2><table class="admin-table"><thead><tr><th>Estudiante</th><th>Titulo</th><th>Area</th><th>Nivel</th><th>Fecha</th></tr></thead><tbody><?php foreach ($progress as $p): ?><tr><td><?= e((string)$p['student_name']) ?></td><td><?= e((string)$p['title']) ?></td><td><?= e((string)$p['skill_area']) ?></td><td><?= e((string)$p['level']) ?></td><td><?= e((string)$p['progress_date']) ?></td></tr><?php endforeach; ?></tbody></table></div>
</section>

<section class="container pb-4" id="recibos">
  <div class="dashboard-grid">
    <form method="post" class="surface-card admin-form"><div class="surface-card-body">
      <h2>Generar recibo manual</h2><?= csrf_field() ?><input type="hidden" name="action" value="create_receipt">
      <div class="form-group"><label>Estudiante</label><select class="form-control" name="student_id"><?php foreach ($students as $student): ?><option value="<?= (int)$student['id'] ?>"><?= e((string)$student['full_name']) ?></option><?php endforeach; ?></select></div>
      <div class="auth-grid"><div class="form-group"><label>Ano</label><input class="form-control" type="number" name="year" value="<?= e(date('Y')) ?>"></div><div class="form-group"><label>Mes</label><input class="form-control" type="number" name="month" min="1" max="12" value="<?= e(date('n')) ?>"></div></div>
      <div class="auth-grid"><div class="form-group"><label>Valor</label><input class="form-control" type="number" name="amount_cop" value="<?= SINAPSIS_MONTHLY_FEE ?>"></div><div class="form-group"><label>Vencimiento</label><input class="form-control" type="date" name="due_date" value="<?= e(date('Y-m-10')) ?>"></div></div>
      <button class="btn-auth-primary" type="submit">Generar recibo</button>
    </div></form>
    <form method="post" class="surface-card admin-form"><div class="surface-card-body">
      <h2>Generar recibos del mes</h2><?= csrf_field() ?><input type="hidden" name="action" value="generate_month_receipts">
      <p>Crea o actualiza recibos para todos los estudiantes activos con acudiente principal.</p>
      <div class="auth-grid"><div class="form-group"><label>Ano</label><input class="form-control" type="number" name="year" value="<?= e(date('Y')) ?>"></div><div class="form-group"><label>Mes</label><input class="form-control" type="number" name="month" min="1" max="12" value="<?= e(date('n')) ?>"></div></div>
      <div class="form-group"><label>Fecha de vencimiento</label><input class="form-control" type="date" name="due_date" value="<?= e(date('Y-m-10')) ?>"></div>
      <button class="btn-auth-primary" type="submit">Generar recibos masivos</button>
    </div></form>
  </div>
  <div class="admin-table-wrap reveal-up mt-4"><h2>Recibos</h2><table class="admin-table"><thead><tr><th>Estudiante</th><th>Acudiente</th><th>Periodo</th><th>Valor</th><th>Vence</th><th>Estado</th><th>Accion</th></tr></thead><tbody>
    <?php foreach ($receipts as $r): ?><tr><td><?= e((string)$r['student_name']) ?></td><td><?= e((string)$r['guardian_name']) ?></td><td><?= e((string)$r['month']) ?>/<?= e((string)$r['year']) ?></td><td><?= e(sinapsis_money((int)$r['amount_cop'])) ?></td><td><?= e((string)$r['due_date']) ?></td><td><span class="receipt-status badge-<?= e((string)$r['status']) ?>"><?= e(sinapsis_badge((string)$r['status'])) ?></span></td><td><form method="post" class="inline-form"><?= csrf_field() ?><input type="hidden" name="action" value="update_receipt_status"><input type="hidden" name="receipt_id" value="<?= (int)$r['id'] ?>"><input class="mini-input" name="reference" placeholder="Ref."><input class="mini-input" name="internal_notes" placeholder="Notas"><select name="payment_method" class="mini-input"><option value="">Metodo</option><option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="mercado_pago">Mercado Pago</option><option value="other">Otro</option></select><select name="status" class="mini-input"><option value="paid">Pagado</option><option value="pending">Pendiente</option><option value="overdue">Vencido</option><option value="partial">Parcial</option><option value="scholarship">Becado</option><option value="cancelled">Cancelado</option></select><button class="mini-button">Actualizar</button></form></td></tr><?php endforeach; ?>
  </tbody></table></div>
</section>

<section class="container pb-5" id="convenios">
  <article class="partnership-card reveal-up">
    <div class="about-placeholder">LHLC</div>
    <div>
      <h2>Lighthouse LC / LHLC</h2>
      <p>Convenio activo para fortalecer la ruta micro:bit + MakeCode, con experiencias de programacion por bloques, sensores, creatividad y solucion de retos.</p>
      <span class="badge-status badge-active">Activo</span>
    </div>
  </article>
</section>

<?php
require_role('admin');
$pdo = getConnection();
$localMessage = null;
$localType = 'success';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        verify_csrf();
        $action = $_POST['action'] ?? '';
        if ($action === 'create_student') {
            if (!table_exists($pdo, 'sinapsis_students')) {
                throw new RuntimeException('Falta ejecutar la migración de Sinapsis.');
            }
            $parentEmail = strtolower(clean_text($_POST['parent_email'] ?? ''));
            $parent = sinapsis_find_parent_by_email($pdo, $parentEmail);
            if ($parentEmail !== '' && !$parent) {
                throw new RuntimeException('No existe un usuario padre con ese correo. Debe crear cuenta primero.');
            }
            $stmt = $pdo->prepare(
                'INSERT INTO sinapsis_students (parent_user_id, full_name, birth_date, age_group, visible_category, current_path, schedule_label, status, created_at)
                 VALUES (:parent_user_id, :full_name, :birth_date, :age_group, :visible_category, :current_path, :schedule_label, :status, NOW())'
            );
            $stmt->execute([
                'parent_user_id' => $parent['id'] ?? null,
                'full_name' => clean_text($_POST['full_name'] ?? ''),
                'birth_date' => clean_text($_POST['birth_date'] ?? '') ?: null,
                'age_group' => clean_text($_POST['age_group'] ?? 'kids'),
                'visible_category' => clean_text($_POST['visible_category'] ?? ''),
                'current_path' => clean_text($_POST['current_path'] ?? ''),
                'schedule_label' => clean_text($_POST['schedule_label'] ?? ''),
                'status' => clean_text($_POST['status'] ?? 'active'),
            ]);
            $localMessage = 'Estudiante creado correctamente.';
        }
        if ($action === 'create_progress') {
            if (!table_exists($pdo, 'sinapsis_progress')) {
                throw new RuntimeException('Falta ejecutar la migración de Sinapsis.');
            }
            $photoPath = sanitize_sinapsis_photo_path($_POST['photo_path'] ?? '');
            $stmt = $pdo->prepare(
                'INSERT INTO sinapsis_progress (student_id, title, description, skill_area, level, progress_date, photo_path, created_by, created_at)
                 VALUES (:student_id, :title, :description, :skill_area, :level, :progress_date, :photo_path, :created_by, NOW())'
            );
            $stmt->execute([
                'student_id' => (int)($_POST['student_id'] ?? 0),
                'title' => clean_text($_POST['title'] ?? ''),
                'description' => clean_text($_POST['description'] ?? ''),
                'skill_area' => clean_text($_POST['skill_area'] ?? 'other'),
                'level' => clean_text($_POST['level'] ?? 'inicio'),
                'progress_date' => clean_text($_POST['progress_date'] ?? date('Y-m-d')),
                'photo_path' => $photoPath,
                'created_by' => user_id(),
            ]);
            $localMessage = 'Avance registrado correctamente.';
        }
    } catch (Throwable $e) {
        error_log('admin-sinapsis failed: ' . $e->getMessage());
        $localType = 'error';
        $localMessage = $e->getMessage();
    }
}

$students = sinapsis_all_students($pdo);
$progress = sinapsis_recent_progress($pdo);
?>
<section class="container section-pad admin-panel">
  <div class="dashboard-hero reveal-up"><div><p class="stem-label">Admin Sinapsis</p><h1>Gestión TecnoClan Sinapsis</h1><p>Administra estudiantes, familias y avances.</p></div></div>
  <?php if ($localMessage): ?><div class="alert alert-<?= e($localType) ?> auth-alert auth-alert-<?= e($localType) ?>"><?= e($localMessage) ?></div><?php endif; ?>
</section>
<section class="container pb-4">
  <div class="dashboard-grid">
    <form method="post" class="admin-form surface-card">
      <div class="surface-card-body">
        <h2>Crear estudiante</h2><?= csrf_field() ?><input type="hidden" name="action" value="create_student">
        <div class="auth-grid"><div class="form-group"><label>Nombre completo</label><input class="form-control" name="full_name" required></div><div class="form-group"><label>Fecha de nacimiento</label><input class="form-control" type="date" name="birth_date"></div></div>
        <div class="auth-grid"><div class="form-group"><label>Grupo de edad</label><select class="form-control" name="age_group"><option value="kids">kids</option><option value="teens">teens</option></select></div><div class="form-group"><label>Categoría visible</label><input class="form-control" name="visible_category" placeholder="Niños creadores"></div></div>
        <div class="auth-grid"><div class="form-group"><label>Ruta actual</label><input class="form-control" name="current_path" placeholder="Scratch + storytelling"></div><div class="form-group"><label>Horario</label><input class="form-control" name="schedule_label" placeholder="Lunes 3:30 p. m."></div></div>
        <div class="auth-grid"><div class="form-group"><label>Estado</label><select class="form-control" name="status"><option value="active">active</option><option value="inactive">inactive</option></select></div><div class="form-group"><label>Correo del padre</label><input class="form-control" type="email" name="parent_email"></div></div>
        <button class="btn-auth-primary" type="submit">Crear estudiante</button>
      </div>
    </form>
    <form method="post" class="admin-form surface-card">
      <div class="surface-card-body">
        <h2>Registrar avance</h2><?= csrf_field() ?><input type="hidden" name="action" value="create_progress">
        <div class="form-group"><label>Estudiante</label><select class="form-control" name="student_id"><?php foreach ($students as $student): ?><option value="<?= (int)$student['id'] ?>"><?= e((string)$student['full_name']) ?></option><?php endforeach; ?></select></div>
        <div class="form-group"><label>Título</label><input class="form-control" name="title" required></div>
        <div class="form-group"><label>Descripción</label><textarea class="form-control" name="description" rows="3"></textarea></div>
        <div class="auth-grid"><div class="form-group"><label>Área</label><select class="form-control" name="skill_area"><?php foreach (['scratch','lego','storytelling','videogames','microbit','makecode','soft_skills','other'] as $area): ?><option value="<?= e($area) ?>"><?= e($area) ?></option><?php endforeach; ?></select></div><div class="form-group"><label>Nivel</label><select class="form-control" name="level"><?php foreach (['inicio','en_proceso','logrado','destacado'] as $level): ?><option value="<?= e($level) ?>"><?= e($level) ?></option><?php endforeach; ?></select></div></div>
        <div class="auth-grid"><div class="form-group"><label>Fecha</label><input class="form-control" type="date" name="progress_date" value="<?= e(date('Y-m-d')) ?>"></div><div class="form-group"><label>Ruta de foto</label><input class="form-control" name="photo_path" placeholder="assets/img/sinapsis/galeria/sinapsis-foto-01.jpg"></div></div>
        <button class="btn-auth-primary" type="submit">Registrar avance</button>
      </div>
    </form>
  </div>
</section>
<section class="container pb-5">
  <div class="admin-table-wrap reveal-up"><h2>Estudiantes</h2><table class="admin-table"><thead><tr><th>Nombre</th><th>Categoría</th><th>Ruta</th><th>Estado</th><th>Padre</th></tr></thead><tbody><?php foreach ($students as $s): ?><tr><td><?= e((string)$s['full_name']) ?></td><td><?= e((string)$s['visible_category']) ?></td><td><?= e((string)$s['current_path']) ?></td><td><?= e((string)$s['status']) ?></td><td><?= e((string)($s['parent_email'] ?? 'Sin vincular')) ?></td></tr><?php endforeach; ?></tbody></table></div>
  <div class="admin-table-wrap reveal-up mt-4"><h2>Últimos avances</h2><table class="admin-table"><thead><tr><th>Estudiante</th><th>Título</th><th>Área</th><th>Nivel</th><th>Fecha</th></tr></thead><tbody><?php foreach ($progress as $p): ?><tr><td><?= e((string)$p['student_name']) ?></td><td><?= e((string)$p['title']) ?></td><td><?= e((string)$p['skill_area']) ?></td><td><?= e((string)$p['level']) ?></td><td><?= e((string)$p['progress_date']) ?></td></tr><?php endforeach; ?></tbody></table></div>
</section>

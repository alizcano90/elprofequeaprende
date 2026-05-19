<?php
require_any_role(['student']);
$user = current_user();
$pdo = getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        verify_csrf();
        $student = is_superadmin() ? null : sinapsis_student_for_user($pdo, (int)$user['id']);
        $studentId = is_superadmin() ? (int)($_POST['student_id'] ?? 0) : (int)($student['id'] ?? 0);
        $challengeId = (int)($_POST['student_challenge_id'] ?? 0);
        $nextStatus = clean_text($_POST['next_status'] ?? 'in_progress');
        if (!in_array($nextStatus, ['in_progress', 'submitted'], true)) {
            throw new RuntimeException('Estado no permitido.');
        }
        $completedSql = $nextStatus === 'submitted' ? ', completed_at = NOW()' : ', started_at = COALESCE(started_at, NOW())';
        $stmt = $pdo->prepare(
            "UPDATE sinapsis_student_challenges
             SET status = :status, student_note = :student_note {$completedSql}, updated_at = NOW()
             WHERE id = :id AND student_id = :student_id"
        );
        $stmt->execute([
            'status' => $nextStatus,
            'student_note' => clean_text($_POST['student_note'] ?? ''),
            'id' => $challengeId,
            'student_id' => $studentId,
        ]);
        flash('success', $nextStatus === 'submitted' ? 'Reto enviado para validacion.' : 'Reto marcado en progreso.');
        header('Location: ' . url('sinapsis-estudiante'));
        exit;
    } catch (Throwable $e) {
        error_log('sinapsis estudiante failed: ' . $e->getMessage());
        flash('error', 'No fue posible actualizar el reto.');
    }
}

$student = is_superadmin() ? null : sinapsis_student_for_user($pdo, (int)$user['id']);
$students = is_superadmin() ? sinapsis_all_students($pdo) : ($student ? [$student] : []);
?>
<section class="container section-pad sinapsis-dashboard">
  <div class="dashboard-hero reveal-up">
    <div>
      <p class="stem-label">Mis retos</p>
      <h1>Hola, <?= e(strtok((string)$user['full_name'], ' ') ?: (string)$user['full_name']) ?></h1>
      <p>Consulta tus retos, marca avances y envia actividades para validacion.</p>
    </div>
  </div>
</section>

<section class="container pb-5">
  <?php if (!$students): ?>
    <article class="dashboard-card wide reveal-up">
      <i class="bi bi-person-x"></i>
      <h3>Aun no tienes un perfil de estudiante asociado.</h3>
      <p>Comunicate con TecnoClan Sinapsis para vincular tu usuario.</p>
    </article>
  <?php endif; ?>

  <?php foreach ($students as $student):
      $studentIsActive = (string)$student['status'] === 'active';
      $challenges = ($studentIsActive || is_superadmin()) ? sinapsis_challenges_for_student($pdo, (int)$student['id']) : [];
      $progress = sinapsis_progress_for_student($pdo, (int)$student['id']);
  ?>
    <article class="sinapsis-student-card dashboard-card wide reveal-up">
      <i class="bi bi-controller"></i>
      <h2><?= e((string)$student['full_name']) ?></h2>
      <p class="meta-line">Ruta actual: <?= e((string)($student['route_current'] ?: $student['current_path'])) ?> | Horario: <?= e((string)($student['group_schedule'] ?: $student['schedule_label'])) ?></p>
      <p class="meta-line">Estado: <span class="badge-status badge-<?= e((string)$student['status']) ?>"><?= e(sinapsis_badge((string)$student['status'])) ?></span></p>
    </article>

    <div class="dashboard-grid mt-4">
      <article class="dashboard-card wide reveal-up">
        <i class="bi bi-list-check"></i>
        <h3>Retos pendientes y en progreso</h3>
        <?php if (!$studentIsActive && !is_superadmin()): ?><p>Tu perfil esta inactivo temporalmente. Comunicate con TecnoClan Sinapsis para revisar tu acceso.</p><?php endif; ?>
        <?php if (!$challenges): ?><p>Aun no tienes retos asignados.</p><?php endif; ?>
        <?php foreach ($challenges as $challenge): ?>
          <form method="post" class="challenge-card">
            <?= csrf_field() ?>
            <input type="hidden" name="student_challenge_id" value="<?= (int)$challenge['id'] ?>">
            <input type="hidden" name="student_id" value="<?= (int)$student['id'] ?>">
            <strong><?= e((string)$challenge['title']) ?></strong>
            <span class="challenge-status badge-<?= e((string)$challenge['status']) ?>"><?= e(sinapsis_badge((string)$challenge['status'])) ?></span>
            <p><?= e((string)$challenge['instructions']) ?></p>
            <textarea class="form-control" name="student_note" rows="2" placeholder="Escribe una nota corta"><?= e((string)($challenge['student_note'] ?? '')) ?></textarea>
            <div class="auth-actions">
              <button class="btn-auth-secondary" type="submit" name="next_status" value="in_progress">En progreso</button>
              <button class="btn-auth-primary" type="submit" name="next_status" value="submitted">Marcar cumplido</button>
            </div>
          </form>
        <?php endforeach; ?>
      </article>
      <article class="dashboard-card wide reveal-up">
        <i class="bi bi-stars"></i>
        <h3>Avances destacados</h3>
        <?php if (!$progress): ?><p>Pronto veras aqui tus avances registrados.</p><?php endif; ?>
        <?php foreach ($progress as $item): ?>
          <div class="progress-item">
            <strong><?= e((string)$item['title']) ?></strong>
            <span><?= e((string)$item['skill_area']) ?> - <?= e((string)$item['level']) ?> - <?= e((string)$item['progress_date']) ?></span>
            <p><?= e((string)$item['description']) ?></p>
          </div>
        <?php endforeach; ?>
      </article>
    </div>
  <?php endforeach; ?>
</section>

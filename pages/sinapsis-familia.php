<?php
require_any_role(['guardian']);
$user = current_user();
$pdo = getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        verify_csrf();
        $studentChallengeId = (int)($_POST['student_challenge_id'] ?? 0);
        $studentId = (int)($_POST['student_id'] ?? 0);
        $note = clean_text($_POST['guardian_note'] ?? '');
        $stmt = $pdo->prepare(
            'UPDATE sinapsis_student_challenges sc
             INNER JOIN sinapsis_guardian_students gs ON gs.student_id = sc.student_id
             SET sc.guardian_note = :note, sc.updated_at = NOW()
             WHERE sc.id = :id AND sc.student_id = :student_id AND gs.guardian_user_id = :guardian_user_id'
        );
        $stmt->execute(['note' => $note, 'id' => $studentChallengeId, 'student_id' => $studentId, 'guardian_user_id' => (int)$user['id']]);
        flash('success', 'Nota familiar guardada.');
        header('Location: ' . url('sinapsis-familia'));
        exit;
    } catch (Throwable $e) {
        error_log('sinapsis familia note failed: ' . $e->getMessage());
        flash('error', 'No fue posible guardar la nota familiar.');
    }
}

$students = is_superadmin() ? sinapsis_all_students($pdo) : sinapsis_students_for_guardian($pdo, (int)$user['id']);
$receipts = is_superadmin() ? sinapsis_receipts($pdo) : sinapsis_receipts_for_guardian($pdo, (int)$user['id']);
?>
<section class="container section-pad sinapsis-dashboard">
  <div class="dashboard-hero reveal-up">
    <div>
      <p class="stem-label">TecnoClan Sinapsis</p>
      <h1>Panel familiar TecnoClan Sinapsis</h1>
      <p>Consulta estudiantes asociados, retos, avances y recibos de pago.</p>
    </div>
  </div>
</section>

<section class="container pb-5">
  <?php if (!$students): ?>
    <article class="dashboard-card wide reveal-up">
      <i class="bi bi-person-x"></i>
      <h3>Aun no tienes estudiantes asociados a esta cuenta.</h3>
      <p>Comunicate con El Profe Que Aprende para vincular el perfil familiar.</p>
      <a href="<?= e(url('contacto')) ?>">Contactar <i class="bi bi-arrow-right"></i></a>
    </article>
  <?php else: ?>
    <div class="sinapsis-card-grid">
      <?php foreach ($students as $student):
          $guardianId = is_superadmin() ? (int)($student['guardian_user_id'] ?? 0) : (int)$user['id'];
          $challenges = sinapsis_challenges_for_student($pdo, (int)$student['id']);
          $progress = sinapsis_progress_for_student($pdo, (int)$student['id'], is_superadmin() ? null : (int)$user['id']);
          $nextReceipt = $guardianId ? sinapsis_next_receipt($pdo, (int)$student['id'], $guardianId) : null;
          $pending = count(array_filter($challenges, static fn (array $item): bool => in_array((string)$item['status'], ['assigned', 'in_progress', 'submitted'], true)));
          $completed = count(array_filter($challenges, static fn (array $item): bool => (string)$item['status'] === 'validated'));
      ?>
        <article class="sinapsis-family-card dashboard-card wide reveal-up">
          <i class="bi bi-person-badge"></i>
          <h2><?= e((string)$student['full_name']) ?></h2>
          <p class="meta-line">Categoria: <?= e((string)($student['visible_category'] ?: $student['category'])) ?> | Ruta: <?= e((string)($student['route_current'] ?: $student['current_path'])) ?></p>
          <p class="meta-line">Estado: <span class="badge-status badge-<?= e((string)$student['status']) ?>"><?= e(sinapsis_badge((string)$student['status'])) ?></span> | Horario: <?= e((string)($student['group_schedule'] ?: $student['schedule_label'])) ?></p>
          <div class="dashboard-stat-grid">
            <div class="sinapsis-stat"><strong><?= (int)$pending ?></strong><span>Retos pendientes</span></div>
            <div class="sinapsis-stat"><strong><?= (int)$completed ?></strong><span>Retos completados</span></div>
          </div>
          <h3>Proximo recibo</h3>
          <?php if ($nextReceipt): ?>
            <div class="receipt-card">
              <strong><?= e((string)$nextReceipt['concept']) ?></strong>
              <span><?= e((string)$nextReceipt['month']) ?>/<?= e((string)$nextReceipt['year']) ?> - <?= e(sinapsis_money((int)$nextReceipt['amount_cop'])) ?></span>
              <span>Vence: <?= e((string)$nextReceipt['due_date']) ?> | <b class="receipt-status badge-<?= e((string)$nextReceipt['status']) ?>"><?= e(sinapsis_badge((string)$nextReceipt['status'])) ?></b></span>
            </div>
          <?php else: ?>
            <p>No hay recibos pendientes para este estudiante.</p>
          <?php endif; ?>
        </article>
      <?php endforeach; ?>
    </div>

    <div class="dashboard-grid mt-4">
      <article class="dashboard-card wide reveal-up">
        <i class="bi bi-list-check"></i>
        <h3>Retos asignados</h3>
        <?php foreach ($students as $student): foreach (sinapsis_challenges_for_student($pdo, (int)$student['id']) as $challenge): ?>
          <form method="post" class="challenge-card">
            <?= csrf_field() ?>
            <input type="hidden" name="student_challenge_id" value="<?= (int)$challenge['id'] ?>">
            <input type="hidden" name="student_id" value="<?= (int)$student['id'] ?>">
            <strong><?= e((string)$student['full_name']) ?> - <?= e((string)$challenge['title']) ?></strong>
            <span class="challenge-status badge-<?= e((string)$challenge['status']) ?>"><?= e(sinapsis_badge((string)$challenge['status'])) ?></span>
            <p><?= e((string)$challenge['instructions']) ?></p>
            <textarea class="form-control" name="guardian_note" rows="2" placeholder="Nota familiar o acompanamiento"><?= e((string)($challenge['guardian_note'] ?? '')) ?></textarea>
            <button class="btn-auth-secondary mt-2" type="submit">Guardar nota</button>
          </form>
        <?php endforeach; endforeach; ?>
      </article>

      <article class="dashboard-card wide reveal-up">
        <i class="bi bi-receipt"></i>
        <h3>Recibos de pago</h3>
        <?php if (!$receipts): ?><p>Aun no hay recibos asociados.</p><?php endif; ?>
        <?php foreach ($receipts as $receipt): ?>
          <div class="receipt-card">
            <strong><?= e((string)$receipt['student_name']) ?> - <?= e((string)$receipt['concept']) ?></strong>
            <span><?= e((string)$receipt['month']) ?>/<?= e((string)$receipt['year']) ?> - <?= e(sinapsis_money((int)$receipt['amount_cop'])) ?> - vence <?= e((string)$receipt['due_date']) ?></span>
            <span class="receipt-status badge-<?= e((string)$receipt['status']) ?>"><?= e(sinapsis_badge((string)$receipt['status'])) ?></span>
          </div>
        <?php endforeach; ?>
      </article>
    </div>

    <div class="dashboard-grid mt-4">
      <article class="dashboard-card wide reveal-up">
        <i class="bi bi-graph-up-arrow"></i>
        <h3>Avances recientes</h3>
        <?php foreach ($students as $student): foreach (sinapsis_progress_for_student($pdo, (int)$student['id'], is_superadmin() ? null : (int)$user['id']) as $item): ?>
          <div class="progress-item">
            <strong><?= e((string)$student['full_name']) ?> - <?= e((string)$item['title']) ?></strong>
            <span><?= e((string)$item['skill_area']) ?> - <?= e((string)$item['level']) ?> - <?= e((string)$item['progress_date']) ?></span>
            <p><?= e((string)$item['description']) ?></p>
          </div>
        <?php endforeach; endforeach; ?>
      </article>
      <article class="dashboard-card wide reveal-up">
        <i class="bi bi-images"></i>
        <h3>Galeria / evidencias</h3>
        <p>Las evidencias visibles para familia apareceran aqui cuando el equipo las registre. No se publican fotos reales sin autorizacion.</p>
      </article>
    </div>
  <?php endif; ?>
</section>

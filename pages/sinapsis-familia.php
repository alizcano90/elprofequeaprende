<?php
require_login();
$user = current_user();
$pdo = getConnection();
$students = sinapsis_students_for_parent($pdo, (int)$user['id']);
?>
<section class="container section-pad dashboard-page">
  <div class="dashboard-hero reveal-up"><div><p class="stem-label">Familia Sinapsis</p><h1>Panel familiar</h1><p>Consulta avances, rutas y mensajes generales de TecnoClan Sinapsis.</p></div></div>
</section>
<section class="container pb-5">
  <?php if (!$students): ?>
    <article class="dashboard-card wide reveal-up"><i class="bi bi-person-x"></i><h3>Aún no tienes estudiantes asociados a esta cuenta.</h3><p>Comunícate con El Profe Que Aprende para vincular el perfil familiar.</p><a href="<?= e(url('contacto')) ?>">Contactar <i class="bi bi-arrow-right"></i></a></article>
  <?php else: ?>
    <div class="dashboard-card-grid">
      <?php foreach ($students as $student): $progress = sinapsis_progress_for_student($pdo, (int)$student['id'], (int)$user['id']); ?>
        <article class="dashboard-card wide reveal-up">
          <i class="bi bi-person-badge"></i><h2><?= e((string)$student['full_name']) ?></h2>
          <p class="meta-line">Grupo: <?= e((string)$student['visible_category']) ?> | Ruta: <?= e((string)$student['current_path']) ?> | Horario: <?= e((string)$student['schedule_label']) ?></p>
          <div class="progress-timeline">
            <?php if (!$progress): ?><p>Pronto verás aquí avances y evidencias.</p><?php endif; ?>
            <?php foreach ($progress as $item): ?>
              <div class="progress-item"><strong><?= e((string)$item['title']) ?></strong><span><?= e((string)$item['skill_area']) ?> - <?= e((string)$item['level']) ?> - <?= e((string)$item['progress_date']) ?></span><p><?= e((string)$item['description']) ?></p></div>
            <?php endforeach; ?>
          </div>
        </article>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</section>

<?php
$user = null;
try {
    $user = current_user();
} catch (Throwable $e) {
    $user = null;
}
$loggedIn = is_array($user);
?>
<section class="container section-pad">
  <div class="quick-page-hero reveal-up">
    <div class="quick-page-copy">
      <p class="stem-label"><i class="bi bi-calendar-week"></i> Generador de horarios</p>
      <h1>Organiza horarios escolares desde una interfaz sencilla</h1>
      <p class="quick-page-lead">Crea y organiza horarios básicos en la version pública. La experiencia completa de guardar, cargar, editar y exportar sigue en el módulo Pro de horarios.</p>
      <div class="quick-page-actions">
        <a class="btn-main" href="/horarios/"><i class="bi bi-box-arrow-up-right"></i> Abrir generador</a>
        <?php if ($loggedIn): ?>
          <a class="btn-alt" href="<?= e(url('dashboard')) ?>"><i class="bi bi-speedometer2"></i> Ir al dashboard</a>
        <?php else: ?>
          <a class="btn-alt" href="<?= e(url('login')) ?>"><i class="bi bi-person-lock"></i> Ingresar</a>
        <?php endif; ?>
      </div>
    </div>
    <div class="quick-page-panel">
      <div class="quick-page-stat">
        <strong>Version pública</strong>
        <span>Acceso rápido al módulo de horarios</span>
      </div>
      <div class="quick-page-stat">
        <strong>Versión Pro</strong>
        <span>Guardar, cargar, editar y exportar</span>
      </div>
      <div class="quick-page-stat">
        <strong>Enfoque escolar</strong>
        <span>Docentes, grados y sedes</span>
      </div>
    </div>
  </div>
</section>

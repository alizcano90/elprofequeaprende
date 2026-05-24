<?php
$user = null;
try {
    $user = current_user();
} catch (Throwable $e) {
    $user = null;
}
$loggedIn = is_array($user);
?>
<section class="container section-pad home-hub-page">
  <div class="home-hero-shell reveal-up">
    <div class="home-hero-copy">
      <p class="home-kicker"><i class="bi bi-calendar-week"></i> Generador de horarios</p>
      <h1>Organiza horarios escolares desde una interfaz sencilla</h1>
      <p class="home-hero-lead">Crea y organiza horarios básicos en la versión pública. La experiencia completa de guardar, cargar, editar y exportar sigue en el módulo Pro de horarios.</p>
      <div class="home-hero-meta">
        <span><i class="bi bi-pencil-square"></i> Vista simple</span>
        <span><i class="bi bi-save2"></i> Guardado Pro</span>
        <span><i class="bi bi-diagram-3"></i> Docentes, grados y sedes</span>
      </div>
    </div>
    <div class="home-hero-panel">
      <div class="home-hero-brand">
        <img src="/assets/img/icons/ep.ico" alt="" aria-hidden="true">
        <div>
          <strong>Horarios EPQA</strong>
          <span>Acceso rapido al generador y a tu centro de control.</span>
        </div>
      </div>
      <div class="home-hero-stats">
        <div><strong>Publica</strong><span>vista de entrada</span></div>
        <div><strong>Pro</strong><span>guardar y exportar</span></div>
        <div><strong>Escuela</strong><span>docentes y sedes</span></div>
      </div>
    </div>
  </div>

  <section class="action-hub reveal-up">
    <div class="action-hub-header">
      <div>
        <p class="home-kicker">Acceso rapido</p>
        <h2>Entrar al generador</h2>
      </div>
      <div class="action-hub-tag">Misma experiencia visual que la plataforma principal</div>
    </div>
    <div class="action-grid">
      <a class="action-card action-card-green" href="/horarios/">
        <div class="action-card-icon"><i class="bi bi-box-arrow-up-right"></i></div>
        <div class="action-card-body">
          <span class="action-card-badge">Abrir</span>
          <h3 class="action-card-title">Generador de horarios</h3>
          <p class="action-card-text">Ingresa al modulo completo para crear, organizar y revisar horarios escolares.</p>
        </div>
        <span class="action-card-link">Abrir generador <i class="bi bi-arrow-right"></i></span>
      </a>
      <a class="action-card action-card-blue" href="<?= e(url($loggedIn ? 'dashboard' : 'login')) ?>">
        <div class="action-card-icon"><i class="bi <?= $loggedIn ? 'bi-speedometer2' : 'bi-person-circle' ?>"></i></div>
        <div class="action-card-body">
          <span class="action-card-badge"><?= $loggedIn ? 'Dashboard' : 'Acceso' ?></span>
          <h3 class="action-card-title"><?= $loggedIn ? 'Ir al dashboard' : 'Ingresar' ?></h3>
          <p class="action-card-text"><?= $loggedIn ? 'Continua desde tu centro de control.' : 'Entra con tu cuenta para usar tus horarios y recursos.' ?></p>
        </div>
        <span class="action-card-link"><?= $loggedIn ? 'Abrir dashboard' : 'Ingresar' ?> <i class="bi bi-arrow-right"></i></span>
      </a>
      <a class="action-card action-card-purple" href="<?= e(url('home')) ?>">
        <div class="action-card-icon"><i class="bi bi-house"></i></div>
        <div class="action-card-body">
          <span class="action-card-badge">Inicio</span>
          <h3 class="action-card-title">Volver al hub</h3>
          <p class="action-card-text">Regresa a la pantalla principal con las rutas educativas de la plataforma.</p>
        </div>
        <span class="action-card-link">Volver <i class="bi bi-arrow-right"></i></span>
      </a>
    </div>
  </section>
</section>

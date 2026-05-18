<?php
require_login();
$user = current_user();
$identities = user_identities((int)$user['id']);
$connected = array_column($identities, 'provider');
?>
<section class="container section-pad auth-page">
  <div class="resource-hero reveal-up">
    <div>
      <p class="stem-label"><i class="bi bi-person-circle"></i> Mi cuenta</p>
      <h1><?= e((string)$user['full_name']) ?></h1>
      <p class="stem-lead mb-0">Gestiona tu acceso a recursos, cursos, planes Pro y herramientas como el generador de horarios.</p>
    </div>
    <div class="resource-hero-note">
      <i class="bi bi-shield-lock-fill"></i>
      <strong><?= e((string)$user['role']) ?></strong>
      <span>Estado: <?= e((string)$user['status']) ?></span>
    </div>
  </div>
</section>
<section class="container pb-5">
  <div class="platform-split">
    <article class="surface-card reveal-up">
      <div class="surface-card-body">
        <h2>Datos principales</h2>
        <ul class="list-clean">
          <li>Correo: <?= e((string)($user['email'] ?? 'No registrado')) ?></li>
          <li>Celular: <?= e((string)($user['phone_e164'] ?? 'No registrado')) ?></li>
          <li>Creada: <?= e((string)$user['created_at']) ?></li>
          <li>Ultimo ingreso: <?= e((string)($user['last_login_at'] ?? 'Pendiente')) ?></li>
        </ul>
      </div>
    </article>
    <article class="surface-card reveal-up">
      <div class="surface-card-body">
        <h2>Proveedores vinculados</h2>
        <ul class="list-clean">
          <li>Google: <?= in_array('google', $connected, true) ? 'Conectado' : 'No conectado' ?></li>
          <li>Microsoft: <?= in_array('microsoft', $connected, true) ? 'Conectado' : 'No conectado' ?></li>
        </ul>
        <div class="stem-actions mt-3">
          <a class="btn-alt" href="/auth/google-start.php?link=1">Vincular Google</a>
          <a class="btn-alt" href="/auth/microsoft-start.php?link=1">Vincular Microsoft</a>
        </div>
      </div>
    </article>
    <article class="surface-card reveal-up">
      <div class="surface-card-body">
        <h2>Sesion</h2>
        <p class="meta-line">Cierra sesion si estas en un computador compartido.</p>
        <a class="btn-main" href="/auth/logout.php"><i class="bi bi-box-arrow-right"></i> Cerrar sesion</a>
      </div>
    </article>
  </div>
</section>

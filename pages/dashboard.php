<?php
require_login();
$user = current_user();
$pdo = getConnection();
$plan = get_current_user_plan($pdo, (int)$user['id']);
$stats = get_dashboard_stats($pdo, (int)$user['id']);
$firstName = strtok((string)$user['full_name'], ' ') ?: (string)$user['full_name'];
$role = (string)($user['role'] ?? '');
?>
<section class="container section-pad dashboard-page">
  <div class="dashboard-hero reveal-up">
    <div>
      <p class="stem-label"><i class="bi bi-speedometer2"></i> Dashboard</p>
      <h1>Hola, <?= e($firstName) ?></h1>
      <p>Este es tu centro de control en El Profe Que Aprende.</p>
    </div>
    <div class="dashboard-status">
      <span><i class="bi bi-shield-check"></i> Usuario activo</span>
      <span><i class="bi bi-lock-fill"></i> Acceso seguro</span>
    </div>
  </div>
</section>

<section class="container pb-4">
  <div class="dashboard-grid">
    <article class="plan-card reveal-up">
      <p class="stem-label">Plan actual</p>
      <h2><?= e($plan['name']) ?></h2>
      <p class="plan-status">Estado: <?= e((string)$plan['status']) ?></p>
      <p class="meta-line">Inicio: <?= e((string)($plan['start_date'] ?? 'Disponible desde tu registro')) ?></p>
      <p class="meta-line">Vence: <?= e((string)($plan['end_date'] ?? 'Sin vencimiento')) ?></p>
      <ul class="list-clean">
        <?php foreach ($plan['benefits'] as $benefit): ?>
          <li><?= e((string)$benefit) ?></li>
        <?php endforeach; ?>
      </ul>
      <a class="btn-main mt-3" href="<?= e(url('planes')) ?>"><i class="bi bi-gem"></i> Ver planes</a>
    </article>
    <div class="dashboard-stat-grid">
      <article class="stat-card reveal-up"><strong><?= (int)$stats['resources'] ?></strong><span>Recursos disponibles</span></article>
      <article class="stat-card reveal-up"><strong><?= (int)$stats['courses'] ?></strong><span>Capacitaciones</span></article>
      <article class="stat-card reveal-up"><strong><?= (int)$stats['tools'] ?></strong><span>Herramientas</span></article>
      <article class="stat-card reveal-up"><strong><?= (int)$stats['schedules'] ?></strong><span>Horarios guardados</span></article>
    </div>
  </div>
</section>

<section class="container section-pad">
  <div class="stem-section-head reveal-up">
    <p class="stem-label"><i class="bi bi-grid-fill"></i> Accesos rapidos</p>
    <h2>Continua desde donde necesites</h2>
  </div>
  <div class="dashboard-card-grid">
    <?php
    $cards = [
      ['recursos', 'bi-folder2-open', 'Recursos disponibles', 'Explora materiales offline y recursos gratuitos.'],
      ['capacitaciones', 'bi-robot', 'Capacitaciones', 'Aprende a crear guias y recursos con IA.'],
      ['herramientas', 'bi-tools', 'Herramientas', 'Utilidades para organizar y dinamizar tus clases.'],
      ['herramientas', 'bi-calendar-week', 'Generador de horarios', 'Prototipo gratuito y base para funciones Pro.'],
      ['sinapsis', 'bi-diagram-3', 'TecnoClan Sinapsis', 'Conoce la escuela presencial de pensamiento computacional.'],
      ['mi-cuenta', 'bi-person-circle', 'Mi cuenta', 'Gestiona tus datos y proveedores vinculados.'],
    ];
    if ($role === 'guardian') {
        $cards[] = ['sinapsis-familia', 'bi-people-fill', 'Panel familiar', 'Consulta retos, avances y recibos de tus estudiantes.'];
    }
    if ($role === 'student') {
        $cards[] = ['sinapsis-estudiante', 'bi-controller', 'Mis retos', 'Revisa tus retos y envia avances para validacion.'];
    }
    if ($role === 'superadmin') {
        $cards[] = ['admin-sinapsis', 'bi-shield-lock-fill', 'Admin Sinapsis', 'Gestiona estudiantes, acudientes, retos y recibos.'];
    }
    foreach ($cards as $card):
    ?>
      <article class="dashboard-card reveal-up">
        <i class="bi <?= e($card[1]) ?>"></i>
        <h3><?= e($card[2]) ?></h3>
        <p><?= e($card[3]) ?></p>
        <a href="<?= e(url($card[0])) ?>">Abrir <i class="bi bi-arrow-right"></i></a>
      </article>
    <?php endforeach; ?>
  </div>
</section>

<section class="container pb-5">
  <div class="dashboard-grid">
    <article class="dashboard-card wide reveal-up">
      <i class="bi bi-activity"></i>
      <h3>Actividad reciente</h3>
      <p>Pronto verás aquí tus descargas, cursos, horarios guardados y accesos Pro.</p>
    </article>
    <article class="dashboard-card wide reveal-up">
      <i class="bi bi-broadcast"></i>
      <h3>Estado de la plataforma</h3>
      <ul class="list-clean">
        <li>Usuario activo</li>
        <li>Acceso seguro</li>
        <li>Recursos gratuitos disponibles</li>
        <li>Funciones Pro en preparación</li>
      </ul>
    </article>
  </div>
</section>

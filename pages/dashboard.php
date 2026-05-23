<?php
require_login();
$user = current_user();
$pdo = getConnection();
$plan = get_current_user_plan($pdo, (int)$user['id']);
$stats = get_dashboard_stats($pdo, (int)$user['id']);
$firstName = strtok((string)$user['full_name'], ' ') ?: (string)$user['full_name'];
$role = (string)($user['role'] ?? '');

$moduleCards = [
    ['recursos', 'bi-folder2-open', 'Recursos', 'Explora materiales offline y recursos gratuitos.', 'cyan'],
    ['capacitaciones', 'bi-robot', 'Capacitaciones', 'Aprende a crear guias y recursos con IA.', 'purple'],
    ['herramientas', 'bi-tools', 'Herramientas', 'Utilidades para organizar y dinamizar tus clases.', 'orange'],
    ['horarios', 'bi-calendar-week', 'Generador de horarios', 'Organiza horarios escolares con acceso directo al modulo.', 'green'],
    ['sinapsis', 'bi-diagram-3', 'TecnoClan Sinapsis', 'Conoce la escuela presencial de pensamiento computacional.', 'violet'],
    ['mi-cuenta', 'bi-person-circle', 'Mi cuenta', 'Gestiona tus datos y proveedores vinculados.', 'blue'],
];

if ($role === 'guardian') {
    $moduleCards[] = ['sinapsis-familia', 'bi-people-fill', 'Panel familiar', 'Consulta retos, avances y recibos de tus estudiantes.', 'cyan'];
}
if ($role === 'student') {
    $moduleCards[] = ['sinapsis-estudiante', 'bi-controller', 'Mis retos', 'Revisa tus retos y envia avances para validacion.', 'purple'];
}
if ($role === 'superadmin') {
    $moduleCards[] = ['admin-sinapsis', 'bi-shield-lock-fill', 'Admin Sinapsis', 'Gestiona estudiantes, acudientes, retos y recibos.', 'green'];
}
?>
<section class="container section-pad dashboard-page">
  <div class="dashboard-hero-shell reveal-up">
    <div class="dashboard-hero-copy">
      <p class="stem-label"><i class="bi bi-speedometer2"></i> Dashboard</p>
      <h1>Hola, <?= e($firstName) ?></h1>
      <p>Tu centro de control para recursos, capacitaciones, herramientas, horarios y Sinapsis.</p>
      <div class="dashboard-hero-pills">
        <span><i class="bi bi-shield-check"></i> Usuario activo</span>
        <span><i class="bi bi-lock-fill"></i> Acceso seguro</span>
        <span><i class="bi bi-calendar-week"></i> Horarios visibles</span>
      </div>
    </div>
    <article class="dashboard-plan-card">
      <p class="stem-label">Plan actual</p>
      <h2><?= e($plan['name']) ?></h2>
      <p class="plan-status">Estado: <?= e((string)$plan['status']) ?></p>
      <p class="meta-line">Inicio: <?= e((string)($plan['start_date'] ?? 'Disponible desde tu registro')) ?></p>
      <p class="meta-line">Vence: <?= e((string)($plan['end_date'] ?? 'Sin vencimiento')) ?></p>
      <a class="btn-main mt-3" href="<?= e(url('planes')) ?>"><i class="bi bi-gem"></i> Ver planes</a>
    </article>
  </div>
</section>

<section class="container section-pad">
  <div class="dashboard-stat-grid reveal-up">
    <article class="dashboard-stat-card"><strong><?= (int)$stats['resources'] ?></strong><span>Recursos disponibles</span></article>
    <article class="dashboard-stat-card"><strong><?= (int)$stats['courses'] ?></strong><span>Capacitaciones</span></article>
    <article class="dashboard-stat-card"><strong><?= (int)$stats['tools'] ?></strong><span>Herramientas</span></article>
    <article class="dashboard-stat-card"><strong><?= (int)$stats['schedules'] ?></strong><span>Horarios guardados</span></article>
  </div>
</section>

<section class="container section-pad">
  <div class="stem-section-head reveal-up">
    <p class="stem-label"><i class="bi bi-grid-fill"></i> Accesos rapidos</p>
    <h2>Continua desde donde necesites</h2>
  </div>
  <div class="dashboard-module-grid">
    <?php foreach ($moduleCards as $card): ?>
      <a class="dashboard-module-card dashboard-module-card-<?= e($card[4]) ?> reveal-up" href="<?= e(url($card[0])) ?>">
        <i class="bi <?= e($card[1]) ?>"></i>
        <h3><?= e($card[2]) ?></h3>
        <p><?= e($card[3]) ?></p>
        <span>Abrir <i class="bi bi-arrow-right"></i></span>
      </a>
    <?php endforeach; ?>
  </div>
</section>

<section class="container pb-5">
  <div class="dashboard-bottom-grid">
    <article class="dashboard-status-card reveal-up">
      <p class="stem-label"><i class="bi bi-activity"></i> Actividad reciente</p>
      <h3>Espacio de seguimiento</h3>
      <p>Pronto veras aqui tus descargas, cursos, horarios guardados y accesos Pro.</p>
    </article>
    <article class="dashboard-status-card reveal-up">
      <p class="stem-label"><i class="bi bi-broadcast"></i> Estado de la plataforma</p>
      <h3>Operacion estable</h3>
      <ul class="list-clean">
        <li>Usuario activo</li>
        <li>Acceso seguro</li>
        <li>Recursos gratuitos disponibles</li>
        <li>Funciones Pro en preparacion</li>
      </ul>
    </article>
  </div>
</section>

<?php
$user = null;
try {
    $user = current_user();
} catch (Throwable $e) {
    $user = null;
}
$role = (string)($user['role'] ?? '');
$firstName = $user ? (strtok((string)$user['full_name'], ' ') ?: (string)$user['full_name']) : 'Docente';

$launcherCards = [
    [
        'tone' => 'cyan',
        'badge' => 'Recursos',
        'icon' => '<i class="bi bi-book-half"></i>',
        'title' => 'Recursos educativos',
        'text' => 'Guias interactivas, simuladores, actividades STEM y materiales listos para usar.',
        'href' => url('recursos'),
        'action' => 'Explorar recursos',
    ],
    [
        'tone' => 'purple',
        'badge' => 'IA',
        'icon' => '<i class="bi bi-robot"></i>',
        'title' => 'Capacitaciones con IA',
        'text' => 'Aprende a crear guias interactivas y recursos digitales usando inteligencia artificial.',
        'href' => url('capacitaciones'),
        'action' => 'Ver capacitaciones',
    ],
    [
        'tone' => 'orange',
        'badge' => 'Tiempo',
        'icon' => '<i class="bi bi-tools"></i>',
        'title' => 'Herramientas docentes',
        'text' => 'Utilidades para organizar, dinamizar y ahorrar tiempo en el aula.',
        'href' => url('herramientas'),
        'action' => 'Probar herramientas',
    ],
    [
        'tone' => 'green',
        'badge' => 'Horarios',
        'icon' => '<i class="bi bi-calendar-week"></i>',
        'title' => 'Generador de horarios',
        'text' => 'Crea y organiza horarios escolares con acceso directo al modulo de horarios.',
        'href' => url('horarios'),
        'action' => 'Abrir horarios',
    ],
    [
        'tone' => 'violet',
        'badge' => 'Sinapsis',
        'icon' => '<img src="/assets/img/icons/ts.ico" alt="" aria-hidden="true">',
        'title' => 'TecnoClan Sinapsis',
        'text' => 'Escuela presencial de pensamiento computacional para ninos y jovenes en Garzon, Huila.',
        'href' => url('sinapsis'),
        'action' => 'Conocer Sinapsis',
    ],
];

if ($user) {
    $launcherCards[] = [
        'tone' => 'blue',
        'badge' => 'Cuenta',
        'icon' => '<i class="bi bi-speedometer2"></i>',
        'title' => 'Dashboard',
        'text' => 'Continua desde tu centro de control con acceso a tu plan y herramientas.',
        'href' => url('dashboard'),
        'action' => 'Ir al dashboard',
    ];
} else {
    $launcherCards[] = [
        'tone' => 'blue',
        'badge' => 'Acceso',
        'icon' => '<i class="bi bi-person-circle"></i>',
        'title' => 'Ingresar / Crear cuenta',
        'text' => 'Accede a tu dashboard, planes, recursos y seguimiento familiar.',
        'href' => url('login'),
        'action' => 'Ingresar',
    ];
}

$roleShortcuts = [];
if ($role === 'guardian') {
    $roleShortcuts[] = [
        'tone' => 'cyan',
        'icon' => '<i class="bi bi-people-fill"></i>',
        'title' => 'Panel familiar',
        'text' => 'Consulta retos, avances y recibos de tus estudiantes.',
        'href' => url('sinapsis-familia'),
    ];
}
if ($role === 'student') {
    $roleShortcuts[] = [
        'tone' => 'purple',
        'icon' => '<i class="bi bi-controller"></i>',
        'title' => 'Mis retos',
        'text' => 'Revisa tus retos y envia avances para validacion.',
        'href' => url('sinapsis-estudiante'),
    ];
}
if ($role === 'superadmin') {
    $roleShortcuts[] = [
        'tone' => 'green',
        'icon' => '<i class="bi bi-shield-lock-fill"></i>',
        'title' => 'Admin Sinapsis',
        'text' => 'Gestiona estudiantes, acudientes, retos y recibos.',
        'href' => url('admin-sinapsis'),
    ];
}
?>
<section class="container section-pad home-hub-page">
  <div class="home-hero-shell reveal-up">
    <div class="home-hero-copy">
      <p class="home-kicker">PLATAFORMA EDUCATIVA PARA DOCENTES</p>
      <h1>¿Qué quieres hacer hoy?</h1>
      <p class="home-hero-lead">Crea recursos, aprende con IA, organiza clases y acompaña procesos de pensamiento computacional desde una plataforma práctica para docentes.</p>
      <div class="home-hero-meta">
        <span><i class="bi bi-lightning-charge-fill"></i> Rutas claras</span>
        <span><i class="bi bi-wifi-off"></i> Recursos útiles</span>
        <span><i class="bi bi-calendar-week"></i> Horarios escolares</span>
      </div>
    </div>
    <div class="home-hero-panel">
      <div class="home-hero-brand">
        <img src="/assets/img/icons/ep.ico" alt="" aria-hidden="true">
        <div>
          <strong><?= e($user ? $firstName : 'EPQA') ?></strong>
          <span><?= $user ? 'Tu acceso rapido a herramientas, cursos y soporte.' : 'Explora la plataforma sin perder tiempo.' ?></span>
        </div>
      </div>
      <div class="home-hero-stats">
        <div><strong>6</strong><span>rutas principales</span></div>
        <div><strong>1</strong><span>pregunta central</span></div>
        <div><strong>100%</strong><span>enfoque docente</span></div>
      </div>
    </div>
  </div>

  <section class="action-hub reveal-up">
    <div class="action-hub-header">
      <div>
        <p class="home-kicker">Selector rapido</p>
        <h2>Elige una opcion para entrar directo</h2>
      </div>
      <div class="action-hub-tag">Tecnologia educativa · STEM · IA · Acompanamiento</div>
    </div>
    <div class="action-grid">
      <?php foreach ($launcherCards as $card): ?>
        <a class="action-card action-card-<?= e($card['tone']) ?>" href="<?= e($card['href']) ?>">
          <div class="action-card-icon">
            <?= $card['icon'] ?>
          </div>
          <div class="action-card-body">
            <span class="action-card-badge"><?= e($card['badge']) ?></span>
            <h3 class="action-card-title"><?= e($card['title']) ?></h3>
            <p class="action-card-text"><?= e($card['text']) ?></p>
          </div>
          <span class="action-card-link"><?= e($card['action']) ?> <i class="bi bi-arrow-right"></i></span>
        </a>
      <?php endforeach; ?>
    </div>
    <?php if ($roleShortcuts): ?>
      <div class="role-shortcuts">
        <?php foreach ($roleShortcuts as $card): ?>
          <a class="role-shortcut role-shortcut-<?= e($card['tone']) ?>" href="<?= e($card['href']) ?>">
            <span class="role-shortcut-icon"><?= $card['icon'] ?></span>
            <span>
              <strong><?= e($card['title']) ?></strong>
              <small><?= e($card['text']) ?></small>
            </span>
          </a>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </section>

</section>

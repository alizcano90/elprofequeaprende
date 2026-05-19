<?php
declare(strict_types=1);

$authUser = null;
try {
    $authUser = current_user();
} catch (Throwable $e) {
    $authUser = null;
}

$navItems = $authUser ? [
    'dashboard' => 'Dashboard',
    'recursos' => 'Recursos',
    'herramientas' => 'Herramientas',
    'sinapsis' => 'Sinapsis',
    'mi-cuenta' => 'Mi cuenta',
] : [
    'home' => 'Inicio',
    'recursos' => 'Recursos',
    'capacitaciones' => 'Capacitaciones',
    'herramientas' => 'Herramientas',
    'tips' => 'Tips',
    'sinapsis' => 'Sinapsis',
    'quien-soy' => 'Quién soy',
    'planes' => 'Planes',
    'contacto' => 'Contacto',
];
?>
<header class="site-header sticky-top">
  <nav class="navbar navbar-expand-lg">
    <div class="container">
      <a class="navbar-brand brand-mark" href="<?= e(url('home')) ?>">
        <span class="brand-badge">EP</span>
        <span>El Profe Que Aprende</span>
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Abrir menu">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav ms-auto">
          <?php foreach ($navItems as $key => $label): ?>
            <li class="nav-item">
              <a class="nav-link<?= e(is_active($key, $currentPage)) ?>" data-nav="<?= e($key) ?>" href="<?= e(url($key)) ?>"><?= e($label) ?></a>
            </li>
          <?php endforeach; ?>
          <?php if ($authUser): ?>
            <?php if (($authUser['role'] ?? '') === 'admin'): ?>
              <li class="nav-item">
                <a class="nav-link<?= e(is_active('admin-sinapsis', $currentPage)) ?>" data-nav="admin-sinapsis" href="<?= e(url('admin-sinapsis')) ?>">Admin Sinapsis</a>
              </li>
            <?php endif; ?>
            <li class="nav-item">
              <a class="nav-link" href="/auth/logout.php">Salir</a>
            </li>
          <?php else: ?>
            <li class="nav-item">
              <a class="nav-link<?= e(is_active('login', $currentPage)) ?>" data-nav="login" href="<?= e(url('login')) ?>">Ingresar</a>
            </li>
            <li class="nav-item">
              <a class="nav-link<?= e(is_active('registro', $currentPage)) ?>" data-nav="registro" href="<?= e(url('registro')) ?>">Crear cuenta</a>
            </li>
          <?php endif; ?>
        </ul>
      </div>
    </div>
  </nav>
</header>

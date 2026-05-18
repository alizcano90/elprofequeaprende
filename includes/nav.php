<?php
declare(strict_types=1);

$navItems = [
    'home' => 'Inicio',
    'recursos' => 'Recursos',
    'capacitaciones' => 'Capacitaciones',
    'herramientas' => 'Herramientas',
    'tips' => 'Tips',
    'instituciones' => 'Instituciones',
    'planes' => 'Planes',
    'contacto' => 'Contacto',
];

$authUser = null;
try {
    $authUser = current_user();
} catch (Throwable $e) {
    $authUser = null;
}
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
            <li class="nav-item">
              <a class="nav-link<?= e(is_active('mi-cuenta', $currentPage)) ?>" data-nav="mi-cuenta" href="<?= e(url('mi-cuenta')) ?>"><?= e(strtok((string)$authUser['full_name'], ' ') ?: 'Mi cuenta') ?></a>
            </li>
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

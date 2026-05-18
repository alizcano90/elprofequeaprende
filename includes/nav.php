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
        </ul>
      </div>
    </div>
  </nav>
</header>

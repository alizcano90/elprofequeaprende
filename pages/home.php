<?php
$resourceBase = __DIR__ . '/../assets/files/EDUTECH OFFLINE';
$resourceCount = 0;

if (is_dir($resourceBase)) {
    $entries = array_diff(scandir($resourceBase), ['.', '..']);
    foreach ($entries as $entry) {
        $dirPath = $resourceBase . DIRECTORY_SEPARATOR . $entry;
        if (!is_dir($dirPath)) {
            continue;
        }
        if (is_file($dirPath . '/index.html') || is_file($dirPath . '/index.php')) {
            $resourceCount++;
        }
    }
}

$cards = [
    [
        'icon' => 'bi-grid-3x3-gap',
        'kicker' => 'Servicio',
        'title' => 'Recursos Offline',
        'text' => 'Materiales listos para usar en clase, incluso sin internet.',
        'href' => '/?page=resources',
    ],
    [
        'icon' => 'bi-youtube',
        'kicker' => 'Servicio',
        'title' => 'Videos Tutoriales',
        'text' => 'Explicaciones claras para docentes y estudiantes.',
        'href' => 'https://www.youtube.com/@elprofequeaprende',
    ],
    [
        'icon' => 'bi-person-workspace',
        'kicker' => 'Servicio',
        'title' => 'Asesorias',
        'text' => 'Acompanamiento para implementar tecnologia educativa en aula.',
        'href' => '/?page=contact',
    ],
    [
        'icon' => 'bi-journal-richtext',
        'kicker' => 'Servicio',
        'title' => 'Cursos',
        'text' => 'Formacion practica para fortalecer estrategias pedagogicas.',
        'href' => '/?page=sequences',
    ],
    [
        'icon' => 'bi-cpu',
        'kicker' => 'Linea',
        'title' => 'Laboratorio Maker',
        'text' => 'Proyectos y experiencias de aprendizaje activo.',
        'href' => '/?page=maker',
    ],
    [
        'icon' => 'bi-tools',
        'kicker' => 'Linea',
        'title' => 'Herramientas TIC',
        'text' => 'Apps y plataformas utiles para dinamizar tus clases.',
        'href' => '/?page=tools',
    ],
];
?>

<section class="container section-pad">
  <div class="hero-block reveal-up">
    <div class="row g-4 align-items-center">
      <div class="col-lg-8">
        <p class="eyebrow mb-2">El Profe Que Aprende</p>
        <h1 class="hero-title">Ayudando a docentes y estudiantes a aprender mejor con recursos utiles y aplicables.</h1>
        <p class="hero-subtitle">
          Proyecto educativo creado desde Garzon, Huila - Colombia, enfocado en apoyar a estudiantes, docentes e instituciones con soluciones practicas.
        </p>
        <div class="action-row mb-3">
          <a class="btn-main" href="/?page=resources"><i class="bi bi-play-circle"></i> Explorar recursos</a>
          <a class="btn-alt" href="/?page=contact"><i class="bi bi-chat-dots"></i> Solicitar asesoria</a>
        </div>
        <div class="pill-list">
          <span class="pill">Estudiantes</span>
          <span class="pill">Docentes</span>
          <span class="pill">Instituciones</span>
          <span class="pill">Aprendizaje activo</span>
        </div>
      </div>
      <div class="col-lg-4">
        <article class="profile-highlight">
          <img class="profile-photo" src="/assets/img/profile.png" alt="Foto de perfil de El Profe Que Aprende">
          <h2 class="h5 mb-1">Anfaliz</h2>
          <p class="meta-line mb-2">Garzon, Huila - Colombia</p>
          <div class="social-strip">
            <a href="https://www.youtube.com/@elprofequeaprende" target="_blank" rel="noopener" aria-label="YouTube"><i class="bi bi-youtube"></i></a>
            <a href="https://www.instagram.com/anfalizco/" target="_blank" rel="noopener" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
            <a href="https://www.linkedin.com/in/anfaliz90/" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>
            <a href="https://elprofequeaprende.com" target="_blank" rel="noopener" aria-label="Sitio web"><i class="bi bi-globe"></i></a>
          </div>
        </article>
      </div>
    </div>
    <div class="hero-metrics mt-4">
      <div class="metric-card">
        <span class="metric-label">Recursos disponibles</span>
        <span class="metric-value" data-countup="<?= (int)$resourceCount ?>"><?= number_format((int)$resourceCount) ?></span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Visitas totales (publico)</span>
        <span class="metric-value" data-countup="<?= isset($visitStats['total']) ? (int)$visitStats['total'] : 0 ?>">
          <?= isset($visitStats['total']) ? number_format((int)$visitStats['total']) : '0' ?>
        </span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Visitas hoy</span>
        <span class="metric-value" data-countup="<?= isset($visitStats['today']) ? (int)$visitStats['today'] : 0 ?>">
          <?= isset($visitStats['today']) ? number_format((int)$visitStats['today']) : '0' ?>
        </span>
      </div>
    </div>
  </div>
</section>

<section class="container pb-3">
  <div class="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-3">
    <div>
      <p class="eyebrow mb-1">Servicios y Lineas</p>
      <h2 class="mb-0">En que te puedo apoyar</h2>
    </div>
    <a class="btn-alt" href="/?page=about"><i class="bi bi-person-circle"></i> Conocer el proyecto</a>
  </div>

  <div class="row g-3 g-lg-4">
    <?php foreach ($cards as $card): ?>
      <?php $isExternal = strpos($card['href'], 'http') === 0; ?>
      <div class="col-12 col-md-6 col-xl-4">
        <a class="quick-link reveal-up" href="<?= htmlspecialchars($card['href'], ENT_QUOTES, 'UTF-8') ?>"<?= $isExternal ? ' target="_blank" rel="noopener"' : '' ?>>
          <article class="surface-card">
            <div class="surface-card-body">
              <span class="icon-chip"><i class="bi <?= htmlspecialchars($card['icon'], ENT_QUOTES, 'UTF-8') ?>"></i></span>
              <p class="card-kicker mb-2"><?= htmlspecialchars($card['kicker'], ENT_QUOTES, 'UTF-8') ?></p>
              <h3 class="h4 mb-2"><?= htmlspecialchars($card['title'], ENT_QUOTES, 'UTF-8') ?></h3>
              <p class="meta-line mb-0"><?= htmlspecialchars($card['text'], ENT_QUOTES, 'UTF-8') ?></p>
            </div>
          </article>
        </a>
      </div>
    <?php endforeach; ?>
  </div>
</section>

<section class="container section-pad">
  <div class="row g-3 g-lg-4">
    <div class="col-lg-7">
      <article class="surface-card reveal-up">
        <div class="surface-card-body">
          <p class="eyebrow mb-1">Mensaje del Proyecto</p>
          <h2 class="mb-2">Aprender mejor, juntos</h2>
          <p class="meta-line mb-2">
            Mi objetivo es ayudarte a llevar soluciones concretas al aula para que docentes y estudiantes aprendan de forma mas clara, activa y motivadora.
          </p>
          <ul class="list-clean">
            <li>1. Recursos de aplicacion inmediata.</li>
            <li>2. Videos tutoriales para reforzar contenidos.</li>
            <li>3. Asesorias y cursos adaptados a tu contexto.</li>
          </ul>
        </div>
      </article>
    </div>
    <div class="col-lg-5">
      <article class="note-box reveal-up">
        <strong>Canales activos:</strong> YouTube, Instagram, LinkedIn, Telegram y correo para acompanamiento directo.
      </article>
    </div>
  </div>
</section>

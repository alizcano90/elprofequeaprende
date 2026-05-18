<section class="container section-pad">
  <div class="resource-hero reveal-up">
    <div>
      <p class="stem-label"><i class="bi bi-lightbulb-fill"></i> Contenido gratuito</p>
      <h1>Tips y contenido gratuito</h1>
      <p class="stem-lead mb-0">Indice editorial para atraer docentes con soluciones concretas de ofimatica, IA, productividad, recursos offline y organizacion escolar.</p>
    </div>
    <div class="resource-hero-note">
      <i class="bi bi-megaphone-fill"></i>
      <strong>Preparado para SEO</strong>
      <span>Esta zona puede crecer como blog y monetizarse con Google AdSense.</span>
    </div>
  </div>
</section>

<section class="container pb-4">
  <div class="category-strip reveal-up">
    <?php foreach (['Ofimatica para docentes', 'Excel practico', 'Word y documentos', 'IA para docentes', 'Productividad', 'Recursos offline', 'Organizacion escolar'] as $category): ?>
      <span><?= e($category) ?></span>
    <?php endforeach; ?>
  </div>
</section>

<section class="container resource-category">
  <div class="resource-play-grid compact">
    <?php foreach ([
        'Como convertir una clase en una guia interactiva con IA',
        'Como usar Excel para organizar notas',
        'Como crear rubricas con inteligencia artificial',
        'Como preparar recursos offline para el aula',
        'Como hacer horarios escolares sin complicarse',
        'Como convertir documentos en materiales interactivos',
    ] as $article): ?>
      <article class="play-resource reveal-up">
        <i class="bi bi-journal-text"></i>
        <span class="resource-badge free">gratis</span>
        <h3><?= e($article) ?></h3>
        <p>Articulo guia pendiente de desarrollo, pensado para resolver una necesidad docente especifica con pasos claros.</p>
        <div class="resource-actions"><a href="<?= e(url('contacto')) ?>">Sugerir contenido <i class="bi bi-arrow-right"></i></a></div>
      </article>
    <?php endforeach; ?>
  </div>
</section>

<?php require __DIR__ . '/../includes/ad-slot.php'; ?>

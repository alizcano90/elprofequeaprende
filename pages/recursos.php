<section class="container section-pad">
  <div class="resource-hero reveal-up">
    <div>
      <p class="stem-label"><i class="bi bi-wifi-off"></i> Biblioteca de aula</p>
      <h1>Recursos educativos offline</h1>
      <p class="stem-lead mb-0">Recursos para abrir, proyectar, descargar y llevar al aula sin depender completamente de Internet. La estructura queda preparada para alimentar estas tarjetas desde MySQL.</p>
    </div>
    <div class="resource-hero-note">
      <i class="bi bi-database-check"></i>
      <strong>Preparado para base de datos</strong>
      <span>Los campos de cada recurso ya contemplan categoria, nivel, archivo y vista previa.</span>
    </div>
  </div>
</section>

<section class="container pb-4">
  <div class="category-strip reveal-up">
    <?php foreach (['Guias interactivas HTML', 'Arduino y STEM', 'Pensamiento computacional', 'Tecnologia e informatica', 'Herramientas de aula', 'Recursos gratuitos', 'Recursos premium'] as $category): ?>
      <span><?= e($category) ?></span>
    <?php endforeach; ?>
  </div>
</section>

<section class="container resource-category">
  <div class="stem-section-head reveal-up">
    <p class="stem-label"><i class="bi bi-box2-heart-fill"></i> Recursos iniciales</p>
    <h2>Tarjetas listas para migrar a datos dinamicos</h2>
  </div>
  <div class="resource-play-grid compact">
    <?php
    $resources = [
        ['Algebra Visual', 'Modela trinomios con piezas y verifica factorizacion visual en una cuadricula.', 'Guias interactivas HTML', 'gratuito', 'assets/files/EDUTECH%20OFFLINE/algebra%20visual/index.html', 'Ver recurso'],
        ['Simulador Arduino Didactico', 'Explora componentes, sensores y logica basica de Arduino antes de montar circuitos reales.', 'Arduino y STEM', 'premium', 'assets/files/EDUTECH%20OFFLINE/simulador_arduino_didactico/index.html', 'Solicitar acceso'],
        ['Ruleta Aleatoria', 'Selecciona estudiantes, preguntas o retos para dinamizar la clase.', 'Herramientas de aula', 'gratuito', 'assets/files/EDUTECH%20OFFLINE/ruleta_aleatoria/index.html', 'Ver recurso'],
        ['QuizzOffline', 'Banco de preguntas para evaluaciones rapidas sin depender de plataformas conectadas.', 'Tecnologia e informatica', 'gratuito', 'assets/files/EDUTECH%20OFFLINE/quizzoffline/index.html', 'Ver recurso'],
        ['Vectores', 'Visualizador de magnitudes y direcciones para clases de matematicas y fisica.', 'Pensamiento computacional', 'premium', 'assets/files/EDUTECH%20OFFLINE/vectores/index.html', 'Solicitar acceso'],
        ['Horarios Campeonatos', 'Organiza cruces y horarios de torneos escolares en una fecha.', 'Herramientas de aula', 'gratuito', 'assets/files/EDUTECH%20OFFLINE/horarios_campeonatos/index.html', 'Ver recurso'],
    ];
    foreach ($resources as $resource):
    ?>
      <article class="play-resource reveal-up">
        <i class="bi bi-folder2-open"></i>
        <span class="resource-badge <?= $resource[3] === 'premium' ? 'premium' : 'free' ?>"><?= e($resource[3]) ?></span>
        <h3><?= e($resource[0]) ?></h3>
        <p><?= e($resource[1]) ?></p>
        <p class="meta-line"><?= e($resource[2]) ?></p>
        <div class="resource-actions">
          <a href="/<?= e($resource[4]) ?>" target="_blank" rel="noopener"><?= e($resource[5]) ?> <i class="bi bi-arrow-right"></i></a>
          <a href="<?= e(url('contacto')) ?>"><i class="bi bi-chat-dots"></i> Contacto</a>
        </div>
      </article>
    <?php endforeach; ?>
  </div>
</section>

<?php require __DIR__ . '/../includes/ad-slot.php'; ?>

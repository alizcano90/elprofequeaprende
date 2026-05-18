<section class="container section-pad">
  <div class="resource-hero reveal-up">
    <div>
      <p class="stem-label"><i class="bi bi-tools"></i> Herramientas docentes</p>
      <h1>Herramientas online</h1>
      <p class="stem-lead mb-0">Utilidades para crear, organizar, guardar y exportar materiales escolares desde interfaces sencillas y compatibles con hosting compartido.</p>
    </div>
    <div class="resource-hero-note">
      <i class="bi bi-calendar-week-fill"></i>
      <strong>Producto futuro</strong>
      <span>Generador de Horarios Online con version gratuita y version Pro.</span>
    </div>
  </div>
</section>

<section class="container resource-category">
  <article class="resource-star reveal-up">
    <div class="resource-star-icon"><i class="bi bi-calendar-week"></i></div>
    <div>
      <p class="stem-label">Generador de horarios</p>
      <h2>Generador de Horarios Online</h2>
      <p>Crea, organiza, guarda y exporta horarios escolares desde una interfaz sencilla. La version gratuita permitira crear horarios basicos; la version Pro permitira guardar, cargar, editar, personalizar, exportar y manejar varias sedes.</p>
      <div class="stem-actions">
        <a class="btn-main" href="#prototipo-horario"><i class="bi bi-grid-3x3-gap"></i> Probar prototipo</a>
        <a class="btn-alt" href="<?= e(url('planes')) ?>"><i class="bi bi-gem"></i> Ver Pro</a>
      </div>
    </div>
  </article>
</section>

<section class="container resource-category">
  <div class="platform-split">
    <article class="surface-card reveal-up">
      <div class="surface-card-body">
        <h2>Funciones gratuitas</h2>
        <ul class="list-clean">
          <li>Crear horario basico.</li>
          <li>Agregar grados, materias y docentes.</li>
          <li>Editar celdas manualmente.</li>
          <li>Descargar o imprimir.</li>
        </ul>
      </div>
    </article>
    <article class="surface-card reveal-up pro-card">
      <div class="surface-card-body">
        <h2>Funciones Pro</h2>
        <ul class="list-clean">
          <li>Guardar, cargar y duplicar horarios.</li>
          <li>Exportar PDF/Excel y compartir enlace.</li>
          <li>Personalizar colores y logo institucional.</li>
          <li>Gestionar sedes y detectar cruces.</li>
        </ul>
      </div>
    </article>
  </div>
</section>

<section class="container section-pad" id="prototipo-horario">
  <div class="schedule-builder reveal-up">
    <div class="schedule-toolbar">
      <div>
        <p class="stem-label mb-1"><i class="bi bi-pencil-square"></i> Prototipo gratuito</p>
        <h2>Horario editable local</h2>
      </div>
      <button class="btn-main" type="button" data-schedule-save><i class="bi bi-save"></i> Guardar local</button>
    </div>
    <div class="schedule-grid" data-schedule-grid>
      <?php
      $days = ['Hora', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
      foreach ($days as $day): ?>
        <div class="schedule-cell schedule-head"><?= e($day) ?></div>
      <?php endforeach; ?>
      <?php for ($hour = 1; $hour <= 6; $hour++): ?>
        <div class="schedule-cell schedule-head">Bloque <?= $hour ?></div>
        <?php for ($day = 1; $day <= 5; $day++): ?>
          <div class="schedule-cell" contenteditable="true" data-cell="<?= $hour ?>-<?= $day ?>" aria-label="Bloque <?= $hour ?> dia <?= $day ?>"></div>
        <?php endfor; ?>
      <?php endfor; ?>
    </div>
    <p class="meta-line mt-3 mb-0">Este prototipo guarda en localStorage. La version Pro quedara preparada para guardar en MySQL con usuarios.</p>
  </div>
</section>

<section class="container pb-5">
  <div class="stem-section-head reveal-up">
    <p class="stem-label"><i class="bi bi-layers-fill"></i> Catalogo</p>
    <h2>Herramientas gratuitas, Pro y proximamente</h2>
  </div>
  <div class="resource-play-grid compact">
    <?php foreach ([['Ruletas y grupos', 'Gratuita', 'Dinamicas rapidas para el aula.'], ['Generador de rubricas', 'Proximamente', 'Criterios claros con ayuda de IA.'], ['Banco de clases', 'Pro', 'Guardar planeaciones, recursos y enlaces.']] as $tool): ?>
      <article class="play-resource reveal-up">
        <i class="bi bi-app-indicator"></i>
        <span class="resource-badge"><?= e($tool[1]) ?></span>
        <h3><?= e($tool[0]) ?></h3>
        <p><?= e($tool[2]) ?></p>
      </article>
    <?php endforeach; ?>
  </div>
</section>

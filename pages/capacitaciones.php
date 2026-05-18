<section class="container section-pad">
  <div class="resource-hero reveal-up">
    <div>
      <p class="stem-label"><i class="bi bi-robot"></i> Capacitacion bandera</p>
      <h1>Guias Interactivas con IA para Docentes</h1>
      <p class="stem-lead mb-0">Aprende a convertir tus clases en guias digitales interactivas usando inteligencia artificial, sin saber programar y sin depender de Internet en el aula.</p>
    </div>
    <div class="resource-hero-note">
      <i class="bi bi-mortarboard-fill"></i>
      <strong>Producto final</strong>
      <span>Una guia HTML interactiva lista para usar, adaptar y compartir.</span>
    </div>
  </div>
</section>

<section class="container resource-category">
  <div class="platform-split">
    <article class="surface-card reveal-up">
      <div class="surface-card-body">
        <h2>Que aprendera el docente</h2>
        <ul class="list-clean">
          <li>Convertir una clase tradicional en una experiencia digital guiada.</li>
          <li>Usar IA para redactar instrucciones, actividades y evaluaciones.</li>
          <li>Crear recursos visuales con HTML sencillo sin depender de programacion avanzada.</li>
          <li>Preparar materiales que puedan funcionar offline.</li>
        </ul>
      </div>
    </article>
    <article class="surface-card reveal-up">
      <div class="surface-card-body">
        <h2>A quien va dirigido</h2>
        <p>Docentes de cualquier area, coordinadores academicos, lideres TIC, instituciones que quieren iniciar procesos de IA aplicada y equipos que necesitan materiales utiles sin curvas tecnicas largas.</p>
      </div>
    </article>
  </div>
</section>

<section class="stem-band">
  <div class="container">
    <div class="stem-section-head reveal-up">
      <p class="stem-label"><i class="bi bi-clock-fill"></i> Modalidades</p>
      <h2>Elige el formato segun tu tiempo y necesidad</h2>
    </div>
    <div class="stem-feature-grid">
      <?php foreach ([['Taller de 2 horas', 'Sesion practica para construir una primera guia interactiva.'], ['Curso corto de 4 sesiones', 'Proceso guiado para crear, mejorar y empaquetar recursos.'], ['Capacitacion institucional', 'Ruta adaptada al PEI, areas, sedes y necesidades del colegio.']] as $item): ?>
        <article class="stem-feature-card reveal-up">
          <div class="feature-icon"><i class="bi bi-easel2-fill"></i></div>
          <h3><?= e($item[0]) ?></h3>
          <p><?= e($item[1]) ?></p>
          <a href="<?= e(url('contacto')) ?>">Solicitar informacion <i class="bi bi-arrow-right"></i></a>
        </article>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<section class="container section-pad">
  <div class="stem-class-plan reveal-up">
    <div>
      <p class="stem-label"><i class="bi bi-check2-circle"></i> Beneficios</p>
      <h2>IA aplicada a la clase, no a la teoria</h2>
      <p>Ahorro de tiempo, uso practico de IA, recursos visuales, actividades evaluables, funcionamiento offline y adaptacion a cualquier area.</p>
    </div>
    <div class="stem-actions">
      <a class="btn-main" href="<?= e(url('contacto')) ?>"><i class="bi bi-send-fill"></i> Inscribirme o solicitar propuesta</a>
    </div>
  </div>
</section>

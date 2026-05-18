<section class="stem-hero platform-hero">
  <div class="container stem-hero-grid">
    <div class="stem-hero-copy reveal-up">
      <p class="stem-label"><i class="bi bi-stars"></i> Plataforma educativa para docentes</p>
      <h1>El Profe Que Aprende</h1>
      <p class="stem-lead">Plataforma practica para docentes que quieren crear, organizar y dinamizar sus clases con IA, recursos offline y herramientas digitales.</p>
      <p class="platform-support">Creamos recursos educativos, capacitaciones y herramientas pensadas para docentes reales, con aulas reales y tiempos reales. Tecnologia util, sencilla y aplicable incluso en contextos de baja conectividad.</p>
      <div class="stem-actions">
        <a class="btn-main" href="<?= e(url('recursos')) ?>"><i class="bi bi-folder2-open"></i> Explorar recursos</a>
        <a class="btn-alt" href="<?= e(url('capacitaciones')) ?>"><i class="bi bi-easel2"></i> Ver capacitaciones</a>
        <a class="btn-alt" href="<?= e(url('herramientas')) ?>"><i class="bi bi-tools"></i> Probar herramientas</a>
      </div>
    </div>
    <div class="stem-lab-board reveal-up" aria-label="Resumen de la plataforma">
      <div class="lab-top">
        <span>Ecosistema</span>
        <strong>EPQA</strong>
      </div>
      <div class="lab-kit service-kit">
        <a href="<?= e(url('recursos')) ?>"><i class="bi bi-wifi-off"></i> Offline</a>
        <a href="<?= e(url('capacitaciones')) ?>"><i class="bi bi-robot"></i> IA docente</a>
        <a href="<?= e(url('herramientas')) ?>"><i class="bi bi-calendar-week"></i> Horarios</a>
        <a href="<?= e(url('planes')) ?>"><i class="bi bi-gem"></i> Pro</a>
      </div>
    </div>
  </div>
</section>

<section class="container section-pad" id="ecosistema">
  <div class="stem-section-head reveal-up">
    <p class="stem-label"><i class="bi bi-diagram-3-fill"></i> Ecosistema de la plataforma</p>
    <h2>Seis lineas para aprender, crear y organizar mejor</h2>
  </div>
  <div class="stem-path-grid platform-grid">
    <?php
    $ecosystem = [
        ['recursos', 'bi-folder2-open', 'Recursos educativos offline', 'Guias interactivas HTML, simuladores, actividades STEM/Arduino, herramientas de aula y paquetes por grado que pueden funcionar sin depender de Internet.'],
        ['capacitaciones', 'bi-robot', 'Capacitaciones con IA para docentes', 'Formaciones practicas para crear guias interactivas, recursos digitales y materiales de clase usando inteligencia artificial, sin necesidad de saber programar.'],
        ['herramientas', 'bi-tools', 'Herramientas online', 'Utilidades digitales para docentes: generador de horarios, ruletas, grupos aleatorios, generadores de rubricas, organizacion de clases y mas.'],
        ['tips', 'bi-lightbulb-fill', 'Tips y contenido gratuito', 'Tutoriales de ofimatica, IA practica, productividad docente, Excel, Word, plantillas y soluciones rapidas para el trabajo diario.'],
        ['instituciones', 'bi-building-fill-check', 'Servicios para instituciones', 'Capacitaciones, licencias institucionales, kits offline, acompanamiento STEM y personalizacion de recursos para colegios, sedes, cooperativas y fundaciones.'],
        ['planes', 'bi-gem', 'Monetizacion y planes', 'Recursos premium, cursos, suscripcion Pro, licencias institucionales y contenido gratuito apoyado por Google AdSense.'],
    ];
    foreach ($ecosystem as $index => $item):
    ?>
      <a class="stem-path-card platform-card reveal-up tone-<?= (int)$index % 6 ?>" href="<?= e(url($item[0])) ?>">
        <i class="bi <?= e($item[1]) ?>"></i>
        <span>Linea de la plataforma</span>
        <h3><?= e($item[2]) ?></h3>
        <p><?= e($item[3]) ?></p>
      </a>
    <?php endforeach; ?>
  </div>
</section>

<section class="stem-band">
  <div class="container">
    <div class="stem-section-head reveal-up">
      <p class="stem-label"><i class="bi bi-award-fill"></i> Producto destacado</p>
      <h2>Guias Interactivas con IA para Docentes</h2>
    </div>
    <div class="platform-split">
      <article class="stem-feature-card reveal-up">
        <div class="feature-icon"><i class="bi bi-robot"></i></div>
        <h3>Capacitacion bandera</h3>
        <p>Convierte tus clases en guias digitales interactivas usando IA, con salida HTML y posibilidad de uso offline en el aula.</p>
        <a href="<?= e(url('capacitaciones')) ?>">Ver capacitacion <i class="bi bi-arrow-right"></i></a>
      </article>
      <article class="stem-feature-card reveal-up">
        <div class="feature-icon green"><i class="bi bi-calendar-week"></i></div>
        <h3>Generador de Horarios Online</h3>
        <p>Base visual para crear, organizar, guardar y exportar horarios escolares. La version Pro quedara lista para usuarios y sedes.</p>
        <a href="<?= e(url('herramientas')) ?>">Ver herramienta <i class="bi bi-arrow-right"></i></a>
      </article>
      <article class="stem-feature-card reveal-up">
        <div class="feature-icon red"><i class="bi bi-building"></i></div>
        <h3>Kit institucional offline</h3>
        <p>Biblioteca de recursos, simuladores, capacitacion docente y personalizacion para instituciones educativas.</p>
        <a href="<?= e(url('instituciones')) ?>">Solicitar propuesta <i class="bi bi-arrow-right"></i></a>
      </article>
    </div>
  </div>
</section>

<section class="container section-pad">
  <div class="stem-class-plan reveal-up">
    <div>
      <p class="stem-label"><i class="bi bi-cash-coin"></i> Planes y crecimiento</p>
      <h2>Contenido gratuito, recursos premium y licencias institucionales</h2>
      <p>La plataforma queda preparada para crecer con recursos gratuitos, herramientas Pro, cursos, paquetes descargables y servicios para colegios.</p>
    </div>
    <ol class="stem-steps">
      <li><strong>1</strong><span>Explora recursos gratuitos y tips para resolver necesidades inmediatas.</span></li>
      <li><strong>2</strong><span>Usa capacitaciones y herramientas para crear materiales propios.</span></li>
      <li><strong>3</strong><span>Activa planes Pro o institucionales cuando necesites guardar, personalizar y escalar.</span></li>
    </ol>
  </div>
</section>

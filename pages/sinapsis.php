<section class="sinapsis-public sinapsis-hero">
  <div class="container">
    <div class="sinapsis-hero-content reveal-up">
      <p class="stem-label"><i class="bi bi-cpu-fill"></i> TecnoClan Sinapsis</p>
      <h1>TecnoClan Sinapsis</h1>
      <h2>Escuela presencial de pensamiento computacional para ninos y jovenes en Garzon, Huila.</h2>
      <p>En TecnoClan Sinapsis los ninos no solo usan tecnologia: aprenden a crear con ella. A traves de Scratch, LEGO, storytelling, videojuegos, micro:bit y MakeCode, fortalecen pensamiento logico, creatividad, comunicacion y resolucion de problemas.</p>
      <div class="stem-actions">
        <a class="btn-main" href="<?= e(url('contacto')) ?>"><i class="bi bi-chat-dots-fill"></i> Solicitar informacion</a>
        <a class="btn-alt" href="<?= e(url('sinapsis-familia')) ?>"><i class="bi bi-people-fill"></i> Ingreso padres</a>
        <a class="btn-alt" href="<?= e(url('sinapsis-estudiante')) ?>"><i class="bi bi-controller"></i> Ingreso estudiantes</a>
      </div>
    </div>
  </div>
</section>

<section class="container sinapsis-section">
  <div class="stem-section-head reveal-up">
    <p class="stem-label"><i class="bi bi-stars"></i> Aprender creando</p>
    <h2>Que es TecnoClan Sinapsis</h2>
    <p>Un espacio presencial en Garzon, Huila, donde la tecnologia se convierte en creacion: programacion, videojuegos, historias digitales, LEGO, micro:bit y experiencias maker para aprender haciendo.</p>
  </div>
  <div class="sinapsis-card-grid">
    <article class="sinapsis-card reveal-up">
      <i class="bi bi-bricks"></i>
      <h3>Ninos creadores</h3>
      <p>Scratch, LEGO, storytelling, creatividad y pensamiento computacional para aprender logica, secuencias y expresion construyendo historias y proyectos digitales.</p>
    </article>
    <article class="sinapsis-card reveal-up">
      <i class="bi bi-controller"></i>
      <h3>Jovenes desarrolladores</h3>
      <p>Scratch, creacion de videojuegos, logica, personajes, reglas de juego y narrativa interactiva para fortalecer pensamiento creativo y solucion de problemas.</p>
    </article>
    <article class="sinapsis-card reveal-up">
      <i class="bi bi-lightning-charge-fill"></i>
      <h3>Ruta Lighthouse LC / LHLC</h3>
      <p>Ruta con micro:bit y MakeCode en convenio con Lighthouse LC, orientada a programacion por bloques, sensores, creatividad y solucion de retos.</p>
    </article>
  </div>
</section>

<section class="container sinapsis-section" id="horarios">
  <div class="dashboard-grid">
    <article class="sinapsis-card schedule reveal-up">
      <i class="bi bi-calendar2-week-fill"></i>
      <h2>Horarios disponibles</h2>
      <div class="schedule-pills">
        <span>Lunes o martes</span>
        <span>3:30 p. m. a 4:30 p. m.</span>
        <span>4:40 p. m. a 5:40 p. m.</span>
      </div>
      <p>Los grupos se organizan segun edad, nivel y disponibilidad. Los cupos son limitados para mantener acompanamiento cercano.</p>
    </article>
    <article class="sinapsis-card reveal-up">
      <i class="bi bi-cash-coin"></i>
      <h2>Valor mensual</h2>
      <p class="sinapsis-price"><?= e(sinapsis_money(SINAPSIS_MONTHLY_FEE)) ?></p>
      <p>Mensualidad actual por estudiante. No incluye integracion de pagos en linea todavia.</p>
    </article>
  </div>
</section>

<section class="container sinapsis-section">
  <div class="stem-section-head reveal-up">
    <p class="stem-label">Galeria</p>
    <h2>Experiencias y proyectos</h2>
  </div>
  <div class="sinapsis-gallery">
    <?php for ($i = 1; $i <= 6; $i++): $path = 'assets/img/sinapsis/galeria/sinapsis-foto-0' . $i . '.jpg'; ?>
      <article class="sinapsis-photo-card reveal-up">
        <?php if (is_file(__DIR__ . '/../' . $path)): ?>
          <img src="/<?= e($path) ?>" alt="Actividad TecnoClan Sinapsis <?= (int)$i ?>">
        <?php else: ?>
          <div class="sinapsis-placeholder"><i class="bi bi-image"></i><span>Foto <?= (int)$i ?></span></div>
        <?php endif; ?>
      </article>
    <?php endfor; ?>
  </div>
</section>

<section class="container sinapsis-section">
  <article class="partnership-card reveal-up">
    <?php $logo = 'assets/img/sinapsis/convenios/lhlc-logo.png'; ?>
    <?php if (is_file(__DIR__ . '/../' . $logo)): ?>
      <img src="/<?= e($logo) ?>" alt="Lighthouse LC">
    <?php else: ?>
      <div class="about-placeholder">LHLC</div>
    <?php endif; ?>
    <div>
      <h2>Convenio Lighthouse LC / LHLC</h2>
      <p>TecnoClan Sinapsis fortalece sus procesos mediante alianzas educativas que permiten ampliar experiencias, rutas de aprendizaje y oportunidades para los estudiantes.</p>
    </div>
  </article>
</section>

<section class="container section-pad">
  <div class="stem-class-plan reveal-up">
    <div>
      <p class="stem-label">Inscripciones</p>
      <h2>Quieres que tu hijo aprenda tecnologia creando proyectos reales?</h2>
    </div>
    <a class="btn-main" href="<?= e(url('contacto')) ?>"><i class="bi bi-send-fill"></i> Solicitar informacion</a>
  </div>
</section>

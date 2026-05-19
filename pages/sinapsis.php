<section class="sinapsis-hero">
  <div class="container">
    <div class="sinapsis-hero-content reveal-up">
      <p class="stem-label"><i class="bi bi-cpu-fill"></i> TecnoClan Sinapsis</p>
      <h1>TecnoClan Sinapsis</h1>
      <h2>Escuela presencial de pensamiento computacional para niños y jóvenes en Garzón, Huila.</h2>
      <p>Un espacio donde la tecnología se convierte en creación: programación, videojuegos, historias digitales, LEGO, micro:bit y experiencias maker para aprender haciendo.</p>
      <div class="stem-actions">
        <a class="btn-main" href="#horarios"><i class="bi bi-clock-fill"></i> Conocer horarios</a>
        <a class="btn-alt" href="<?= e(url('contacto')) ?>"><i class="bi bi-chat-dots-fill"></i> Solicitar información</a>
        <a class="btn-alt" href="<?= e(url('sinapsis-familia')) ?>"><i class="bi bi-people-fill"></i> Ingreso padres</a>
      </div>
    </div>
  </div>
</section>

<section class="container sinapsis-section">
  <div class="stem-section-head reveal-up">
    <p class="stem-label"><i class="bi bi-stars"></i> Aprender creando</p>
    <h2>En TecnoClan Sinapsis los niños no solo usan tecnología: aprenden a crear con ella.</h2>
  </div>
  <div class="sinapsis-card-grid">
    <article class="sinapsis-card reveal-up"><i class="bi bi-bricks"></i><h3>Niños creadores</h3><p>Para los más pequeños trabajamos Scratch, LEGO y creación de storytelling. Aprenden lógica, secuencias, creatividad y expresión construyendo historias y proyectos digitales.</p></article>
    <article class="sinapsis-card reveal-up"><i class="bi bi-controller"></i><h3>Jóvenes desarrolladores</h3><p>Con los jóvenes fortalecemos programación con Scratch, creación de videojuegos, diseño de personajes, reglas de juego, lógica computacional y pensamiento creativo.</p></article>
    <article class="sinapsis-card reveal-up"><i class="bi bi-lightning-charge-fill"></i><h3>Ruta Micro:bit + MakeCode con Lighthouse LC</h3><p>En convenio con Lighthouse LC desarrollamos una ruta de aprendizaje con micro:bit y MakeCode, orientada a pensamiento computacional, programación por bloques, sensores, creatividad y solución de retos.</p></article>
  </div>
</section>

<section class="container sinapsis-section" id="horarios">
  <article class="sinapsis-card schedule reveal-up">
    <i class="bi bi-calendar2-week-fill"></i>
    <h2>Horarios</h2>
    <div class="schedule-pills"><span>Lunes o martes</span><span>3:30 p. m. a 4:30 p. m.</span><span>4:40 p. m. a 5:40 p. m.</span></div>
    <p>Los grupos se organizan según edad, nivel y disponibilidad. Los cupos son limitados para mantener acompañamiento cercano.</p>
  </article>
</section>

<section class="container sinapsis-section">
  <div class="stem-section-head reveal-up"><p class="stem-label">Galería</p><h2>Experiencias y proyectos</h2></div>
  <div class="sinapsis-gallery">
    <?php for ($i = 1; $i <= 4; $i++): $path = 'assets/img/sinapsis/galeria/sinapsis-foto-0' . $i . '.jpg'; ?>
      <article class="sinapsis-photo-card reveal-up">
        <?php if (is_file(__DIR__ . '/../' . $path)): ?>
          <img src="/<?= e($path) ?>" alt="Actividad TecnoClan Sinapsis <?= $i ?>">
        <?php else: ?>
          <div class="sinapsis-placeholder"><i class="bi bi-image"></i><span>Foto <?= $i ?></span></div>
        <?php endif; ?>
      </article>
    <?php endfor; ?>
  </div>
</section>

<section class="container sinapsis-section">
  <article class="partnership-card reveal-up">
    <?php $logo = 'assets/img/sinapsis/convenios/lhlc-logo.png'; ?>
    <?php if (is_file(__DIR__ . '/../' . $logo)): ?><img src="/<?= e($logo) ?>" alt="Lighthouse LC"><?php else: ?><div class="about-placeholder">LHLC</div><?php endif; ?>
    <div><h2>Lighthouse LC / LHLC</h2><p>TecnoClan Sinapsis fortalece sus procesos mediante alianzas educativas que permiten ampliar experiencias, rutas de aprendizaje y oportunidades para los estudiantes.</p></div>
  </article>
</section>

<section class="container section-pad">
  <div class="stem-class-plan reveal-up">
    <div><p class="stem-label">Inscripciones</p><h2>¿Quieres que tu hijo aprenda tecnología creando proyectos reales?</h2></div>
    <a class="btn-main" href="<?= e(url('contacto')) ?>"><i class="bi bi-send-fill"></i> Solicitar información</a>
  </div>
</section>

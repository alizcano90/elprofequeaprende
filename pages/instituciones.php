<section class="container section-pad">
  <div class="resource-hero reveal-up">
    <div>
      <p class="stem-label"><i class="bi bi-building-fill-check"></i> Para colegios y sedes</p>
      <h1>Kit Institucional de Innovacion Docente Offline</h1>
      <p class="stem-lead mb-0">Oferta para colegios, cooperativas, fundaciones y sedes educativas que necesitan recursos aplicables, capacitacion docente y acompanamiento STEM.</p>
    </div>
    <div class="resource-hero-note">
      <i class="bi bi-shield-check"></i>
      <strong>Licencia institucional</strong>
      <span>Personalizable por institucion, sede o proyecto educativo.</span>
    </div>
  </div>
</section>

<section class="container resource-category">
  <div class="stem-feature-grid">
    <?php foreach ([
        ['Biblioteca de recursos offline', 'Recursos HTML, simuladores y actividades descargables.'],
        ['Capacitacion docente', 'Talleres practicos para integrar IA y herramientas digitales.'],
        ['Personalizacion institucional', 'Logo, rutas por area, kits por sede y acompanamiento.'],
        ['Acompanamiento STEM', 'Proyectos con Arduino, pensamiento computacional y tecnologia escolar.'],
    ] as $item): ?>
      <article class="stem-feature-card reveal-up">
        <div class="feature-icon"><i class="bi bi-check2-circle"></i></div>
        <h3><?= e($item[0]) ?></h3>
        <p><?= e($item[1]) ?></p>
      </article>
    <?php endforeach; ?>
  </div>
</section>

<section class="container section-pad">
  <div class="stem-class-plan reveal-up">
    <div>
      <p class="stem-label"><i class="bi bi-file-earmark-text-fill"></i> Propuesta institucional</p>
      <h2>Capacitacion, recursos, simuladores, guias y licencias por sede</h2>
      <p>La oferta puede incluir biblioteca offline, capacitacion docente, simuladores, guias interactivas, herramientas de aula, personalizacion con logo institucional y soporte basico.</p>
    </div>
    <div class="stem-actions">
      <a class="btn-main" href="<?= e(url('contacto')) ?>"><i class="bi bi-send-fill"></i> Solicitar propuesta institucional</a>
    </div>
  </div>
</section>

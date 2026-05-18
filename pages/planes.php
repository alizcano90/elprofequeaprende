<section class="container section-pad">
  <div class="resource-hero reveal-up">
    <div>
      <p class="stem-label"><i class="bi bi-gem"></i> Monetizacion sostenible</p>
      <h1>Planes y productos premium</h1>
      <p class="stem-lead mb-0">Base comercial para combinar contenido gratuito, recursos premium, herramientas Pro, capacitaciones y licencias institucionales. Pagos aun no integrados.</p>
    </div>
  </div>
</section>

<section class="container resource-category">
  <div class="pricing-grid">
    <?php
    $plans = [
        ['Plan Gratuito', '0 COP', ['Recursos gratuitos', 'Tips y tutoriales', 'Herramientas basicas', 'Acceso a demostraciones'], 'Solicitar acceso'],
        ['Plan Pro Docente', 'Pendiente', ['Recursos premium', 'Plantillas', 'Herramientas Pro', 'Guardar horarios', 'Acceso anticipado', 'Descuentos en capacitaciones'], 'Quiero el plan Pro'],
        ['Plan Institucional', 'Cotizacion', ['Licencias para colegios', 'Personalizacion', 'Capacitaciones', 'Kit offline', 'Soporte basico', 'Gestion por sedes'], 'Cotizar institucion'],
    ];
    foreach ($plans as $index => $plan):
    ?>
      <article class="surface-card pricing-card reveal-up <?= $index === 1 ? 'featured-plan' : '' ?>">
        <div class="surface-card-body">
          <p class="stem-label"><?= $index === 1 ? 'Recomendado' : 'Plan' ?></p>
          <h2><?= e($plan[0]) ?></h2>
          <strong class="price-line"><?= e($plan[1]) ?></strong>
          <ul class="list-clean">
            <?php foreach ($plan[2] as $feature): ?>
              <li><?= e($feature) ?></li>
            <?php endforeach; ?>
          </ul>
          <a class="<?= $index === 1 ? 'btn-main' : 'btn-alt' ?>" href="<?= e(url('contacto')) ?>"><?= e($plan[3]) ?></a>
        </div>
      </article>
    <?php endforeach; ?>
  </div>
</section>

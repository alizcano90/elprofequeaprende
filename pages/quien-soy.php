<section class="container section-pad about-page">
  <div class="about-profile reveal-up">
    <?php $photo = 'assets/img/perfil/andres-lizcano.jpg'; ?>
    <div class="about-photo"><?php if (is_file(__DIR__ . '/../' . $photo)): ?><img src="/<?= e($photo) ?>" alt="Andrés Fabián Lizcano Corrales"><?php else: ?><div class="about-placeholder">AL</div><?php endif; ?></div>
    <div><p class="stem-label">Quién soy</p><h1>Andrés Fabián Lizcano Corrales</h1><p>Soy docente de Tecnología e Informática, desarrollador de software, músico y creador educativo. Desde El Profe Que Aprende diseño recursos, herramientas y experiencias para que la tecnología sea más cercana, útil y posible en contextos reales de aula.</p><p>Mi trabajo une educación, tecnología, creatividad y comunicación. Creo en una innovación que no dependa únicamente de grandes laboratorios o conexión perfecta, sino de soluciones prácticas que los docentes puedan usar, adaptar y compartir.</p><div class="stem-actions"><a class="btn-main" href="<?= e(url('recursos')) ?>">Conoce los recursos</a><a class="btn-alt" href="<?= e(url('contacto')) ?>">Contactar</a></div></div>
  </div>
</section>
<section class="container pb-5">
  <div class="sinapsis-card-grid">
    <?php foreach ([['Docente de Tecnología e Informática','Acompaño procesos de aula con enfoque práctico y cercano.'],['Desarrollo de software educativo','Creo herramientas que responden a necesidades reales de docentes.'],['Pensamiento computacional y proyectos STEM','Diseño rutas para aprender creando y resolviendo retos.'],['Recursos offline para docentes','Priorizo materiales que funcionen incluso con baja conectividad.'],['Música y creatividad','Integro comunicación, expresión y sensibilidad al aprendizaje.'],['El Profe Que Aprende','Una marca educativa para compartir, enseñar y seguir aprendiendo.']] as $item): ?>
      <article class="sinapsis-card reveal-up"><i class="bi bi-check2-circle"></i><h3><?= e($item[0]) ?></h3><p><?= e($item[1]) ?></p></article>
    <?php endforeach; ?>
  </div>
</section>

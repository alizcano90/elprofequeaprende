<?php
declare(strict_types=1);
?>
  </main>
  <footer class="site-footer">
    <div class="container py-4 py-lg-5">
      <div class="row g-4 align-items-end">
        <div class="col-lg-7">
          <h3 class="footer-title">Tecnologia util para docentes reales</h3>
          <p class="footer-text mb-0">Proyecto educativo desde Garzon, Huila - Colombia. Recursos offline, capacitaciones con IA, herramientas docentes y servicios para instituciones.</p>
          <div class="footer-social mt-3">
            <a href="https://www.youtube.com/@elprofequeaprende" target="_blank" rel="noopener" aria-label="YouTube"><i class="bi bi-youtube"></i></a>
            <a href="https://www.instagram.com/anfalizco/" target="_blank" rel="noopener" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
            <a href="https://www.linkedin.com/in/anfaliz90/" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>
            <a href="https://www.tiktok.com/@el.profe.que.aprende" target="_blank" rel="noopener" aria-label="TikTok"><i class="bi bi-tiktok"></i></a>
            <a href="https://elprofequeaprende.com" target="_blank" rel="noopener" aria-label="Sitio web"><i class="bi bi-globe"></i></a>
          </div>
        </div>
        <div class="col-lg-5 text-lg-end">
          <div class="footer-links">
            <a href="<?= e(url('recursos')) ?>">Recursos</a>
            <a href="<?= e(url('capacitaciones')) ?>">Capacitaciones</a>
            <a href="<?= e(url('planes')) ?>">Planes</a>
            <a href="<?= e(url('contacto')) ?>">Contacto</a>
          </div>
          <p class="visit-counter mb-1 mt-3"><span class="counter-label">Visitas totales</span><strong data-counter-source="total">0</strong></p>
          <p class="visit-counter mb-0"><span class="counter-label">Visitas de hoy</span><strong data-counter-source="today">0</strong></p>
        </div>
      </div>
      <hr class="footer-rule">
      <p class="footer-copy mb-0">&copy; 2026 El Profe Que Aprende | anfaliz@gmail.com</p>
    </div>
  </footer>

  <script defer src="<?= e(asset('js/interactive-background.js')) ?>"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="<?= e(asset('js/scripts.js')) ?>"></script>
</body>
</html>

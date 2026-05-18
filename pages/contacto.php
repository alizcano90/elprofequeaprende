<section class="container section-pad">
  <div class="resource-hero reveal-up">
    <div>
      <p class="stem-label"><i class="bi bi-chat-dots-fill"></i> Hablemos</p>
      <h1>Contacto</h1>
      <p class="stem-lead mb-0">Cuéntame que necesitas: recursos, capacitacion, generador de horarios, propuesta institucional o una idea para adaptar a tu contexto.</p>
    </div>
    <div class="resource-hero-note">
      <i class="bi bi-whatsapp"></i>
      <strong>Envio temporal</strong>
      <span>El formulario prepara un mensaje por WhatsApp mientras se activa el backend.</span>
    </div>
  </div>
</section>

<section class="container pb-5">
  <form class="contact-panel reveal-up" data-contact-form>
    <div class="row g-3">
      <div class="col-md-6">
        <label for="name">Nombre</label>
        <input id="name" name="name" type="text" required>
      </div>
      <div class="col-md-6">
        <label for="email">Correo</label>
        <input id="email" name="email" type="email" required>
      </div>
      <div class="col-md-6">
        <label for="whatsapp">WhatsApp</label>
        <input id="whatsapp" name="whatsapp" type="tel">
      </div>
      <div class="col-md-6">
        <label for="interest">Tipo de interes</label>
        <select id="interest" name="interest" required>
          <option value="Recursos">Recursos</option>
          <option value="Capacitacion">Capacitacion</option>
          <option value="Generador de horarios">Generador de horarios</option>
          <option value="Institucion">Institucion</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      <div class="col-12">
        <label for="message">Mensaje</label>
        <textarea id="message" name="message" rows="5" required></textarea>
      </div>
    </div>
    <div class="stem-actions mt-4">
      <button class="btn-main" type="submit"><i class="bi bi-whatsapp"></i> Preparar mensaje</button>
      <a class="btn-alt" href="mailto:anfaliz@gmail.com"><i class="bi bi-envelope"></i> Enviar correo</a>
    </div>
    <p class="meta-line mt-3 mb-0" data-contact-status>Cuando MySQL este configurado, este formulario podra guardar en `contact_messages`.</p>
  </form>
</section>

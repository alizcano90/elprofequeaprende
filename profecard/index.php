<?php
$pageTitle = 'Mi Ficha Docente - El Profe Que Aprende';
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?php echo htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8'); ?></title>
  <meta name="description" content="Crea gratis una ficha docente personalizada para compartir tu identidad como profe innovador.">
  <link rel="stylesheet" href="assets/vendor/cropper/cropper.min.css">
  <link rel="stylesheet" href="assets/css/profecard.css">
</head>
<body>
  <main class="profecard-page">
    <section class="hero-block" aria-labelledby="pageTitle">
      <p class="eyebrow">Mi Ficha Docente</p>
      <h1 id="pageTitle">Crea tu ficha docente personalizada</h1>
      <p class="lead">Diseña gratis una ficha para compartir tu identidad como profe innovador.</p>
      <p class="intro">Sube tu foto, escribe tus datos y descarga una ficha lista para compartir. Una herramienta gratuita de El Profe Que Aprende para celebrar la creatividad docente.</p>
      <p class="intro intro-worldcup">Puedes activar la camiseta Colombia para crear una ficha con estilo mundialista. Ajusta tu foto hasta que el rostro quede centrado y descarga tu imagen lista para compartir.</p>
    </section>

    <section class="workspace" aria-label="Constructor de ficha docente">
      <form class="editor-panel" id="profecardForm" novalidate>
        <div class="panel-header">
          <h2>Personaliza tu ficha</h2>
          <p>Completa los datos, ajusta la foto y descarga tu tarjeta.</p>
        </div>

        <div class="status-message" id="statusMessage" role="status" aria-live="polite"></div>

        <div class="field-group">
          <label for="photoInput">Foto del docente</label>
          <input id="photoInput" name="photo" type="file" accept="image/jpeg,image/jpg,image/png,image/webp">
          <small>JPG, PNG o WEBP. Máximo 5 MB. La imagen se procesa en tu navegador.</small>
        </div>

        <div class="cropper-panel is-hidden" id="cropperPanel" aria-label="Recorte inicial de foto">
          <div class="cropper-head">
            <strong id="cropperTitle">Recorte inicial</strong>
            <span id="cropperHelp">Ajusta la foto antes de llevarla a la ficha.</span>
          </div>
          <div class="cropper-box">
            <img id="cropperImage" alt="Foto para recortar">
          </div>
          <div class="cropper-actions">
            <button class="secondary-action" type="button" id="applyCrop">Aplicar recorte</button>
            <button class="secondary-action" type="button" id="skipCrop">Usar foto completa</button>
          </div>
        </div>

        <div class="photo-controls" aria-label="Ajustes de foto">
          <button type="button" data-photo-action="zoomIn">Zoom +</button>
          <button type="button" data-photo-action="zoomOut">Zoom -</button>
          <button type="button" data-photo-action="up">Arriba</button>
          <button type="button" data-photo-action="down">Abajo</button>
          <button type="button" data-photo-action="left">Izquierda</button>
          <button type="button" data-photo-action="right">Derecha</button>
          <button type="button" data-photo-action="center">Centrar foto</button>
          <button type="button" data-photo-action="reset">Restablecer foto</button>
        </div>

        <div class="field-grid">
          <div class="field-group field-wide">
            <label for="teacherName">Nombre completo</label>
            <input id="teacherName" name="teacherName" type="text" maxlength="70" value="ANDRES LIZCANO CORRALES" required>
          </div>

          <div class="field-group">
            <label for="teacherRole">Cargo o área</label>
            <input id="teacherRole" name="teacherRole" type="text" maxlength="45" value="DOCENTE TI" required>
          </div>

          <div class="field-group">
            <label for="teacherSpecialty">Especialidad o enfoque</label>
            <input id="teacherSpecialty" name="teacherSpecialty" type="text" maxlength="55" value="PROGRAMACIÓN E IA" required>
          </div>

          <div class="field-group">
            <label for="teacherInstitution">Institución educativa</label>
            <input id="teacherInstitution" name="teacherInstitution" type="text" maxlength="55" value="IE EL RECREO">
          </div>

          <div class="field-group">
            <label for="teacherCountry">País</label>
            <select id="teacherCountry" name="teacherCountry">
              <option value="Colombia" selected>Colombia</option>
              <option value="Otro">Otro país</option>
            </select>
          </div>

          <div class="field-group">
            <label for="teacherRegion">Departamento / región</label>
            <input id="teacherRegion" name="teacherRegion" type="text" maxlength="40" value="Córdoba">
          </div>

          <div class="field-group">
            <label for="teacherYear">Año</label>
            <input id="teacherYear" name="teacherYear" type="number" min="2024" max="2035" value="2026">
          </div>

          <div class="field-group">
            <label for="templateSelect">Plantilla visual</label>
            <select id="templateSelect" name="templateSelect">
              <option value="tecnologias_para_aprender" selected>Tecnologías para Aprender 2026</option>
              <option value="stem_rural" disabled>STEM Rural (próximamente)</option>
              <option value="arduino_maker" disabled>Arduino Maker (próximamente)</option>
              <option value="ia_educativa" disabled>IA Educativa (próximamente)</option>
              <option value="scratch_creativo" disabled>Scratch Creativo (próximamente)</option>
              <option value="institucional_colombia" disabled>Institucional Colombia (próximamente)</option>
            </select>
          </div>

          <div class="field-group">
            <label for="accentColor">Color principal opcional</label>
            <input id="accentColor" name="accentColor" type="color" value="#ff8a1d">
          </div>
        </div>

        <fieldset class="toggle-set">
          <legend>Elementos visibles</legend>
          <label><input id="showInstitution" type="checkbox" checked> Mostrar institución</label>
          <label><input id="showFlag" type="checkbox" checked> Mostrar bandera</label>
          <label><input id="useColombiaShirt" type="checkbox"> Aplicar camiseta Colombia</label>
          <label><input id="showHashtag" type="checkbox" checked disabled> Mostrar hashtag obligatorio</label>
        </fieldset>

        <div class="action-row">
          <button class="primary-action" type="button" id="downloadCard">Descargar mi ficha</button>
          <button class="secondary-action" type="button" id="resetCard">Crear otra ficha</button>
        </div>

        <div class="share-box">
          <label for="shareText">Texto para compartir</label>
          <textarea id="shareText" rows="3" readonly>Ya tengo mi ficha docente personalizada. La hice gratis en El Profe Que Aprende. #ElProfeQueAprende #DocentesInnovadores #Educación</textarea>
          <button class="secondary-action" type="button" id="copyShareText">Compartir texto</button>
        </div>
      </form>

      <aside class="preview-panel" aria-label="Vista previa de la ficha">
        <div class="preview-shell">
          <div id="teacherCard" class="teacher-card template-tecnologias">
            <div class="card-bg-pattern"></div>
            <div class="card-watermark">EPQA</div>

            <header class="card-header">
              <div class="card-main-logo" role="img" aria-label="El Profe Que Aprende">
                <img src="assets/img/logos/epqa-horizontal.png" alt="" onerror="this.classList.add('is-hidden')">
                <span>EL PROFE QUE APRENDE</span>
              </div>
              <div class="card-year" id="cardYear">2026</div>
            </header>

            <div class="country-side" id="countrySide">
              <div class="flag-circle colombia-flag" id="flagCircle" aria-hidden="true">
                <img src="assets/img/flags/colombia.png" alt="" onerror="this.classList.add('is-hidden')">
              </div>
              <div class="country-text" id="cardCountry">COLOMBIA</div>
            </div>

            <div class="photo-stage">
              <div class="photo-placeholder" id="photoPlaceholder">SUBE TU FOTO</div>
              <div class="photo-layer">
                <img id="teacherPhotoPreview" class="teacher-photo" alt="Foto del docente">
              </div>
              <img id="teacherHeadPreview" class="teacher-head hidden" alt="Rostro del docente">
              <img
                id="shirtOverlay"
                class="shirt-overlay hidden"
                src="assets/img/overlays/camiseta-colombia-frente.png"
                alt="Camiseta Selección Colombia">
            </div>

            <footer class="card-info">
              <div class="name-bar" id="cardName">ANDRES LIZCANO CORRALES</div>
              <div class="role-bar" id="cardRole">DOCENTE TI</div>
              <div class="specialty-bar" id="cardSpecialty">PROGRAMACIÓN E IA</div>
              <div class="institution-line" id="cardInstitution">IE EL RECREO</div>
              <div class="region-line" id="cardRegion">CÓRDOBA</div>
              <div class="brand-line" id="cardBrand">Creado con #ElProfeQueAprende</div>
              <div class="web-line">elprofequeaprende.com</div>
            </footer>
          </div>
        </div>
      </aside>
    </section>
  </main>

  <script src="assets/vendor/html2canvas/html2canvas.min.js"></script>
  <script src="assets/vendor/cropper/cropper.min.js"></script>
  <script src="assets/js/profecard.js"></script>
</body>
</html>

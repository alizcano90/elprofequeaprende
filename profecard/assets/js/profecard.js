(function () {
  'use strict';

  var templates = {
    tecnologias_para_aprender: {
      cardClass: 'template-tecnologias',
      label: 'Tecnologías para Aprender 2026'
    },
    stem_rural: { cardClass: 'template-stem-rural', label: 'STEM Rural' },
    arduino_maker: { cardClass: 'template-arduino-maker', label: 'Arduino Maker' },
    ia_educativa: { cardClass: 'template-ia-educativa', label: 'IA Educativa' },
    scratch_creativo: { cardClass: 'template-scratch-creativo', label: 'Scratch Creativo' },
    institucional_colombia: { cardClass: 'template-institucional-colombia', label: 'Institucional Colombia' }
  };

  var state = {
    hasPhoto: false,
    originalPhotoData: '',
    croppedHeadData: '',
    cropMode: 'photo',
    cropper: null,
    shirtOverlayAvailable: true,
    photo: {
      x: 0,
      y: 0,
      zoom: 1
    },
    head: {
      x: 0,
      y: 0,
      zoom: 1
    }
  };

  var els = {
    form: document.getElementById('profecardForm'),
    status: document.getElementById('statusMessage'),
    photoInput: document.getElementById('photoInput'),
    cropperPanel: document.getElementById('cropperPanel'),
    cropperTitle: document.getElementById('cropperTitle'),
    cropperHelp: document.getElementById('cropperHelp'),
    cropperImage: document.getElementById('cropperImage'),
    applyCrop: document.getElementById('applyCrop'),
    skipCrop: document.getElementById('skipCrop'),
    photoPreview: document.getElementById('teacherPhotoPreview'),
    headPreview: document.getElementById('teacherHeadPreview'),
    photoPlaceholder: document.getElementById('photoPlaceholder'),
    shirtOverlay: document.getElementById('shirtOverlay'),
    teacherCard: document.getElementById('teacherCard'),
    nameInput: document.getElementById('teacherName'),
    roleInput: document.getElementById('teacherRole'),
    specialtyInput: document.getElementById('teacherSpecialty'),
    institutionInput: document.getElementById('teacherInstitution'),
    countryInput: document.getElementById('teacherCountry'),
    regionInput: document.getElementById('teacherRegion'),
    yearInput: document.getElementById('teacherYear'),
    templateInput: document.getElementById('templateSelect'),
    accentColor: document.getElementById('accentColor'),
    showInstitution: document.getElementById('showInstitution'),
    showFlag: document.getElementById('showFlag'),
    showHashtag: document.getElementById('showHashtag'),
    useColombiaShirt: document.getElementById('useColombiaShirt'),
    cardName: document.getElementById('cardName'),
    cardRole: document.getElementById('cardRole'),
    cardSpecialty: document.getElementById('cardSpecialty'),
    cardInstitution: document.getElementById('cardInstitution'),
    cardRegion: document.getElementById('cardRegion'),
    cardCountry: document.getElementById('cardCountry'),
    cardYear: document.getElementById('cardYear'),
    countrySide: document.getElementById('countrySide'),
    cardBrand: document.getElementById('cardBrand'),
    downloadButton: document.getElementById('downloadCard'),
    resetButton: document.getElementById('resetCard'),
    copyShareButton: document.getElementById('copyShareText'),
    shareText: document.getElementById('shareText')
  };

  function upper(value, fallback) {
    var text = String(value || '').trim();
    return (text || fallback).toLocaleUpperCase('es-CO');
  }

  function setStatus(message, type) {
    els.status.textContent = message || '';
    els.status.className = 'status-message';
    if (message) {
      els.status.classList.add(type === 'ok' ? 'is-ok' : 'is-error');
    }
  }

  function updatePhotoTransform() {
    els.photoPreview.style.transform = 'translate(-50%, -50%) translate(' + state.photo.x + 'px, ' + state.photo.y + 'px) scale(' + state.photo.zoom.toFixed(2) + ')';
  }

  function updateHeadTransform() {
    els.headPreview.style.transform = 'translateX(-50%) translate(' + state.head.x + 'px, ' + state.head.y + 'px) scale(' + state.head.zoom.toFixed(2) + ')';
  }

  function resetPhotoPosition(useShirtDefaults) {
    state.photo.x = 0;
    state.photo.y = useShirtDefaults ? -80 : 0;
    state.photo.zoom = useShirtDefaults ? 1.05 : 1;
    updatePhotoTransform();
  }

  function resetHeadPosition() {
    state.head.x = 0;
    state.head.y = 0;
    state.head.zoom = 1;
    updateHeadTransform();
  }

  function destroyCropper() {
    if (state.cropper) {
      state.cropper.destroy();
      state.cropper = null;
    }
  }

  function hideCropper() {
    destroyCropper();
    els.cropperPanel.classList.add('is-hidden');
  }

  function getCardScaleFactor() {
    return Math.max(0.42, els.teacherCard.offsetWidth / 1000);
  }

  function fitTextToContainer(element, options) {
    var settings = options || {};
    var scaleFactor = getCardScaleFactor();
    var maxFontSize = (settings.maxFontSize || 58) * scaleFactor;
    var minFontSize = (settings.minFontSize || 24) * scaleFactor;
    var step = settings.step || 1;
    var canvas = fitTextToContainer.canvas || (fitTextToContainer.canvas = document.createElement('canvas'));
    var context = canvas.getContext('2d');
    var computed = window.getComputedStyle(element);
    var paddingX = parseFloat(computed.paddingLeft) + parseFloat(computed.paddingRight);
    var availableWidth = Math.max(0, element.clientWidth - paddingX);

    element.style.fontSize = maxFontSize + 'px';
    element.style.whiteSpace = 'nowrap';
    element.style.overflow = 'hidden';
    element.style.textOverflow = 'clip';

    var textLength = Math.max(1, (element.textContent || '').length);
    var estimatedSize = availableWidth / (textLength * (settings.averageCharWidth || 0.58));
    var currentSize = Math.max(minFontSize, Math.min(maxFontSize, estimatedSize));
    var guard = 0;

    element.style.fontSize = currentSize + 'px';

    void element.offsetWidth;

    function measureCurrentText() {
      context.font = computed.fontStyle + ' ' + computed.fontVariant + ' ' + computed.fontWeight + ' ' + currentSize + 'px ' + computed.fontFamily;
      return context.measureText(element.textContent || '').width;
    }

    while ((measureCurrentText() > availableWidth || element.scrollWidth > element.clientWidth) && currentSize > minFontSize && guard < 180) {
      currentSize -= step;
      if (currentSize < minFontSize) currentSize = minFontSize;
      element.style.fontSize = currentSize + 'px';
      void element.offsetWidth;
      guard += 1;
    }
  }

  function fitCardTexts() {
    window.requestAnimationFrame(function () {
      fitCardTextsNow();
      window.setTimeout(fitCardTextsNow, 0);
    });
  }

  function fitCardTextsNow() {
    fitTextToContainer(els.cardName, { maxFontSize: 58, minFontSize: 14, averageCharWidth: 0.66 });
    fitTextToContainer(els.cardRole, { maxFontSize: 34, minFontSize: 11, averageCharWidth: 0.62 });
    fitTextToContainer(els.cardSpecialty, { maxFontSize: 31, minFontSize: 10, averageCharWidth: 0.58 });
    fitTextToContainer(els.cardInstitution, { maxFontSize: 20, minFontSize: 9 });
    fitTextToContainer(els.cardRegion, { maxFontSize: 16, minFontSize: 8 });
  }

  function updatePhotoStageVisibility() {
    var shirtMode = state.hasPhoto && els.useColombiaShirt.checked && !!state.croppedHeadData;
    var normalPhotoMode = state.hasPhoto && !shirtMode;

    els.photoPreview.classList.toggle('has-image', normalPhotoMode);
    els.headPreview.classList.toggle('hidden', !shirtMode);
    els.photoPlaceholder.classList.toggle('is-hidden', state.hasPhoto);
  }

  function updateShirtVisibility(applyDefaults) {
    updatePhotoStageVisibility();

    if (!state.hasPhoto) {
      els.shirtOverlay.classList.add('hidden');
      if (els.useColombiaShirt.checked) {
        setStatus('Sube una foto para aplicar la camiseta Colombia.', 'error');
      }
      return;
    }

    if (!els.useColombiaShirt.checked) {
      els.shirtOverlay.classList.add('hidden');
      return;
    }

    if (!state.croppedHeadData) {
      els.shirtOverlay.classList.add('hidden');
      setStatus('Para aplicar la camiseta, recorta tu foto dejando rostro y cuello.', 'error');
      return;
    }

    if (!state.shirtOverlayAvailable) {
      els.useColombiaShirt.checked = false;
      els.shirtOverlay.classList.add('hidden');
      setStatus('La camiseta no está disponible todavía. Puedes generar tu ficha sin este efecto.', 'error');
      return;
    }

    els.shirtOverlay.classList.remove('hidden');
    if (applyDefaults) {
      resetHeadPosition();
    }
  }

  function updateCard() {
    els.cardName.textContent = upper(els.nameInput.value, 'ANDRES LIZCANO CORRALES');
    els.cardRole.textContent = upper(els.roleInput.value, 'DOCENTE TI');
    els.cardSpecialty.textContent = upper(els.specialtyInput.value, 'PROGRAMACIÓN E IA');
    els.cardInstitution.textContent = upper(els.institutionInput.value, 'IE EL RECREO');
    els.cardRegion.textContent = upper(els.regionInput.value, '');
    els.cardCountry.textContent = upper(els.countryInput.value, 'COLOMBIA');
    els.cardYear.textContent = String(els.yearInput.value || '2026').trim();

    els.cardInstitution.classList.toggle('is-hidden', !els.showInstitution.checked);
    els.countrySide.classList.toggle('is-hidden', !els.showFlag.checked);
    els.cardBrand.classList.remove('is-hidden');
    els.showHashtag.checked = true;

    var accent = els.accentColor.value || '#ff8a1d';
    els.teacherCard.style.setProperty('--orange', accent);

    var template = templates[els.templateInput.value] || templates.tecnologias_para_aprender;
    els.teacherCard.className = 'teacher-card ' + template.cardClass;

    fitCardTextsNow();
    fitCardTexts();
  }

  function validateRequiredFields() {
    var missing = [];
    if (!state.hasPhoto) missing.push('una foto');
    if (!els.nameInput.value.trim()) missing.push('nombre completo');
    if (!els.roleInput.value.trim()) missing.push('cargo o área');
    if (!els.specialtyInput.value.trim()) missing.push('especialidad');

    if (missing.length) {
      setStatus('Antes de descargar, completa: ' + missing.join(', ') + '.', 'error');
      return false;
    }

    if (els.useColombiaShirt.checked && !state.shirtOverlayAvailable) {
      setStatus('La camiseta no está disponible todavía. Puedes generar tu ficha sin este efecto.', 'error');
      return false;
    }

    if (els.useColombiaShirt.checked && !state.croppedHeadData) {
      setStatus('Recorta rostro y cuello antes de descargar la ficha con camiseta.', 'error');
      openCropper(state.originalPhotoData, 'head');
      return false;
    }

    return true;
  }

  function slugify(value) {
    return String(value || 'docente')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'docente';
  }

  function downloadCard() {
    if (!validateRequiredFields()) return;
    updateShirtVisibility(false);

    if (!window.html2canvas) {
      setStatus('No se encontró html2canvas local. Revisa assets/vendor/html2canvas/html2canvas.min.js.', 'error');
      return;
    }

    setStatus('Preparando tu PNG...', 'ok');
    els.downloadButton.disabled = true;
    fitCardTextsNow();

    var exportScale = 1000 / els.teacherCard.offsetWidth;

    window.html2canvas(els.teacherCard, {
      backgroundColor: null,
      scale: exportScale,
      useCORS: true,
      allowTaint: true,
      width: els.teacherCard.offsetWidth,
      height: els.teacherCard.offsetHeight
    }).then(function (canvas) {
      var link = document.createElement('a');
      var filename = 'ficha-docente-el-profe-que-aprende-' + slugify(els.nameInput.value) + '-' + (els.yearInput.value || '2026') + '.png';
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setStatus('Ficha descargada. Puedes compartirla en redes o WhatsApp.', 'ok');
    }).catch(function () {
      setStatus('No se pudo generar la imagen. Intenta con otra foto o recarga la página.', 'error');
    }).finally(function () {
      els.downloadButton.disabled = false;
    });
  }

  function applyPhotoSource(dataUrl, useShirtDefaults) {
    state.originalPhotoData = state.originalPhotoData || dataUrl;
    els.photoPreview.src = dataUrl;
    state.hasPhoto = true;
    resetPhotoPosition(useShirtDefaults);
    updateShirtVisibility(false);
    setStatus('Foto cargada. Ajusta el encuadre si lo necesitas.', 'ok');
  }

  function applyHeadSource(dataUrl) {
    state.croppedHeadData = dataUrl;
    els.headPreview.src = dataUrl;
    state.hasPhoto = true;
    resetHeadPosition();
    updateShirtVisibility(true);
    setStatus('Recorte de rostro aplicado. Ajusta la cabeza si lo necesitas.', 'ok');
  }

  function openCropper(dataUrl, mode) {
    state.cropMode = mode || 'photo';

    if (!window.Cropper) {
      if (state.cropMode === 'head') {
        applyHeadSource(dataUrl);
      } else {
        applyPhotoSource(dataUrl, false);
      }
      return;
    }

    hideCropper();
    if (state.cropMode === 'head') {
      els.cropperTitle.textContent = 'Recorta rostro y cuello';
      els.cropperHelp.textContent = 'Ajusta el recorte para dejar rostro, cabello y un poco de cuello. La camiseta se agregará automáticamente.';
      els.applyCrop.textContent = 'Usar este recorte';
      els.skipCrop.classList.add('is-hidden');
    } else {
      els.cropperTitle.textContent = 'Recorte inicial';
      els.cropperHelp.textContent = 'Ajusta la foto antes de llevarla a la ficha.';
      els.applyCrop.textContent = 'Aplicar recorte';
      els.skipCrop.classList.remove('is-hidden');
    }
    els.cropperPanel.classList.remove('is-hidden');

    els.cropperImage.onload = function () {
      destroyCropper();
      state.cropper = new window.Cropper(els.cropperImage, {
        aspectRatio: state.cropMode === 'head' ? 3 / 4 : NaN,
        viewMode: 1,
        autoCropArea: 0.9,
        background: false,
        responsive: true,
        movable: true,
        zoomable: true,
        rotatable: false,
        scalable: false
      });
    };
    els.cropperImage.src = dataUrl;
  }

  function applyCrop() {
    if (!state.cropper) {
      if (state.cropMode === 'head') {
        applyHeadSource(state.originalPhotoData);
      } else {
        applyPhotoSource(state.originalPhotoData, false);
      }
      hideCropper();
      return;
    }

    var canvasOptions = state.cropMode === 'head'
      ? { width: 600, height: 800, imageSmoothingQuality: 'high', fillColor: '#ffffff' }
      : { maxWidth: 1800, maxHeight: 1800, imageSmoothingQuality: 'high', fillColor: '#ffffff' };

    var canvas = state.cropper.getCroppedCanvas(canvasOptions);

    if (state.cropMode === 'head') {
      applyHeadSource(canvas.toDataURL('image/png'));
    } else {
      applyPhotoSource(canvas.toDataURL('image/png'), false);
    }
    hideCropper();
  }

  function handlePhotoUpload(event) {
    var file = event.target.files && event.target.files[0];
    var allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!file) return;

    if (allowedTypes.indexOf(file.type) === -1) {
      setStatus('El formato de imagen debe ser JPG, PNG o WEBP.', 'error');
      els.photoInput.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatus('La foto supera los 5 MB. Usa una imagen más liviana.', 'error');
      els.photoInput.value = '';
      return;
    }

    var reader = new FileReader();
    reader.onload = function (loadEvent) {
      state.originalPhotoData = loadEvent.target.result;
      state.croppedHeadData = '';
      els.headPreview.removeAttribute('src');
      if (els.useColombiaShirt.checked) {
        openCropper(state.originalPhotoData, 'head');
        setStatus('Recorta tu foto dejando principalmente rostro, cabeza y un poco de cuello. La camiseta se agregará automáticamente.', 'ok');
      } else {
        openCropper(state.originalPhotoData, 'photo');
        setStatus('Recorta la foto o usa la imagen completa para continuar.', 'ok');
      }
    };
    reader.readAsDataURL(file);
  }

  function handlePhotoAction(action) {
    var step = 16;
    var shirtMode = state.hasPhoto && els.useColombiaShirt.checked && !!state.croppedHeadData;
    var target = shirtMode ? state.head : state.photo;

    if (action === 'zoomIn') target.zoom = Math.min(2.6, target.zoom + 0.08);
    if (action === 'zoomOut') target.zoom = Math.max(0.72, target.zoom - 0.08);
    if (action === 'up') target.y -= step;
    if (action === 'down') target.y += step;
    if (action === 'left') target.x -= step;
    if (action === 'right') target.x += step;
    if (action === 'center') {
      if (shirtMode) {
        resetHeadPosition();
      } else {
        resetPhotoPosition(false);
      }
    }
    if (action === 'reset') {
      if (shirtMode) {
        resetHeadPosition();
      } else {
        if (state.originalPhotoData) applyPhotoSource(state.originalPhotoData, false);
        resetPhotoPosition(false);
      }
    }
    updatePhotoTransform();
    updateHeadTransform();
  }

  function resetForm() {
    els.form.reset();
    els.nameInput.value = 'ANDRES LIZCANO CORRALES';
    els.roleInput.value = 'DOCENTE TI';
    els.specialtyInput.value = 'PROGRAMACIÓN E IA';
    els.institutionInput.value = 'IE EL RECREO';
    els.countryInput.value = 'Colombia';
    els.regionInput.value = 'Córdoba';
    els.yearInput.value = '2026';
    els.templateInput.value = 'tecnologias_para_aprender';
    els.accentColor.value = '#ff8a1d';
    els.showInstitution.checked = true;
    els.showFlag.checked = true;
    els.showHashtag.checked = true;
    els.useColombiaShirt.checked = false;
    els.shirtOverlay.classList.add('hidden');
    els.photoPreview.removeAttribute('src');
    els.headPreview.removeAttribute('src');
    state.hasPhoto = false;
    state.originalPhotoData = '';
    state.croppedHeadData = '';
    updatePhotoStageVisibility();
    hideCropper();
    resetPhotoPosition(false);
    resetHeadPosition();
    updateCard();
    setStatus('Formulario listo para crear otra ficha.', 'ok');
  }

  function copyShareText() {
    var text = els.shareText.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus('Texto copiado. Ya puedes pegarlo en redes o WhatsApp.', 'ok');
      }).catch(function () {
        fallbackCopy(text);
      });
      return;
    }
    fallbackCopy(text);
  }

  function fallbackCopy(text) {
    els.shareText.focus();
    els.shareText.select();
    try {
      document.execCommand('copy');
      setStatus('Texto copiado. Ya puedes pegarlo en redes o WhatsApp.', 'ok');
    } catch (error) {
      setStatus('Selecciona el texto y cópialo manualmente.', 'error');
    }
  }

  function bindEvents() {
    var liveFields = [
      els.nameInput,
      els.roleInput,
      els.specialtyInput,
      els.institutionInput,
      els.countryInput,
      els.regionInput,
      els.yearInput,
      els.templateInput,
      els.accentColor,
      els.showInstitution,
      els.showFlag
    ];

    liveFields.forEach(function (field) {
      field.addEventListener('input', updateCard);
      field.addEventListener('change', updateCard);
    });

    els.photoInput.addEventListener('change', handlePhotoUpload);
    els.applyCrop.addEventListener('click', applyCrop);
    els.skipCrop.addEventListener('click', function () {
      applyPhotoSource(state.originalPhotoData, false);
      hideCropper();
    });
    els.downloadButton.addEventListener('click', downloadCard);
    els.resetButton.addEventListener('click', resetForm);
    els.copyShareButton.addEventListener('click', copyShareText);
    window.addEventListener('resize', fitCardTexts);

    els.useColombiaShirt.addEventListener('change', function () {
      if (els.useColombiaShirt.checked && state.hasPhoto && !state.croppedHeadData) {
        setStatus('Para aplicar la camiseta, recorta tu foto dejando rostro y cuello.', 'error');
        openCropper(state.originalPhotoData, 'head');
        return;
      }
      updateShirtVisibility(true);
    });

    els.shirtOverlay.addEventListener('error', function () {
      state.shirtOverlayAvailable = false;
      els.shirtOverlay.classList.add('hidden');
      els.useColombiaShirt.checked = false;
      els.useColombiaShirt.disabled = true;
      if (els.useColombiaShirt.parentElement) {
        els.useColombiaShirt.parentElement.classList.add('is-hidden');
      }
    });

    els.shirtOverlay.addEventListener('load', function () {
      state.shirtOverlayAvailable = true;
    });

    document.querySelectorAll('[data-photo-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        handlePhotoAction(button.getAttribute('data-photo-action'));
      });
    });
  }

  bindEvents();
  window.setTimeout(function () {
    if (els.shirtOverlay.complete && els.shirtOverlay.naturalWidth === 0) {
      state.shirtOverlayAvailable = false;
      els.shirtOverlay.classList.add('hidden');
      els.useColombiaShirt.checked = false;
      els.useColombiaShirt.disabled = true;
      if (els.useColombiaShirt.parentElement) {
        els.useColombiaShirt.parentElement.classList.add('is-hidden');
      }
    }
  }, 0);
  updateCard();
  updateShirtVisibility(false);
  updatePhotoTransform();
  updateHeadTransform();
})();

// Referencias principales del DOM
const cameraVideo = document.getElementById("cameraVideo");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const startCameraBtn = document.getElementById("startCameraBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");
const cameraStatus = document.getElementById("cameraStatus");
const liveDot = document.getElementById("liveDot");

// Estado global del stream actual
let currentStream = null;

/**
 * Actualiza el mensaje de estado y su estilo visual.
 * @param {string} message - Texto para el usuario.
 * @param {"info"|"success"|"warning"|"error"} type - Tipo visual del mensaje.
 */
function updateStatus(message, type = "info") {
  const allowedTypes = ["info", "success", "warning", "error"];
  const safeType = allowedTypes.includes(type) ? type : "info";

  cameraStatus.textContent = message;
  cameraStatus.className = `status-pill status-${safeType}`;
}

/**
 * Restaura la interfaz al estado inicial cuando no hay cámara activa.
 * @param {string} message - Mensaje a mostrar en la UI.
 * @param {"info"|"success"|"warning"|"error"} type - Tipo visual del estado.
 */
function resetCameraUI(message = "Esperando conexión", type = "info") {
  cameraVideo.style.display = "none";
  cameraPlaceholder.style.display = "grid";
  liveDot.style.display = "none";

  startCameraBtn.disabled = false;
  stopCameraBtn.disabled = true;

  updateStatus(message, type);
}

/**
 * Solicita acceso a la cámara y muestra la previsualización.
 * Intenta primero cámara trasera y luego configuración básica.
 */
async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    updateStatus("Tu navegador no soporta cámara", "error");
    startCameraBtn.disabled = true;
    stopCameraBtn.disabled = true;
    return;
  }

  // Previene múltiples solicitudes simultáneas
  startCameraBtn.disabled = true;
  stopCameraBtn.disabled = true;
  updateStatus("Solicitando permisos...", "warning");

  const preferredConstraints = {
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  };

  const fallbackConstraints = {
    video: true,
    audio: false
  };

  try {
    // Cierra cualquier stream previo para evitar recursos abiertos.
    if (currentStream) {
      stopCamera();
    }

    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia(preferredConstraints);
    } catch (_firstError) {
      stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
    }

    currentStream = stream;
    cameraVideo.srcObject = stream;

    cameraVideo.style.display = "block";
    cameraPlaceholder.style.display = "none";
    liveDot.style.display = "inline-flex";

    stopCameraBtn.disabled = false;
    updateStatus("Cámara conectada correctamente", "success");
  } catch (error) {
    console.error("No se pudo iniciar la cámara:", error);

    let message = "No se pudo acceder a la cámara";
    if (error && typeof error === "object") {
      if (error.name === "NotAllowedError" || error.name === "SecurityError") {
        message = "Permiso denegado. Activa el acceso a cámara para continuar";
      } else if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
        message = "No se encontró una cámara disponible en este dispositivo";
      } else if (error.name === "NotReadableError") {
        message = "La cámara está en uso por otra aplicación";
      }
    }

    resetCameraUI(message, "error");
  }
}

/**
 * Detiene todos los tracks del stream actual y libera recursos.
 */
function stopCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
    currentStream = null;
  }

  cameraVideo.srcObject = null;
  resetCameraUI("Cámara detenida", "info");
}

// Eventos principales de la UI
startCameraBtn.addEventListener("click", startCamera);
stopCameraBtn.addEventListener("click", stopCamera);

// Limpia la cámara cuando se cierra o recarga la página.
window.addEventListener("beforeunload", () => {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
  }
});

// Estado inicial de la aplicación.
resetCameraUI();

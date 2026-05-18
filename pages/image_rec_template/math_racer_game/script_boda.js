const SITE_CONTENT = {
  coupleNames: "Andrés y Saray",
  weddingDate: "25 de febrero de 2028",
  heroQuote:
    "Entre ecuaciones, melodías y cielos infinitos, descubrimos que el amor también es una ciencia: precisa, luminosa y eterna.",
  featuredQuote:
    '"Dos caminos, una misma órbita: cada paso juntos nos acerca al infinito."',
  storyText:
    "Entre aulas, proyectos y conversaciones sin prisa, aprendimos que enseñar también es amar: compartir, construir y crecer. Nuestra historia nació entre ideas, se fortaleció con propósito y hoy celebra una promesa que mira al cielo con gratitud.",
  constellationIntro:
    "Andrés y Saray son dos trayectorias que convergen con precisión hermosa: ingeniería, docencia, tecnología, música y una pasión compartida por comprender el cielo.",
  ceremonyText: "Templo San Gabriel",
  receptionText: "Casa Jardín Boreal",
  timeText: "4:30 p.m.",
  placeText: "Bogotá, Colombia",
  dressCodeText: "Formal elegante",
  tipsText: "Llegar 30 minutos antes",
  addressText: "Calle 00 #00-00, Bogotá, Colombia",
  giftText:
    "Tu presencia será nuestro mejor regalo. Si deseas tener un detalle adicional, puedes apoyarnos en nuestro nuevo hogar con un aporte voluntario.",
  mapLink: "https://maps.google.com",
  weddingDateISO: "2028-02-25T00:00:00-05:00"
};

function applyEditableContent() {
  const nodes = document.querySelectorAll("[data-edit]");
  nodes.forEach((node) => {
    const key = node.getAttribute("data-edit");
    if (Object.prototype.hasOwnProperty.call(SITE_CONTENT, key)) {
      node.textContent = SITE_CONTENT[key];
    }
  });

  const mapBtn = document.getElementById("mapsBtn");
  if (mapBtn) {
    mapBtn.href = SITE_CONTENT.mapLink;
  }
}

function setupMobileMenu() {
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileLinks = document.querySelectorAll(".mobile-link");

  if (!menuBtn || !mobileMenu) return;

  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
    });
  });
}

function setupCountdown() {
  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  const target = new Date(SITE_CONTENT.weddingDateISO).getTime();

  const tick = () => {
    const now = Date.now();
    let diff = target - now;

    if (diff < 0) diff = 0;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    daysEl.textContent = String(days);
    hoursEl.textContent = String(hours).padStart(2, "0");
    minutesEl.textContent = String(minutes).padStart(2, "0");
    secondsEl.textContent = String(seconds).padStart(2, "0");
  };

  tick();
  window.setInterval(tick, 1000);
}

function setupRSVPForm() {
  const form = document.getElementById("rsvpForm");
  const status = document.getElementById("rsvpStatus");

  if (!form || !status) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "Gracias. Tu confirmación fue registrada.";
    form.reset();
  });
}

function initAnimations() {
  if (window.AOS) {
    window.AOS.init({
      duration: 900,
      easing: "ease-out-cubic",
      once: true,
      offset: 30
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyEditableContent();
  setupMobileMenu();
  setupCountdown();
  setupRSVPForm();
  initAnimations();
});

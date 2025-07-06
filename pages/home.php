<?php

// Archivo: home.php
// Guardado: 2025-07-05 23:32:16
// Autor: Andrés Lizcano
?>

<div id="vanta-bg"></div>

<div class="container py-5 content-main">
    <div class="text-center mb-5">
        <img src="assets/img/logo_profequeaprende.svg" alt="Logo El Profe Que Aprende" style="max-width:100px;"
            class="mb-3">
        <h1 class="fw-bold mb-1">El Profe Que Aprende</h1>
        <p class="fs-5 mb-0 text-info">¡Deploy automático funcionando! <?php echo date('Y-m-d H:i:s'); ?></p>
    </div>

    <div class="row g-4 justify-content-center">
        <!-- Card 1 -->
        <div class="col-12 col-sm-6 col-lg-3">
            <a href="?page=resources" class="card-access-link">
                <div class="card custom-card text-center h-100">
                    <div class="card-icon mb-2">
                        <i class="bi bi-cloud-arrow-down"></i>
                    </div>
                    <h5 class="card-title">Recursos Offline</h5>
                    <p class="card-text small">Descarga materiales, guías y recursos.</p>
                </div>
            </a>
        </div>
        <!-- Card 2 -->
        <div class="col-12 col-sm-6 col-lg-3">
            <a href="?page=maker" class="card-access-link">
                <div class="card custom-card text-center h-100">
                    <div class="card-icon mb-2">
                        <i class="bi bi-cpu"></i>
                    </div>
                    <h5 class="card-title">Proyectos Maker</h5>
                    <p class="card-text small">Explora proyectos con Arduino, robótica y más.</p>
                </div>
            </a>
        </div>
        <!-- Card 3 -->
        <div class="col-12 col-sm-6 col-lg-3">
            <a href="?page=about" class="card-access-link">
                <div class="card custom-card text-center h-100">
                    <div class="card-icon mb-2">
                        <i class="bi bi-person-badge"></i>
                    </div>
                    <h5 class="card-title">Quién Soy</h5>
                    <p class="card-text small">Conoce la historia del Profe Que Aprende.</p>
                </div>
            </a>
        </div>
        <!-- Card 4 -->
        <div class="col-12 col-sm-6 col-lg-3">
            <a href="?page=contact" class="card-access-link">
                <div class="card custom-card text-center h-100">
                    <div class="card-icon mb-2">
                        <i class="bi bi-envelope"></i>
                    </div>
                    <h5 class="card-title">Contacto</h5>
                    <p class="card-text small">Escríbeme para colaboraciones o dudas.</p>
                </div>
            </a>
        </div>
        <!-- Card 5 -->
        <div class="col-12 col-sm-6 col-lg-3">
            <a href="#" class="card-access-link">
                <div class="card custom-card text-center h-100">
                    <div class="card-icon mb-2">
                        <i class="bi bi-collection"></i>
                    </div>
                    <h5 class="card-title">Secuencias Didácticas</h5>
                    <p class="card-text small">Accede a propuestas y ejemplos prácticos.</p>
                </div>
            </a>
        </div>
        <!-- Card 6 -->
        <div class="col-12 col-sm-6 col-lg-3">
            <a href="#" class="card-access-link">
                <div class="card custom-card text-center h-100">
                    <div class="card-icon mb-2">
                        <i class="bi bi-music-note-list"></i>
                    </div>
                    <h5 class="card-title">Herramientas TIC</h5>
                    <p class="card-text small">Recursos de tecnología educativa y apps útiles.</p>
                </div>
            </a>
        </div>
        <!-- Card 7 -->
        <div class="col-12 col-sm-6 col-lg-3">
            <a href="#" class="card-access-link">
                <div class="card custom-card text-center h-100">
                    <div class="card-icon mb-2">
                        <i class="bi bi-lightbulb"></i>
                    </div>
                    <h5 class="card-title">Ideas para Clase</h5>
                    <p class="card-text small">Dinámicas, juegos y metodologías activas.</p>
                </div>
            </a>
        </div>
        <!-- Card 8 -->
        <div class="col-12 col-sm-6 col-lg-3">
            <a href="#" class="card-access-link">
                <div class="card custom-card text-center h-100">
                    <div class="card-icon mb-2">
                        <i class="bi bi-github"></i>
                    </div>
                    <h5 class="card-title">Mi GitHub</h5>
                    <p class="card-text small">Explora el código y los repositorios abiertos.</p>
                </div>
            </a>
        </div>
    </div>
</div>

<!-- Estilos personalizados para cards y animaciones -->
<style>
.card-access-link {
    text-decoration: none;
}

.custom-card {
    background: linear-gradient(135deg, #263a4f 80%, #2c4263 100%);
    border: none;
    border-radius: 1.2rem;
    box-shadow: 0 8px 32px rgba(30, 40, 60, 0.18), 0 1.5px 8px 0 rgba(0, 0, 0, 0.10);
    transition: transform 0.15s cubic-bezier(.4, 2, .3, 1), box-shadow 0.15s;
    cursor: pointer;
    color: #fff;
    position: relative;
    overflow: hidden;
    min-height: 220px;
}

.custom-card:hover,
.custom-card:focus {
    transform: translateY(-7px) scale(1.045);
    box-shadow: 0 16px 48px 0 rgba(33, 106, 242, 0.22), 0 3px 12px rgba(0, 0, 0, 0.11);
    background: linear-gradient(135deg, #325fbe 70%, #263a4f 100%);
}

.custom-card .card-icon {
    font-size: 2.7rem;
    color: #3a6cf0;
    margin-top: 1.4rem;
    transition: color 0.2s;
}

.custom-card:hover .card-icon {
    color: #f7b731;
    filter: drop-shadow(0 0 6px #ffe98a88);
}

.custom-card .card-title {
    font-weight: 700;
    margin-bottom: .2rem;
}

.custom-card .card-text {
    color: #d6dbf7;
    font-size: 1rem;
}
</style>
<!-- Bootstrap Icons CDN -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

<script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
<script>
VANTA.NET({
    el: "#vanta-bg",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.0,
    scaleMobile: 1.0,
    color: 0x3a5cfd,
    backgroundColor: 0x1a2332,
    points: 12.0,
    maxDistance: 24.0,
    spacing: 20.0
});
</script>
<?php

// Archivo: home.php
// Guardado: 2025-07-05 23:20:32
// Autor: Andrés Lizcano
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>El Profe Que Aprende</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- Bootstrap 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- DataTables -->
    <link href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css" rel="stylesheet">
    <!-- SweetAlert2 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
    <style>
    html,
    body {
        height: 100%;
        margin: 0;
        background: #1a2332;
        color: #fff;
        font-family: 'Inter', 'Roboto', Arial, sans-serif;
        overflow-x: hidden;
    }

    #vanta-bg {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100vw;
        height: 100vh;
        z-index: 0;
    }

    .content-main {
        position: relative;
        z-index: 1;
        min-height: 100vh;
        padding-top: 5rem;
        padding-bottom: 5rem;
    }

    .navbar {
        background: rgba(30, 40, 60, 0.96) !important;
        z-index: 2;
    }

    .btn-primary {
        background: #216af2;
        border: none;
    }

    .btn-primary:hover {
        background: #1848a0;
    }
    </style>
</head>

<body>
    <div id="vanta-bg"></div>
    <!-- Navbar simple -->
    <nav class="navbar navbar-expand-lg navbar-dark shadow">
        <div class="container-fluid">
            <a class="navbar-brand fw-bold" href="?">El Profe Que Aprende</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a href="?" class="nav-link active">Inicio</a></li>
                    <li class="nav-item"><a href="?page=about" class="nav-link">Quién soy</a></li>
                    <li class="nav-item"><a href="?page=resources" class="nav-link">Recursos</a></li>
                    <li class="nav-item"><a href="?page=contact" class="nav-link">Contacto</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <main class="content-main d-flex align-items-center justify-content-center flex-column">
        <p class="fs-5 mb-0 text-info text-center">¡Deploy automático en acción!</p>
        <h2 class="fw-bold text-center mb-5">
            ¡Deploy automático funcionando! <?php echo date('Y-m-d H:i:s'); ?>
        </h2>

        <div class="p-5 mb-4 bg-light rounded-4 shadow" style="max-width: 700px;">
            <h1 class="display-5 fw-bold text-dark">Bienvenido a El Profe Que Aprende</h1>
            <p class="fs-4 text-secondary">Comparte y descarga recursos offline para docentes, descubre proyectos y
                mucho más.</p>
            <a class="btn btn-primary btn-lg mt-3" href="?page=resources">Ver Recursos</a>
        </div>
    </main>

    <!-- Bootstrap JS, DataTables, SweetAlert2, Three.js, VANTA.NET -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js"></script>
    <script>
    // Fondo animado tipo "neuronas/luz"
    VANTA.NET({
        el: "#vanta-bg",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x3a5cfd, // Azul principal
        backgroundColor: 0x1a2332, // Fondo azul oscuro
        points: 12.0,
        maxDistance: 24.0,
        spacing: 20.0
    });
    </script>
</body>

</html>
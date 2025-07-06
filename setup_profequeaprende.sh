#!/usr/bin/env bash
set -e

echo "🛠️  Creando carpetas…"
mkdir -p pages assets/css assets/js resources .github/workflows

echo "✏️  Generando index.php"
cat > index.php <<'PHP'
<?php
$route = $_GET['page'] ?? 'home';
$allowed = ['home','about','resources','contact'];
if (!in_array($route, $allowed)) { $route = 'home'; }
include __DIR__ . '/header.php';
include __DIR__ . '/pages/' . $route . '.php';
include __DIR__ . '/footer.php';
?>
PHP

echo "✏️  Generando header.php"
cat > header.php <<'HTML'
<!DOCTYPE html>
<html lang='es'>
  <head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <title>El Profe Que Aprende</title>
    <!-- Bootstrap CSS -->
    <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css' rel='stylesheet'>
    <link rel='stylesheet' href='/assets/css/style.css'>
  </head>
  <body>
    <nav class='navbar navbar-expand-lg navbar-dark bg-primary mb-4'>
      <div class='container'>
        <a class='navbar-brand' href='/'>El Profe Que Aprende</a>
        <button class='navbar-toggler' type='button' data-bs-toggle='collapse' data-bs-target='#nav' aria-controls='nav' aria-expanded='false' aria-label='Toggle navigation'>
          <span class='navbar-toggler-icon'></span>
        </button>
        <div class='collapse navbar-collapse' id='nav'>
          <ul class='navbar-nav ms-auto'>
            <li class='nav-item'><a class='nav-link' href='/'>Inicio</a></li>
            <li class='nav-item'><a class='nav-link' href='?page=about'>Quién soy</a></li>
            <li class='nav-item'><a class='nav-link' href='?page=resources'>Recursos</a></li>
            <li class='nav-item'><a class='nav-link' href='?page=contact'>Contacto</a></li>
          </ul>
        </div>
      </div>
    </nav>
    <div class='container'>
HTML

echo "✏️  Generando footer.php"
cat > footer.php <<'HTML'
    </div> <!-- container -->
    <script src='https://code.jquery.com/jquery-3.7.1.min.js'></script>
    <script src='https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'></script>
    <script src='/assets/js/scripts.js'></script>
  </body>
</html>
HTML

echo "✏️  Generando páginas"
cat > pages/home.php <<'HTML'
<div class='p-5 mb-4 bg-light rounded-3'>
  <div class='container py-5'>
    <h1 class='display-5 fw-bold'>Bienvenido a El Profe Que Aprende</h1>
    <p class='col-md-8 fs-4'>Comparte y descarga recursos offline para docentes, descubre proyectos y mucho más.</p>
    <a class='btn btn-primary btn-lg' href='?page=resources'>Ver Recursos</a>
  </div>
</div>
HTML

cat > pages/about.php <<'HTML'
<h2>Quién soy</h2>
<p>Soy <strong>El Profe que Aprende</strong>, docente apasionado por la tecnología y los proyectos maker. Aquí comparto mis materiales, secuencias didácticas y experimentos para que otros educadores los aprovechen.</p>
HTML

cat > pages/resources.php <<'PHP'
<h2>Recursos para Docentes</h2>
<p class='text-muted'>Haz clic en cualquier archivo para descargarlo.</p>
<ul class='list-group'>
<?php
$dir = __DIR__ . '/../resources';
if (is_dir($dir)) {
  $files = array_diff(scandir($dir), ['.','..']);
  foreach ($files as $file) {
    $path = '/resources/' . rawurlencode($file);
    echo "  <li class='list-group-item d-flex justify-content-between align-items-center'>\n";
    echo "    <span>" . htmlspecialchars($file) . "</span>\n";
    echo "    <a class='btn btn-outline-secondary btn-sm' href='{$path}' download>Descargar</a>\n";
    echo "  </li>\n";
  }
} else {
  echo "<li class='list-group-item'>No hay recursos aún.</li>";
}
?>
</ul>
PHP

cat > pages/contact.php <<'HTML'
<h2>Contacto</h2>
<p>Puedes encontrarme en Telegram <a href='https://t.me/ElProfeQueAprende'>@ElProfeQueAprende</a> o escribirme a <a href='mailto:profe@example.com'>profe@example.com</a>.</p>
HTML

echo "✏️  Generando assets"
cat > assets/css/style.css <<'CSS'
/* Estilos personalizados */
body {
  scroll-behavior: smooth;
}
CSS

cat > assets/js/scripts.js <<'JS'
// JS propio (si necesitas algo específico)
$(function() {
  console.log('Site ready!');
});
JS

echo "✏️  Generando workflow GitHub Actions"
cat > .github/workflows/deploy.yml <<'YAML'
name: Deploy to Server
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Upload with rsync
        uses: burnett01/rsync-deployments@v6
        with:
          switches: -avz --delete
          path: ./
          remote_path: ${{ secrets.SSH_PATH }}
          remote_host: ${{ secrets.SSH_HOST }}
          remote_user: ${{ secrets.SSH_USER }}
          remote_key: ${{ secrets.SSH_KEY }}
YAML

echo "✏️  Generando README.md"
cat > README.md <<'MD'
# ElProfeQueAprende.com – Scaffold PHP 8.2 + Bootstrap

## Pasos rápidos

1. Clona este repo y sube tus materiales a `/resources/`.
2. En tu repositorio de GitHub, ve a **Settings → Secrets → Actions** y define:
   - `SSH_HOST`
   - `SSH_USER`
   - `SSH_KEY` (clave privada en formato PEM)
   - `SSH_PATH` (directorio destino, p. ej. `/var/www/profequeaprende`)
3. `git add . && git commit -m "Initial scaffold" && git push origin main`
4. Cada *push* a `main` ejecutará el despliegue automático vía `rsync`.

¡Listo para aprender y compartir! 💻📚
MD

echo "✅  Proyecto creado. ¡Ahora puedes iniciar tu repositorio Git y empezar a trabajar!"

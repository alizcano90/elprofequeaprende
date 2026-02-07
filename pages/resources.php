<h2>Recursos interactivos</h2>
<p class="text-muted">Haz clic en una tarjeta para abrir el recurso (cada carpeta tiene su propio index) o usa los
  botones.</p>

<style>
  .card-resource {
    border: 1px solid #eee;
    border-radius: 12px;
    transition: transform .2s ease, box-shadow .2s ease;
    box-shadow: 0 4px 14px rgba(0, 0, 0, .06);
    cursor: pointer;
    overflow: hidden;
    background: #fff;
    animation: float 5s ease-in-out infinite;
  }

  .card-resource:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 10px 24px rgba(0, 0, 0, .12);
  }

  /* Estado "En construcción" */
  .card-resource.wip {
    cursor: not-allowed;
    animation: none;
    opacity: 0.9;
  }

  .card-resource.wip:hover {
    transform: none;
    box-shadow: 0 4px 14px rgba(0, 0, 0, .06);
  }

  .card-emoji {
    font-size: 42px;
    line-height: 1;
  }

  .card-title {
    font-weight: 600;
    margin: 0;
    font-size: 1rem;
  }

  .card-sub {
    color: #6c757d;
    font-size: .85rem;
    margin: 2px 0 0;
  }

  @keyframes float {

    0%,
    100% {
      transform: translateY(0)
    }

    50% {
      transform: translateY(-6px)
    }
  }
</style>

<div class="row g-3">
  <?php

// Archivo: resources.php
// Guardado: 2025-10-09 09:20:36
// Autor: Andrés Lizcano
  // Archivo: resources.php
  // Guardado: 2025-10-09 09:17:23
  // Autor: Andrés Lizcano
  // Archivo: resources.php
  // Guardado: 2025-10-09 09:11:48
  // Autor: Andrés Lizcano
  $baseDir = __DIR__ . '/../assets/files/EDUTECH OFFLINE';
  $baseUrl = '/assets/files/' . rawurlencode('EDUTECH OFFLINE');

  $emojiMap = [
    'quizzoffline'     => '❓',
    'ruleta_aleatoria' => '🎡',
    'vectores'         => '📐',
    'carreras'         => '🏁',
    'dado'             => '🎲',
    'moneda'           => '🪙',
  ];

  // Directorios en construcción (se muestran con 🚧 y sin enlaces)
  $underConstruction = ['vectores', 'quizzoffline', 'quizz'];

  function prettyName(string $name): string
  {
    $name = str_replace(['_', '-'], ' ', $name);
    return ucwords($name);
  }

  if (is_dir($baseDir)) {
    $entries = array_diff(scandir($baseDir), ['.', '..']);
    $hadAny = false;

    foreach ($entries as $entry) {
      $dirPath = $baseDir . DIRECTORY_SEPARATOR . $entry;
      if (!is_dir($dirPath) || $entry[0] === '.') continue;

      $key   = strtolower($entry);
      $isWip = in_array($key, $underConstruction, true);

      $indexFile = '';
      if (is_file($dirPath . '/index.html')) $indexFile = 'index.html';
      elseif (is_file($dirPath . '/index.php')) $indexFile = 'index.php';

      // Si no hay index, solo mostramos la tarjeta si está en construcción
      if ($indexFile === '' && !$isWip) continue;

      $hadAny = true;

      $emoji = $isWip ? '🚧' : ($emojiMap[$key] ?? '📁');
      $title = prettyName($entry);
      $url   = $indexFile ? ($baseUrl . '/' . rawurlencode($entry) . '/' . $indexFile) : '#';
      $sub   = $isWip ? 'En construcción' : 'Abrir recurso';

      // pequeña variación de animación por tarjeta
      $delay = (mt_rand(0, 800)) / 1000; // 0s - 0.8s

      $cardClasses = 'card-resource p-3' . ($isWip ? ' wip' : '');
      $cardStyle   = "animation-delay: {$delay}s";
      $cardAttrs   = $isWip
        ? "style='{$cardStyle}' aria-disabled='true'"
        : "style='{$cardStyle}' data-url='{$url}' onclick='window.open(this.dataset.url, \"_blank\", \"noopener\")'";

      echo "<div class='col-12 col-sm-6 col-md-4 col-lg-3'>\n";
      echo "  <div class='{$cardClasses}' {$cardAttrs}>\n";
      echo "    <div class='d-flex align-items-center gap-3'>\n";
      echo "      <div class='card-emoji' aria-hidden='true'>{$emoji}</div>\n";
      echo "      <div>\n";
      echo "        <p class='card-title'>{$title}</p>\n";
      echo "        <p class='card-sub'>{$sub}</p>\n";
      echo "        <div class='mt-2 d-flex gap-2'>\n";

      if ($isWip) {
        echo "          <button class='btn btn-outline-secondary btn-sm' disabled>Pronto</button>\n";
      } else {
        echo "          <a class='btn btn-primary btn-sm' href='{$url}' target='_blank' rel='noopener' onclick='event.stopPropagation()'>Abrir en línea</a>\n";
        echo "          <a class='btn btn-outline-secondary btn-sm' href='{$url}' download onclick='event.stopPropagation()'>Descargar</a>\n";
      }

      echo "        </div>\n";
      echo "      </div>\n";
      echo "    </div>\n";
      echo "  </div>\n";
      echo "</div>\n";
    }

    if (!$hadAny) {
      echo "<div class='col-12'><div class='alert alert-warning'>No hay recursos con index disponibles.</div></div>";
    }
  } else {
    echo "<div class='col-12'><div class='alert alert-info'>No se encontró la carpeta de recursos.</div></div>";
  }
  ?>
</div>
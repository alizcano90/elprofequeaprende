<?php

// Archivo: resources.php
// Guardado: 2026-05-01 20:51:04
// Autor: Andrés Lizcano
$baseDir = __DIR__ . '/../assets/files/EDUTECH OFFLINE';
$baseUrl = '/assets/files/' . rawurlencode('EDUTECH OFFLINE');
$downloadBaseUrl = $baseUrl . '/descargas';
$underConstruction = ['quizz'];

$iconMap = [
  'algebra visual' => 'bi-calculator',
  'aprendo_teclado' => 'bi-keyboard',
  'carreras' => 'bi-flag',
  'dado' => 'bi-dice-5',
  'grupos_suspenso' => 'bi-people',
  'hala_cuerda_matematico' => 'bi-people-fill',
  'moneda' => 'bi-coin',
  'puzzlemath' => 'bi-puzzle',
  'quizz' => 'bi-question-circle',
  'ruleta_aleatoria' => 'bi-arrow-repeat',
  'quizzoffline' => 'bi-question-circle',
  'simulador_arduino_didactico' => 'bi-cpu',
  'simulador_palancas' => 'bi-nut',
  'vectores' => 'bi-bezier2',
  'horarios_campeonatos' => 'bi-calendar-week',
];

$descriptionMap = [
  'algebra visual' => 'Modela trinomios con piezas y verifica factorizacion visual en la cuadricula.',
  'aprendo_teclado' => 'Practica ubicacion de teclas y agilidad de escritura con actividades guiadas.',
  'carreras' => 'Juego de velocidad y calculo mental para dinamizar competencias en clase.',
  'dado' => 'Genera resultados aleatorios para retos numericos y actividades gamificadas.',
  'grupos_suspenso' => 'Escribe nombres, deja que reboten y revela grupos con efecto dinamico y suspenso.',
  'hala_cuerda_matematico' => 'Competencia por equipos para resolver ejercicios y avanzar en el tablero.',
  'horarios_campeonatos' => 'Organiza cruces y horarios de torneos escolares de forma rapida y clara.',
  'moneda' => 'Simula probabilidades con lanzamientos para explicar estadistica basica.',
  'puzzlemath' => 'Resuelve rompecabezas matematicos para fortalecer logica y resolucion de problemas.',
  'quizzoffline' => 'Banco de preguntas para evaluaciones rapidas sin depender de internet.',
  'ruleta_aleatoria' => 'Selecciona preguntas, equipos o retos al azar para mantener la clase activa.',
  'simulador_arduino_didactico' => 'Explora montajes, componentes y logica basica de Arduino en modo visual.',
  'simulador_palancas' => 'Experimenta con apoyo, fuerza y resistencia para explicar tipos de palancas.',
  'vectores' => 'Visualizador de magnitudes y direcciones para explicar conceptos vectoriales.',
];

$resourceOrder = [
  'algebra visual',
  'aprendo_teclado',
  'carreras',
  'dado',
  'grupos_suspenso',
  'hala_cuerda_matematico',
  'horarios_campeonatos',
  'moneda',
  'puzzlemath',
  'quizzoffline',
  'ruleta_aleatoria',
  'simulador_arduino_didactico',
  'simulador_palancas',
  'vectores',
];

function epqa_pretty_name(string $name): string
{
  $name = str_replace(['_', '-'], ' ', $name);
  return ucwords($name);
}

function epqa_download_name(string $name): string
{
  return preg_replace('/[^A-Za-z0-9_-]+/', '_', $name) . '.zip';
}

$resources = [];
if (is_dir($baseDir)) {
  $entries = array_diff(scandir($baseDir), ['.', '..']);
  foreach ($entries as $entry) {
    $dirPath = $baseDir . DIRECTORY_SEPARATOR . $entry;
    if (!is_dir($dirPath) || $entry === 'descargas' || ($entry !== '' && $entry[0] === '.')) {
      continue;
    }

    $key = strtolower($entry);
    $isWip = in_array($key, $underConstruction, true);
    $indexFile = '';
    if (is_file($dirPath . '/index.html')) {
      $indexFile = 'index.html';
    } elseif (is_file($dirPath . '/index.php')) {
      $indexFile = 'index.php';
    }

    if ($indexFile === '' && !$isWip) {
      continue;
    }

    $resources[] = [
      'key' => $key,
      'title' => epqa_pretty_name($entry),
      'is_wip' => $isWip,
      'url' => $indexFile !== '' ? ($baseUrl . '/' . rawurlencode($entry) . '/' . $indexFile) : '#',
      'download_url' => $downloadBaseUrl . '/' . rawurlencode(epqa_download_name($entry)),
      'icon' => $iconMap[$key] ?? 'bi-folder2-open',
      'description' => $descriptionMap[$key] ?? 'Recurso offline disponible para abrir o descargar.',
    ];
  }
}

usort($resources, static function (array $a, array $b) use ($resourceOrder): int {
  $posA = array_search($a['key'], $resourceOrder, true);
  $posB = array_search($b['key'], $resourceOrder, true);
  $posA = $posA === false ? PHP_INT_MAX : $posA;
  $posB = $posB === false ? PHP_INT_MAX : $posB;

  if ($posA === $posB) {
    return strcasecmp($a['title'], $b['title']);
  }

  return $posA <=> $posB;
});
?>

<section class="container section-pad">
  <div class="hero-block reveal-up">
    <p class="eyebrow mb-2">Recursos offline</p>
    <h1 class="hero-title">Biblioteca para abrir, proyectar o descargar</h1>
    <p class="hero-subtitle mb-0">
      Abre cada recurso para probarlo o descarga el paquete completo para llevarlo a clase sin depender de internet.
    </p>
  </div>
</section>

<section class="container pb-4">
  <?php if (count($resources) > 0): ?>
    <div class="resource-grid">
      <?php foreach ($resources as $resource): ?>
        <article class="resource-card <?= $resource['is_wip'] ? 'disabled' : '' ?> reveal-up">
          <span class="resource-icon"><i
              class="bi <?= htmlspecialchars($resource['icon'], ENT_QUOTES, 'UTF-8') ?>"></i></span>
          <h2 class="h5 mb-0"><?= htmlspecialchars($resource['title'], ENT_QUOTES, 'UTF-8') ?></h2>
          <p class="meta-line mb-2">
            <?= $resource['is_wip'] ? 'En construccion' : 'Disponible para abrir o descargar' ?>
          </p>
          <p class="resource-hover-tip"><?= htmlspecialchars($resource['description'], ENT_QUOTES, 'UTF-8') ?></p>
          <div class="d-flex gap-2 mt-auto">
            <?php if ($resource['is_wip']): ?>
              <button class="btn btn-outline-secondary btn-sm" type="button" disabled>Pronto</button>
            <?php else: ?>
              <a class="btn btn-sm btn-main" href="<?= htmlspecialchars($resource['url'], ENT_QUOTES, 'UTF-8') ?>"
                target="_blank" rel="noopener">Abrir</a>
              <a class="btn btn-sm btn-alt" href="<?= htmlspecialchars($resource['download_url'], ENT_QUOTES, 'UTF-8') ?>"
                download>Descargar</a>
            <?php endif; ?>
          </div>
        </article>
      <?php endforeach; ?>
    </div>
  <?php else: ?>
    <article class="note-box">
      No se encontro la carpeta de recursos o no hay actividades con archivo de inicio disponible.
    </article>
  <?php endif; ?>
</section>

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

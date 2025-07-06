<?php
$route = $_GET['page'] ?? 'home';
$allowed = ['home','about','resources','contact'];
if (!in_array($route, $allowed)) { $route = 'home'; }
include __DIR__ . '/header.php';
include __DIR__ . '/pages/' . $route . '.php';
include __DIR__ . '/footer.php';
?>

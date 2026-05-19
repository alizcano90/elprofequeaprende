<?php

// Archivo: header.php
// Guardado: 2026-05-18 21:06:54
// Autor: Andrés Lizcano
declare(strict_types=1);

$title = $pageMeta['title'] ?? 'El Profe Que Aprende';
$description = $pageMeta['description'] ?? 'Plataforma educativa para docentes.';
$canonical = site_url(url($currentPage === '404' ? 'home' : $currentPage));
?>
<!DOCTYPE html>
<html lang="es">

<head>
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="icon" type="image/x-icon" href="/assets/img/icons/ep.ico">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($title) ?></title>
  <meta name="description" content="<?= e($description) ?>">
  <link rel="canonical" href="<?= e($canonical) ?>">
  <meta property="og:title" content="<?= e($title) ?>">
  <meta property="og:description" content="<?= e($description) ?>">
  <meta property="og:type" content="website">
  <meta property="og:url" content="<?= e($canonical) ?>">
  <meta property="og:image" content="<?= e(site_url(asset('img/profile.png'))) ?>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Nunito:wght@400;600;700;800;900&display=swap"
    rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="<?= e(asset('css/style.css')) ?>">
</head>

<body class="stem-playground platform-page">
  <?php require __DIR__ . '/nav.php'; ?>
  <main class="site-main">
    <div class="container auth-flash-wrap">
      <?php flash_render(); ?>
    </div>
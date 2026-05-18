<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/flash.php';
require_once __DIR__ . '/../includes/auth.php';

start_secure_session();
require_login();

$provider = $_GET['provider'] ?? '';
if ($provider === 'google') {
    header('Location: /auth/google-start.php?link=1');
    exit;
}
if ($provider === 'microsoft') {
    header('Location: /auth/microsoft-start.php?link=1');
    exit;
}

flash('error', 'Proveedor no valido.');
header('Location: /?pg=mi-cuenta');
exit;

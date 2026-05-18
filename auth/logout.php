<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/flash.php';
require_once __DIR__ . '/../includes/auth.php';

start_secure_session();
logout_user();
start_secure_session();
flash('success', 'Sesion cerrada.');
header('Location: /?pg=home');
exit;

<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/flash.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/oauth.php';

start_secure_session();
$config = auth_config();
$google = $config['google'] ?? [];

if (empty($google['client_id']) || $google['client_id'] === 'GOOGLE_CLIENT_ID') {
    flash('warning', 'Google OAuth aun no esta configurado.');
    header('Location: /?pg=login');
    exit;
}

$_SESSION['oauth_state_google'] = oauth_random();
$_SESSION['oauth_nonce_google'] = oauth_random();
if (isset($_GET['link']) && is_logged_in()) {
    $_SESSION['oauth_link_user_id'] = user_id();
}

$params = [
    'client_id' => $google['client_id'],
    'redirect_uri' => $google['redirect_uri'],
    'response_type' => 'code',
    'scope' => 'openid email profile',
    'state' => $_SESSION['oauth_state_google'],
    'nonce' => $_SESSION['oauth_nonce_google'],
    'prompt' => 'select_account',
];

header('Location: https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params));
exit;

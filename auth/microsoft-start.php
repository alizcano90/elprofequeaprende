<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/flash.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/oauth.php';

start_secure_session();
$config = auth_config();
$ms = $config['microsoft'] ?? [];

if (empty($ms['client_id']) || $ms['client_id'] === 'MICROSOFT_CLIENT_ID') {
    flash('warning', 'Microsoft OAuth aun no esta configurado.');
    header('Location: /?pg=login');
    exit;
}

$_SESSION['oauth_state_microsoft'] = oauth_random();
$_SESSION['oauth_nonce_microsoft'] = oauth_random();
if (isset($_GET['link']) && is_logged_in()) {
    $_SESSION['oauth_link_user_id'] = user_id();
}

$tenant = $ms['tenant'] ?: 'common';
$params = [
    'client_id' => $ms['client_id'],
    'redirect_uri' => $ms['redirect_uri'],
    'response_type' => 'code',
    'response_mode' => 'query',
    'scope' => 'openid email profile',
    'state' => $_SESSION['oauth_state_microsoft'],
    'nonce' => $_SESSION['oauth_nonce_microsoft'],
    'prompt' => 'select_account',
];

header('Location: https://login.microsoftonline.com/' . rawurlencode($tenant) . '/oauth2/v2.0/authorize?' . http_build_query($params));
exit;

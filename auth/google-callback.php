<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/flash.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/oauth.php';

start_secure_session();

try {
    $state = $_GET['state'] ?? '';
    $code = $_GET['code'] ?? '';
    if (!is_string($state) || !hash_equals((string)($_SESSION['oauth_state_google'] ?? ''), $state)) {
        throw new RuntimeException('Validacion OAuth fallida.');
    }
    if (!is_string($code) || $code === '') {
        throw new RuntimeException('Google no devolvio codigo de autorizacion.');
    }

    $config = auth_config();
    $google = $config['google'];
    $tokens = oauth_http_post('https://oauth2.googleapis.com/token', [
        'client_id' => $google['client_id'],
        'client_secret' => $google['client_secret'],
        'redirect_uri' => $google['redirect_uri'],
        'grant_type' => 'authorization_code',
        'code' => $code,
    ]);

    $claims = jwt_payload((string)($tokens['id_token'] ?? ''));
    if (!empty($_SESSION['oauth_nonce_google']) && ($claims['nonce'] ?? null) !== $_SESSION['oauth_nonce_google']) {
        throw new RuntimeException('Nonce OAuth invalido.');
    }
    $profile = oauth_http_get_json('https://openidconnect.googleapis.com/v1/userinfo', (string)$tokens['access_token']);
    $sub = (string)($profile['sub'] ?? $claims['sub'] ?? '');
    if ($sub === '') {
        throw new RuntimeException('Google no devolvio identificador de usuario.');
    }

    unset($_SESSION['oauth_state_google'], $_SESSION['oauth_nonce_google']);
    handle_oauth_user('google', $sub, $profile['email'] ?? null, (string)($profile['name'] ?? $profile['email'] ?? 'Usuario'));
} catch (Throwable $e) {
    audit_log(null, 'google_oauth_failed', ['message' => $e->getMessage()]);
    flash('error', $e->getMessage());
    header('Location: /?pg=login');
    exit;
}

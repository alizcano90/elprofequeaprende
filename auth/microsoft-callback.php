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
    if (!is_string($state) || !hash_equals((string)($_SESSION['oauth_state_microsoft'] ?? ''), $state)) {
        throw new RuntimeException('Validacion OAuth fallida.');
    }
    if (!is_string($code) || $code === '') {
        throw new RuntimeException('Microsoft no devolvio codigo de autorizacion.');
    }

    $config = auth_config();
    $ms = $config['microsoft'];
    $tenant = $ms['tenant'] ?: 'common';
    $tokens = oauth_http_post('https://login.microsoftonline.com/' . rawurlencode($tenant) . '/oauth2/v2.0/token', [
        'client_id' => $ms['client_id'],
        'client_secret' => $ms['client_secret'],
        'redirect_uri' => $ms['redirect_uri'],
        'grant_type' => 'authorization_code',
        'code' => $code,
    ]);

    $claims = jwt_payload((string)($tokens['id_token'] ?? ''));
    if (!empty($_SESSION['oauth_nonce_microsoft']) && ($claims['nonce'] ?? null) !== $_SESSION['oauth_nonce_microsoft']) {
        throw new RuntimeException('Nonce OAuth invalido.');
    }

    $sub = (string)($claims['sub'] ?? '');
    if ($sub === '') {
        throw new RuntimeException('Microsoft no devolvio identificador de usuario.');
    }
    $email = $claims['email'] ?? $claims['preferred_username'] ?? null;
    $name = (string)($claims['name'] ?? $email ?? 'Usuario');
    $tenantId = isset($claims['tid']) ? (string)$claims['tid'] : null;

    unset($_SESSION['oauth_state_microsoft'], $_SESSION['oauth_nonce_microsoft']);
    handle_oauth_user('microsoft', $sub, $email, $name, $tenantId);
} catch (Throwable $e) {
    audit_log(null, 'microsoft_oauth_failed', ['message' => $e->getMessage()]);
    flash('error', $e->getMessage());
    header('Location: /?pg=login');
    exit;
}

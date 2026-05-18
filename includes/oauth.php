<?php
declare(strict_types=1);

function oauth_random(): string
{
    return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
}

function oauth_http_post(string $url, array $fields): array
{
    $body = http_build_query($fields);
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\nAccept: application/json\r\n",
            'content' => $body,
            'timeout' => 20,
            'ignore_errors' => true,
        ],
    ]);
    $raw = file_get_contents($url, false, $context);
    $json = json_decode((string)$raw, true);
    if (!is_array($json) || isset($json['error'])) {
        throw new RuntimeException('No fue posible validar el proveedor de identidad.');
    }
    return $json;
}

function oauth_http_get_json(string $url, string $accessToken): array
{
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "Authorization: Bearer {$accessToken}\r\nAccept: application/json\r\n",
            'timeout' => 20,
            'ignore_errors' => true,
        ],
    ]);
    $raw = file_get_contents($url, false, $context);
    $json = json_decode((string)$raw, true);
    if (!is_array($json) || isset($json['error'])) {
        throw new RuntimeException('No fue posible obtener el perfil del proveedor.');
    }
    return $json;
}

function jwt_payload(string $jwt): array
{
    $parts = explode('.', $jwt);
    if (count($parts) < 2) {
        return [];
    }
    $payload = $parts[1];
    $payload .= str_repeat('=', (4 - strlen($payload) % 4) % 4);
    $json = json_decode(base64_decode(strtr($payload, '-_', '+/')) ?: '', true);
    return is_array($json) ? $json : [];
}

function handle_oauth_user(string $provider, string $providerUserId, ?string $email, string $name, ?string $tenantId = null): void
{
    $identity = find_oauth_identity($provider, $providerUserId);
    if ($identity) {
        $stmt = getConnection()->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => (int)$identity['user_id']]);
        $user = $stmt->fetch();
        if (!$user) {
            throw new RuntimeException('La identidad no tiene usuario asociado.');
        }
        login_user($user);
        audit_log((int)$user['id'], $provider . '_login');
        header('Location: /?pg=mi-cuenta');
        exit;
    }

    if (!empty($_SESSION['oauth_link_user_id']) && is_logged_in()) {
        link_oauth_identity((int)$_SESSION['oauth_link_user_id'], $provider, $providerUserId, $email, $tenantId);
        unset($_SESSION['oauth_link_user_id']);
        flash('success', ucfirst($provider) . ' fue vinculado a tu cuenta.');
        header('Location: /?pg=mi-cuenta');
        exit;
    }

    if ($email && find_user_by_email($email)) {
        flash('warning', 'Ya existe una cuenta con este correo. Inicia sesion con tu contrasena y vincula ' . ucfirst($provider) . ' desde Mi cuenta.');
        header('Location: /?pg=login');
        exit;
    }

    $userId = create_user([
        'full_name' => $name !== '' ? $name : 'Usuario',
        'email' => $email,
        'phone_e164' => null,
        'password_hash' => null,
        'status' => 'active',
        'email_verified_at' => $email ? date('Y-m-d H:i:s') : null,
    ]);
    link_oauth_identity($userId, $provider, $providerUserId, $email, $tenantId);

    $stmt = getConnection()->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $userId]);
    login_user($stmt->fetch());
    audit_log($userId, $provider . '_register');
    header('Location: /?pg=mi-cuenta');
    exit;
}

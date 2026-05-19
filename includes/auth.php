<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/validators.php';

function auth_config(): array
{
    $example = __DIR__ . '/../config/auth.example.php';
    $local = __DIR__ . '/../config/auth.local.php';
    $config = is_file($example) ? require $example : [];
    if (is_file($local)) {
        $config = array_replace_recursive($config, require $local);
    }
    return $config;
}

function current_user(): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    static $user = null;
    if ($user !== null) {
        return $user;
    }

    $stmt = getConnection()->prepare('SELECT id, full_name, email, phone_e164, role, status, created_at, last_login_at FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => (int)$_SESSION['user_id']]);
    $user = $stmt->fetch() ?: null;
    return $user;
}

function user_id(): ?int
{
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

function is_logged_in(): bool
{
    return user_id() !== null;
}

function require_login(): void
{
    if (!is_logged_in()) {
        flash('warning', 'Inicia sesion para continuar.');
        header('Location: /?pg=login');
        exit;
    }
}

function require_role(string $role): void
{
    require_login();
    $user = current_user();
    if (!$user || $user['role'] !== $role) {
        flash('warning', 'No tienes permisos para acceder a esta seccion.');
        header('Location: /?pg=dashboard');
        exit;
    }
}

function user_has_role(string $role): bool
{
    $user = current_user();
    return $user !== null && ($user['role'] ?? '') === $role;
}

function is_superadmin(): bool
{
    return user_has_role('superadmin');
}

function is_admin(): bool
{
    return user_has_role('admin') || is_superadmin();
}

function is_guardian(): bool
{
    return user_has_role('guardian');
}

function is_student_user(): bool
{
    return user_has_role('student');
}

function require_superadmin(): void
{
    require_login();
    if (!is_superadmin()) {
        flash('warning', 'Esta seccion es exclusiva del superusuario.');
        header('Location: /?pg=dashboard');
        exit;
    }
}

function require_any_role(array $roles, bool $superadminAllowed = true): void
{
    require_login();
    $user = current_user();
    $role = (string)($user['role'] ?? '');
    if (($superadminAllowed && $role === 'superadmin') || in_array($role, $roles, true)) {
        return;
    }

    flash('warning', 'No tienes permisos para acceder a esta seccion.');
    header('Location: /?pg=dashboard');
    exit;
}

function normalize_phone(?string $phone): ?string
{
    $digits = preg_replace('/\D+/', '', (string)$phone);
    if ($digits === '') {
        return null;
    }
    if (strlen($digits) === 10 && str_starts_with($digits, '3')) {
        return '+57' . $digits;
    }
    if (strlen($digits) === 12 && str_starts_with($digits, '57')) {
        return '+' . $digits;
    }
    if (str_starts_with((string)$phone, '+') && strlen($digits) >= 10 && strlen($digits) <= 15) {
        return '+' . $digits;
    }
    return '+' . $digits;
}

function find_user_by_identifier(string $identifier): ?array
{
    $identifier = trim($identifier);
    $phone = normalize_phone($identifier);
    $sql = 'SELECT * FROM users WHERE email = :email OR phone_e164 = :phone LIMIT 1';
    $stmt = getConnection()->prepare($sql);
    $stmt->execute([
        'email' => strtolower($identifier),
        'phone' => $phone,
    ]);
    return $stmt->fetch() ?: null;
}

function find_user_by_email(string $email): ?array
{
    $stmt = getConnection()->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => strtolower($email)]);
    return $stmt->fetch() ?: null;
}

function create_user(array $data): int
{
    $columns = ['full_name', 'email', 'phone_e164', 'password_hash', 'role', 'status', 'email_verified_at', 'phone_verified_at', 'created_at'];
    $values = [':full_name', ':email', ':phone_e164', ':password_hash', ':role', ':status', ':email_verified_at', ':phone_verified_at', 'NOW()'];
    $params = [
        'full_name' => $data['full_name'],
        'email' => $data['email'] ?: null,
        'phone_e164' => $data['phone_e164'] ?: null,
        'password_hash' => $data['password_hash'] ?? null,
        'role' => $data['role'] ?? 'teacher',
        'status' => $data['status'] ?? 'active',
        'email_verified_at' => $data['email_verified_at'] ?? null,
        'phone_verified_at' => $data['phone_verified_at'] ?? null,
    ];

    if (users_table_has_column('name')) {
        array_splice($columns, 1, 0, 'name');
        array_splice($values, 1, 0, ':legacy_name');
        $params['legacy_name'] = $data['full_name'];
    }

    $sql = 'INSERT INTO users (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $values) . ')';
    $stmt = getConnection()->prepare($sql);
    $stmt->execute($params);
    return (int)getConnection()->lastInsertId();
}

function users_table_has_column(string $column): bool
{
    static $columns = null;
    if ($columns === null) {
        $stmt = getConnection()->query('SHOW COLUMNS FROM users');
        $columns = array_map(static fn (array $row): string => (string)$row['Field'], $stmt->fetchAll());
    }
    return in_array($column, $columns, true);
}

function login_user(array $user, bool $remember = false): void
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['role'] = (string)$user['role'];
    $_SESSION['full_name'] = (string)$user['full_name'];

    try {
        $stmt = getConnection()->prepare('UPDATE users SET last_login_at = NOW(), last_login_ip = :ip, updated_at = NOW() WHERE id = :id');
        $stmt->execute(['ip' => client_ip(), 'id' => (int)$user['id']]);
    } catch (Throwable $e) {
        error_log('login_user last_login update failed: ' . $e->getMessage());
    }

    try {
        $sessionHash = hash('sha256', session_id());
        $expires = $remember ? 'DATE_ADD(NOW(), INTERVAL 30 DAY)' : 'DATE_ADD(NOW(), INTERVAL 12 HOUR)';
        $sql = "INSERT INTO user_sessions (user_id, session_id_hash, ip_address, user_agent, expires_at, created_at)
                VALUES (:user_id, :hash, :ip, :ua, $expires, NOW())";
        getConnection()->prepare($sql)->execute([
            'user_id' => (int)$user['id'],
            'hash' => $sessionHash,
            'ip' => client_ip(),
            'ua' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
        ]);
    } catch (Throwable $e) {
        error_log('login_user session audit insert failed: ' . $e->getMessage());
    }

    audit_log((int)$user['id'], 'login_success');
}

function logout_user(): void
{
    $id = user_id();
    if ($id) {
        audit_log($id, 'logout');
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool)$params['secure'], (bool)$params['httponly']);
    }
    session_destroy();
}

function client_ip(): string
{
    return substr($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 0, 45);
}

function audit_log(?int $userId, string $event, array $meta = []): void
{
    try {
        $metadataColumn = auth_audit_logs_column();
        $provider = isset($meta['provider']) ? (string)$meta['provider'] : null;
        $identifier = isset($meta['identifier']) ? (string)$meta['identifier'] : null;
        $metadata = $meta ? json_encode($meta, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null;

        $stmt = getConnection()->prepare(
            "INSERT INTO auth_audit_logs (user_id, event_type, provider, identifier, {$metadataColumn}, created_at)
             VALUES (:user_id, :event_type, :provider, :identifier, :metadata, NOW())"
        );
        $stmt->execute([
            'user_id' => $userId,
            'event_type' => $event,
            'provider' => $provider,
            'identifier' => $identifier,
            'metadata' => $metadata,
        ]);
    } catch (Throwable $e) {
        error_log('audit_log failed: ' . $e->getMessage());
    }
}

function auth_audit_logs_column(): string
{
    static $column = null;
    if ($column !== null) {
        return $column;
    }

    try {
        $stmt = getConnection()->query('SHOW COLUMNS FROM auth_audit_logs');
        $columns = array_map(static fn (array $row): string => (string)$row['Field'], $stmt->fetchAll());
        $column = in_array('metadata', $columns, true) ? 'metadata' : 'meta_json';
    } catch (Throwable $e) {
        error_log('auth_audit_logs_column failed: ' . $e->getMessage());
        $column = 'metadata';
    }

    return $column;
}

function too_many_login_attempts(string $identifier): bool
{
    $stmt = getConnection()->prepare(
        'SELECT COUNT(*) FROM login_attempts
         WHERE identifier = :identifier AND ip_address = :ip AND success = 0 AND attempted_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)'
    );
    $stmt->execute(['identifier' => strtolower($identifier), 'ip' => client_ip()]);
    return (int)$stmt->fetchColumn() >= 6;
}

function record_login_attempt(string $identifier, bool $success, ?int $userId = null, ?string $failureReason = null): void
{
    try {
        $stmt = getConnection()->prepare(
            'INSERT INTO login_attempts (identifier, ip_address, success, failure_reason, attempted_at)
             VALUES (:identifier, :ip_address, :success, :failure_reason, NOW())'
        );
        $stmt->execute([
            'identifier' => strtolower($identifier),
            'ip_address' => client_ip(),
            'success' => $success ? 1 : 0,
            'failure_reason' => $success ? null : $failureReason,
        ]);
        error_log('login attempt inserted: success=' . ($success ? '1' : '0') . ' identifier_hash=' . hash('sha256', strtolower($identifier)));
    } catch (Throwable $e) {
        error_log('record_login_attempt failed: ' . $e->getMessage());
        throw $e;
    }
}

function find_oauth_identity(string $provider, string $providerUserId): ?array
{
    $stmt = getConnection()->prepare('SELECT * FROM user_identities WHERE provider = :provider AND provider_user_id = :provider_user_id LIMIT 1');
    $stmt->execute(['provider' => $provider, 'provider_user_id' => $providerUserId]);
    return $stmt->fetch() ?: null;
}

function link_oauth_identity(int $userId, string $provider, string $providerUserId, ?string $email, ?string $tenantId = null): void
{
    $stmt = getConnection()->prepare(
        'INSERT INTO user_identities (user_id, provider, provider_user_id, provider_tenant_id, email, created_at, updated_at)
         VALUES (:user_id, :provider, :provider_user_id, :tenant, :email, NOW(), NOW())'
    );
    $stmt->execute([
        'user_id' => $userId,
        'provider' => $provider,
        'provider_user_id' => $providerUserId,
        'tenant' => $tenantId,
        'email' => $email,
    ]);
    audit_log($userId, 'link_' . $provider);
}

function user_identities(int $userId): array
{
    $stmt = getConnection()->prepare('SELECT provider, provider_user_id, provider_tenant_id, email, created_at FROM user_identities WHERE user_id = :id');
    $stmt->execute(['id' => $userId]);
    return $stmt->fetchAll();
}

function create_user_token(int $userId, string $type, int $minutes = 60): string
{
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $stmt = getConnection()->prepare(
        'INSERT INTO user_tokens (user_id, token_type, token_hash, expires_at, created_at)
         VALUES (:user_id, :type, :hash, DATE_ADD(NOW(), INTERVAL :minutes MINUTE), NOW())'
    );
    $stmt->bindValue('user_id', $userId, PDO::PARAM_INT);
    $stmt->bindValue('type', $type);
    $stmt->bindValue('hash', $hash);
    $stmt->bindValue('minutes', $minutes, PDO::PARAM_INT);
    $stmt->execute();
    return $token;
}

function safe_redirect(string $fallback = '/?pg=home'): void
{
    $to = $_GET['redirect'] ?? $fallback;
    if (!is_string($to) || !str_starts_with($to, '/') || str_starts_with($to, '//')) {
        $to = $fallback;
    }
    header('Location: ' . $to);
    exit;
}

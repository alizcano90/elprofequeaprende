<?php
$localMessage = null;
$localMessageType = 'error';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        error_log('login POST recibido');
        verify_csrf();
        error_log('login CSRF valido');

        $identifier = clean_text($_POST['identifier'] ?? '');
        $password = (string)($_POST['password'] ?? '');
        $remember = isset($_POST['remember']);

        if ($identifier === '' || $password === '') {
            throw new RuntimeException('Ingresa tu correo o celular y tu contrasena.');
        }
        if (too_many_login_attempts($identifier)) {
            throw new RuntimeException('Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.');
        }

        $user = find_user_by_identifier($identifier);
        error_log('login usuario encontrado=' . ($user ? '1' : '0'));

        if (!$user) {
            record_login_attempt($identifier, false, null, 'user_not_found');
            audit_log(null, 'login_failed', ['identifier' => $identifier, 'failure_reason' => 'user_not_found']);
            throw new RuntimeException('Usuario no encontrado.');
        }

        $hasPasswordHash = !empty($user['password_hash']);
        error_log('login password_hash presente=' . ($hasPasswordHash ? '1' : '0'));
        if (!$hasPasswordHash) {
            record_login_attempt($identifier, false, (int)$user['id'], 'missing_password');
            audit_log((int)$user['id'], 'login_failed', ['identifier' => $identifier, 'failure_reason' => 'missing_password']);
            throw new RuntimeException('Cuenta sin contraseña configurada.');
        }

        $passwordOk = password_verify($password, (string)$user['password_hash']);
        error_log('login password_verify=' . ($passwordOk ? '1' : '0'));
        if (!$passwordOk) {
            record_login_attempt($identifier, false, (int)$user['id'], 'wrong_password');
            audit_log((int)$user['id'], 'login_failed', ['identifier' => $identifier, 'failure_reason' => 'wrong_password']);
            throw new RuntimeException('Contraseña incorrecta.');
        }

        if (in_array($user['status'], ['blocked', 'deleted'], true)) {
            record_login_attempt($identifier, false, (int)$user['id'], 'account_' . $user['status']);
            audit_log((int)$user['id'], 'login_failed', ['identifier' => $identifier, 'failure_reason' => 'account_' . $user['status']]);
            throw new RuntimeException('Cuenta bloqueada.');
        }

        record_login_attempt($identifier, true, (int)$user['id']);
        error_log('login intento insertado success=1');
        login_user($user, $remember);
        error_log('login sesion iniciada user_id=' . (int)$user['id']);
        flash('success', 'Sesion iniciada correctamente.');
        safe_redirect('/?pg=mi-cuenta');
    } catch (PDOException $e) {
        error_log('login SQL error: ' . $e->getMessage());
        $localMessage = 'No pudimos iniciar sesion en este momento. Intenta nuevamente.';
    } catch (RuntimeException $e) {
        $localMessage = $e->getMessage();
    } catch (Throwable $e) {
        error_log('login unexpected error: ' . $e->getMessage());
        $localMessage = 'Error interno controlado.';
    }
}
?>
<section class="auth-section">
  <div class="auth-card reveal-up">
    <div class="auth-header">
      <p class="auth-eyebrow"><i class="bi bi-person-check-fill"></i> Acceso docente</p>
      <h1 class="auth-title">Ingresar</h1>
      <p class="auth-subtitle">Entra con correo, celular o una cuenta institucional.</p>
    </div>
    <?php if ($localMessage): ?>
      <div class="alert alert-<?= e($localMessageType) ?> auth-alert auth-alert-<?= e($localMessageType) ?>"><?= e($localMessage) ?></div>
    <?php endif; ?>
    <form method="post" action="<?= e(url('login')) ?>" class="auth-form" novalidate>
      <?= csrf_field() ?>
      <div class="form-group">
        <label class="form-label" for="identifier">Correo o celular</label>
        <input class="form-control" id="identifier" name="identifier" type="text" autocomplete="username" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="password">Contraseña</label>
        <input class="form-control" id="password" name="password" type="password" autocomplete="current-password" required>
      </div>
      <label class="form-check">
        <input type="checkbox" name="remember" value="1">
        <span>Recordarme</span>
      </label>
      <div class="auth-actions">
        <button type="submit" class="btn-auth-primary"><i class="bi bi-box-arrow-in-right"></i> Ingresar</button>
      </div>
    </form>
    <div class="auth-links">
      <a href="<?= e(url('registro')) ?>">Crear cuenta</a>
      <a href="<?= e(url('recuperar-password')) ?>">Olvidé mi contraseña</a>
    </div>
    <div class="auth-separator"><span>o continúa con</span></div>
    <div class="social-auth-grid">
      <a class="btn-auth-secondary" href="/auth/google-start.php"><i class="bi bi-google"></i> Continuar con Google</a>
      <a class="btn-auth-secondary" href="/auth/microsoft-start.php"><i class="bi bi-microsoft"></i> Continuar con Microsoft</a>
    </div>
  </div>
</section>

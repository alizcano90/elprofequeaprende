<?php
$localMessage = null;
$localMessageType = 'error';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        verify_csrf();
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
        if (!$user || empty($user['password_hash']) || !password_verify($password, (string)$user['password_hash'])) {
            record_login_attempt($identifier, false, $user['id'] ?? null);
            audit_log($user['id'] ?? null, 'login_failed', ['identifier' => $identifier]);
            throw new RuntimeException('Datos de acceso incorrectos.');
        }
        if (in_array($user['status'], ['blocked', 'deleted'], true)) {
            record_login_attempt($identifier, false, (int)$user['id']);
            throw new RuntimeException('Esta cuenta no puede ingresar. Contacta soporte.');
        }

        record_login_attempt($identifier, true, (int)$user['id']);
        login_user($user, $remember);
        flash('success', 'Sesión iniciada correctamente.');
        safe_redirect('/?pg=mi-cuenta');
    } catch (PDOException $e) {
        error_log('login failed: ' . $e->getMessage());
        $localMessage = 'No pudimos iniciar sesión en este momento. Intenta nuevamente.';
    } catch (Throwable $e) {
        $localMessage = $e->getMessage();
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

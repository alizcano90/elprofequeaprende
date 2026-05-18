<?php
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
        flash('success', 'Sesion iniciada correctamente.');
        safe_redirect('/?pg=mi-cuenta');
    } catch (Throwable $e) {
        flash('error', $e->getMessage());
    }
}
?>
<section class="container section-pad auth-page">
  <div class="auth-card reveal-up">
    <p class="stem-label"><i class="bi bi-person-check-fill"></i> Acceso docente</p>
    <h1>Ingresar</h1>
    <p class="auth-muted">Entra con correo, celular o una cuenta institucional.</p>
    <div class="social-auth-grid">
      <a class="btn-social" href="/auth/google-start.php"><i class="bi bi-google"></i> Continuar con Google</a>
      <a class="btn-social" href="/auth/microsoft-start.php"><i class="bi bi-microsoft"></i> Continuar con Microsoft</a>
    </div>
    <div class="auth-separator"><span>o ingresa con correo/celular</span></div>
    <form method="post" class="auth-form">
      <?= csrf_field() ?>
      <label for="identifier">Correo o celular</label>
      <input id="identifier" name="identifier" type="text" autocomplete="username" required>
      <label for="password">Contrasena</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required>
      <label class="auth-check"><input type="checkbox" name="remember" value="1"> Recordarme</label>
      <button class="btn-main w-100" type="submit"><i class="bi bi-box-arrow-in-right"></i> Ingresar</button>
    </form>
    <div class="auth-links">
      <a href="<?= e(url('registro')) ?>">Crear cuenta</a>
      <a href="<?= e(url('recuperar-password')) ?>">Olvide mi contrasena</a>
    </div>
  </div>
</section>

<?php
$form = [
    'full_name' => '',
    'email' => '',
    'phone' => '',
];
$localMessage = null;
$localMessageType = 'error';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        verify_csrf();
        $name = clean_text($_POST['full_name'] ?? '');
        $email = strtolower(clean_text($_POST['email'] ?? ''));
        $phone = normalize_phone($_POST['phone'] ?? '');
        $password = (string)($_POST['password'] ?? '');
        $confirm = (string)($_POST['password_confirm'] ?? '');
        $form = [
            'full_name' => $name,
            'email' => $email,
            'phone' => clean_text($_POST['phone'] ?? ''),
        ];

        if ($name === '') {
            throw new RuntimeException('Ingresa tu nombre completo.');
        }
        if ($email === '' && !$phone) {
            throw new RuntimeException('Debes ingresar un correo o un celular.');
        }
        if ($email !== '' && !is_valid_email($email)) {
            throw new RuntimeException('El correo no tiene un formato valido.');
        }
        if ($password !== $confirm) {
            throw new RuntimeException('Las contraseñas no coinciden.');
        }
        if ($message = password_strength_message($password)) {
            throw new RuntimeException($message);
        }
        if (empty($_POST['terms_accepted']) || empty($_POST['privacy_accepted'])) {
            throw new RuntimeException('Debes aceptar los términos y la política de privacidad.');
        }
        if ($email !== '' && find_user_by_identifier($email)) {
            throw new RuntimeException('Este correo ya está registrado.');
        }
        if ($phone && find_user_by_identifier($phone)) {
            throw new RuntimeException('Este celular ya está registrado.');
        }

        $userId = create_user([
            'full_name' => $name,
            'email' => $email ?: null,
            'phone_e164' => $phone,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'status' => 'active',
        ]);
        if ($email !== '') {
            create_user_token($userId, 'email_verification', 1440);
        }
        audit_log($userId, 'register');
        flash('success', 'Cuenta creada correctamente. Ya puedes iniciar sesión.');
        header('Location: /?pg=login');
        exit;
    } catch (PDOException $e) {
        error_log('register failed: ' . $e->getMessage());
        if (($e->errorInfo[0] ?? '') === '23000') {
            $localMessage = 'Este correo o celular ya está registrado.';
        } else {
            $localMessage = 'No pudimos crear la cuenta en este momento. Intenta nuevamente.';
        }
    } catch (Throwable $e) {
        $localMessage = $e->getMessage();
    }
}
?>
<section class="auth-section">
  <div class="auth-card auth-card-wide reveal-up">
    <div class="auth-header">
      <p class="auth-eyebrow"><i class="bi bi-person-plus-fill"></i> Nueva cuenta</p>
      <h1 class="auth-title">Crear cuenta</h1>
      <p class="auth-subtitle">Usa correo, celular o ambos para acceder a tus recursos, capacitaciones y herramientas.</p>
    </div>
    <?php if ($localMessage): ?>
      <div class="alert alert-<?= e($localMessageType) ?> auth-alert auth-alert-<?= e($localMessageType) ?>"><?= e($localMessage) ?></div>
    <?php endif; ?>
    <form method="post" action="<?= e(url('registro')) ?>" class="auth-form" novalidate>
      <?= csrf_field() ?>
      <div class="form-group">
        <label class="form-label" for="full_name">Nombre completo</label>
        <input class="form-control" id="full_name" name="full_name" type="text" autocomplete="name" value="<?= e($form['full_name']) ?>" required>
      </div>
      <div class="auth-grid">
        <div class="form-group">
          <label class="form-label" for="email">Correo electrónico</label>
          <input class="form-control" id="email" name="email" type="email" autocomplete="email" value="<?= e($form['email']) ?>">
        </div>
        <div class="form-group">
          <label class="form-label" for="phone">Número de celular</label>
          <input class="form-control" id="phone" name="phone" type="tel" autocomplete="tel" placeholder="3001234567" value="<?= e($form['phone']) ?>">
        </div>
      </div>
      <div class="auth-grid">
        <div class="form-group">
          <label class="form-label" for="password">Contraseña</label>
          <input class="form-control" id="password" name="password" type="password" autocomplete="new-password" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="password_confirm">Confirmar contraseña</label>
          <input class="form-control" id="password_confirm" name="password_confirm" type="password" autocomplete="new-password" required>
        </div>
      </div>
      <label class="form-check">
        <input type="checkbox" name="terms_accepted" value="1" required>
        <span>Acepto términos</span>
      </label>
      <label class="form-check">
        <input type="checkbox" name="privacy_accepted" value="1" required>
        <span>Acepto política de privacidad</span>
      </label>
      <div class="auth-actions">
        <button type="submit" class="btn-auth-primary"><i class="bi bi-person-plus"></i> Crear cuenta</button>
      </div>
    </form>
    <div class="auth-links"><a href="<?= e(url('login')) ?>">Ya tengo cuenta</a></div>
    <div class="auth-separator"><span>o continúa con</span></div>
    <div class="social-auth-grid">
      <a class="btn-auth-secondary" href="/auth/google-start.php"><i class="bi bi-google"></i> Continuar con Google</a>
      <a class="btn-auth-secondary" href="/auth/microsoft-start.php"><i class="bi bi-microsoft"></i> Continuar con Microsoft</a>
    </div>
  </div>
</section>

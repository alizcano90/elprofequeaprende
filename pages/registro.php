<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        verify_csrf();
        $name = clean_text($_POST['full_name'] ?? '');
        $email = strtolower(clean_text($_POST['email'] ?? ''));
        $phone = normalize_phone($_POST['phone'] ?? '');
        $password = (string)($_POST['password'] ?? '');
        $confirm = (string)($_POST['password_confirm'] ?? '');

        if ($name === '') {
            throw new RuntimeException('Ingresa tu nombre completo.');
        }
        if ($email === '' && !$phone) {
            throw new RuntimeException('Debes ingresar al menos correo o celular.');
        }
        if ($email !== '' && !is_valid_email($email)) {
            throw new RuntimeException('El correo no tiene un formato valido.');
        }
        if ($password !== $confirm) {
            throw new RuntimeException('Las contrasenas no coinciden.');
        }
        if ($message = password_strength_message($password)) {
            throw new RuntimeException($message);
        }
        if (empty($_POST['terms']) || empty($_POST['privacy'])) {
            throw new RuntimeException('Debes aceptar terminos y politica de privacidad.');
        }
        if ($email !== '' && find_user_by_identifier($email)) {
            throw new RuntimeException('Ya existe una cuenta con ese correo.');
        }
        if ($phone && find_user_by_identifier($phone)) {
            throw new RuntimeException('Ya existe una cuenta con ese celular.');
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
        flash('success', 'Cuenta creada. Ya puedes iniciar sesion.');
        header('Location: /?pg=login');
        exit;
    } catch (Throwable $e) {
        flash('error', $e->getMessage());
    }
}
?>
<section class="container section-pad auth-page">
  <div class="auth-card reveal-up">
    <p class="stem-label"><i class="bi bi-person-plus-fill"></i> Nueva cuenta</p>
    <h1>Crear cuenta</h1>
    <p class="auth-muted">Usa correo, celular o ambos. El celular colombiano se normaliza a formato +57.</p>
    <form method="post" class="auth-form">
      <?= csrf_field() ?>
      <label for="full_name">Nombre completo</label>
      <input id="full_name" name="full_name" type="text" autocomplete="name" required>
      <label for="email">Correo electronico opcional</label>
      <input id="email" name="email" type="email" autocomplete="email">
      <label for="phone">Numero de celular opcional</label>
      <input id="phone" name="phone" type="tel" autocomplete="tel" placeholder="3001234567">
      <label for="password">Contrasena</label>
      <input id="password" name="password" type="password" autocomplete="new-password" required>
      <label for="password_confirm">Confirmar contrasena</label>
      <input id="password_confirm" name="password_confirm" type="password" autocomplete="new-password" required>
      <label class="auth-check"><input type="checkbox" name="terms" value="1" required> Acepto terminos</label>
      <label class="auth-check"><input type="checkbox" name="privacy" value="1" required> Acepto politica de privacidad</label>
      <button class="btn-main w-100" type="submit"><i class="bi bi-person-plus"></i> Crear cuenta</button>
    </form>
    <div class="auth-links"><a href="<?= e(url('login')) ?>">Ya tengo cuenta</a></div>
  </div>
</section>

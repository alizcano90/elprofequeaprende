<?php
$devToken = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        verify_csrf();
        $email = strtolower(clean_text($_POST['email'] ?? ''));
        if (!is_valid_email($email)) {
            throw new RuntimeException('Ingresa un correo valido.');
        }
        $user = find_user_by_email($email);
        if ($user) {
            $devToken = create_user_token((int)$user['id'], 'password_reset', 60);
            audit_log((int)$user['id'], 'password_reset_requested');
        }
        flash('success', 'Si el correo existe, enviaremos instrucciones para recuperar el acceso.');
    } catch (Throwable $e) {
        flash('error', $e->getMessage());
    }
}
?>
<section class="container section-pad auth-page">
  <div class="auth-card reveal-up">
    <p class="stem-label"><i class="bi bi-key-fill"></i> Recuperacion</p>
    <h1>Recuperar contrasena</h1>
    <p class="auth-muted">No revelamos si el correo existe o no. El envio de correo queda preparado para produccion.</p>
    <form method="post" class="auth-form">
      <?= csrf_field() ?>
      <label for="email">Correo electronico</label>
      <input id="email" name="email" type="email" required>
      <button class="btn-main w-100" type="submit">Solicitar enlace</button>
    </form>
    <?php if ($devToken && (auth_config()['development'] ?? false)): ?>
      <p class="meta-line mt-3">Token desarrollo: <?= e($devToken) ?></p>
    <?php endif; ?>
  </div>
</section>

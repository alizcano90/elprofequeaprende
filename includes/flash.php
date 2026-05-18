<?php
declare(strict_types=1);

function flash(string $type, string $message): void
{
    $_SESSION['flash'][] = ['type' => $type, 'message' => $message];
}

function flash_all(): array
{
    $messages = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return is_array($messages) ? $messages : [];
}

function flash_render(): void
{
    foreach (flash_all() as $item) {
        $type = $item['type'] === 'success' ? 'success' : ($item['type'] === 'warning' ? 'warning' : 'danger');
        echo '<div class="auth-alert auth-alert-' . e($type) . '">' . e((string)$item['message']) . '</div>';
    }
}

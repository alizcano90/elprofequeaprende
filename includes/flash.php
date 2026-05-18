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
        $rawType = (string)($item['type'] ?? 'error');
        $type = in_array($rawType, ['success', 'warning', 'info'], true) ? $rawType : 'error';
        echo '<div class="alert alert-' . e($type) . ' auth-alert auth-alert-' . e($type) . '">' . e((string)$item['message']) . '</div>';
    }
}

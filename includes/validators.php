<?php
declare(strict_types=1);

function is_valid_email(?string $email): bool
{
    return is_string($email) && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function clean_text(?string $value): string
{
    return trim((string)$value);
}

function password_strength_message(string $password): ?string
{
    if (strlen($password) < 8) {
        return 'La contrasena debe tener minimo 8 caracteres.';
    }

    return null;
}

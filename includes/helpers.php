<?php
declare(strict_types=1);

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function url(string $page): string
{
    return '/?pg=' . rawurlencode($page);
}

function asset(string $path): string
{
    return '/assets/' . ltrim($path, '/');
}

function is_active(string $page, string $currentPage): string
{
    return $page === $currentPage ? ' active' : '';
}

function site_url(string $path = '/'): string
{
    $host = $_SERVER['HTTP_HOST'] ?? 'elprofequeaprende.com';
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    return $scheme . '://' . $host . $path;
}

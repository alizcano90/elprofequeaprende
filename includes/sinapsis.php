<?php
declare(strict_types=1);

function sinapsis_students_for_parent(PDO $pdo, int $parentUserId): array
{
    if (!table_exists($pdo, 'sinapsis_students')) {
        return [];
    }
    $stmt = $pdo->prepare(
        'SELECT id, full_name, age_group, visible_category, current_path, schedule_label, status
         FROM sinapsis_students
         WHERE parent_user_id = :parent_user_id
         ORDER BY full_name'
    );
    $stmt->execute(['parent_user_id' => $parentUserId]);
    return $stmt->fetchAll();
}

function sinapsis_progress_for_student(PDO $pdo, int $studentId, int $parentUserId): array
{
    if (!table_exists($pdo, 'sinapsis_progress')) {
        return [];
    }
    $stmt = $pdo->prepare(
        'SELECT p.title, p.description, p.skill_area, p.level, p.progress_date, p.photo_path
         FROM sinapsis_progress p
         INNER JOIN sinapsis_students s ON s.id = p.student_id
         WHERE p.student_id = :student_id AND s.parent_user_id = :parent_user_id
         ORDER BY p.progress_date DESC, p.id DESC'
    );
    $stmt->execute(['student_id' => $studentId, 'parent_user_id' => $parentUserId]);
    return $stmt->fetchAll();
}

function sinapsis_all_students(PDO $pdo): array
{
    if (!table_exists($pdo, 'sinapsis_students')) {
        return [];
    }
    $stmt = $pdo->query(
        'SELECT s.id, s.full_name, s.age_group, s.visible_category, s.current_path, s.status, u.email AS parent_email
         FROM sinapsis_students s
         LEFT JOIN users u ON u.id = s.parent_user_id
         ORDER BY s.created_at DESC, s.id DESC'
    );
    return $stmt->fetchAll();
}

function sinapsis_recent_progress(PDO $pdo): array
{
    if (!table_exists($pdo, 'sinapsis_progress')) {
        return [];
    }
    $stmt = $pdo->query(
        'SELECT p.title, p.skill_area, p.level, p.progress_date, s.full_name AS student_name
         FROM sinapsis_progress p
         INNER JOIN sinapsis_students s ON s.id = p.student_id
         ORDER BY p.progress_date DESC, p.id DESC
         LIMIT 12'
    );
    return $stmt->fetchAll();
}

function sinapsis_find_parent_by_email(PDO $pdo, string $email): ?array
{
    if ($email === '') {
        return null;
    }
    $stmt = $pdo->prepare('SELECT id, email FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => strtolower($email)]);
    return $stmt->fetch() ?: null;
}

function sanitize_sinapsis_photo_path(?string $path): ?string
{
    $path = trim((string)$path);
    if ($path === '') {
        return null;
    }
    if (!preg_match('#^assets/img/sinapsis/[A-Za-z0-9_./-]+\\.(jpg|jpeg|png|webp)$#i', $path)) {
        return null;
    }
    return $path;
}

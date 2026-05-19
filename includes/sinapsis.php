<?php
declare(strict_types=1);

const SINAPSIS_MONTHLY_FEE = 80000;

function sinapsis_money(int $amount): string
{
    return '$' . number_format($amount, 0, ',', '.') . ' COP';
}

function sinapsis_slug(string $text): string
{
    $slug = strtolower(trim($text));
    $slug = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $slug) ?: $slug;
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    return trim((string)$slug, '-') ?: 'reto-' . bin2hex(random_bytes(3));
}

function sinapsis_badge(string $status): string
{
    $map = [
        'active' => 'Activo',
        'inactive' => 'Inactivo',
        'paused' => 'Pausado',
        'graduated' => 'Graduado',
        'assigned' => 'Asignado',
        'in_progress' => 'En progreso',
        'submitted' => 'Enviado',
        'validated' => 'Validado',
        'returned' => 'Devuelto',
        'pending' => 'Pendiente',
        'paid' => 'Pagado',
        'overdue' => 'Vencido',
        'partial' => 'Parcial',
        'scholarship' => 'Becado',
        'cancelled' => 'Cancelado',
    ];
    return $map[$status] ?? ucfirst(str_replace('_', ' ', $status));
}

function sinapsis_schema_ready(PDO $pdo): bool
{
    foreach (['sinapsis_students', 'sinapsis_guardian_students', 'sinapsis_challenges', 'sinapsis_student_challenges', 'sinapsis_payment_receipts'] as $table) {
        if (!table_exists($pdo, $table)) {
            return false;
        }
    }
    return true;
}

function sinapsis_groups(PDO $pdo): array
{
    if (!table_exists($pdo, 'sinapsis_groups')) {
        return [];
    }
    return $pdo->query("SELECT id, name, category, schedule_label, monthly_fee_cop FROM sinapsis_groups WHERE status = 'active' ORDER BY id")->fetchAll();
}

function sinapsis_students_for_guardian(PDO $pdo, int $guardianUserId): array
{
    if (!table_exists($pdo, 'sinapsis_guardian_students')) {
        return [];
    }
    $stmt = $pdo->prepare(
        'SELECT s.*, g.name AS group_name, g.schedule_label AS group_schedule, gs.relationship
         FROM sinapsis_guardian_students gs
         INNER JOIN sinapsis_students s ON s.id = gs.student_id
         LEFT JOIN sinapsis_groups g ON g.id = s.group_id
         WHERE gs.guardian_user_id = :guardian_user_id AND gs.status = "active"
         ORDER BY s.full_name'
    );
    $stmt->execute(['guardian_user_id' => $guardianUserId]);
    return $stmt->fetchAll();
}

function sinapsis_student_for_user(PDO $pdo, int $userId): ?array
{
    if (!table_exists($pdo, 'sinapsis_students')) {
        return null;
    }
    $stmt = $pdo->prepare(
        'SELECT s.*, g.name AS group_name, g.schedule_label AS group_schedule
         FROM sinapsis_students s
         LEFT JOIN sinapsis_groups g ON g.id = s.group_id
         WHERE s.user_id = :user_id
         LIMIT 1'
    );
    $stmt->execute(['user_id' => $userId]);
    return $stmt->fetch() ?: null;
}

function sinapsis_all_students(PDO $pdo): array
{
    if (!table_exists($pdo, 'sinapsis_students')) {
        return [];
    }
    $stmt = $pdo->query(
        'SELECT s.*, g.name AS group_name, g.schedule_label AS group_schedule,
                u.id AS guardian_user_id, u.full_name AS guardian_name, u.email AS guardian_email
         FROM sinapsis_students s
         LEFT JOIN sinapsis_groups g ON g.id = s.group_id
         LEFT JOIN sinapsis_guardian_students gs ON gs.student_id = s.id AND gs.is_primary = 1
         LEFT JOIN users u ON u.id = gs.guardian_user_id
         ORDER BY s.created_at DESC, s.id DESC'
    );
    return $stmt->fetchAll();
}

function sinapsis_all_guardians(PDO $pdo): array
{
    $stmt = $pdo->query(
        "SELECT u.id, u.full_name, u.email, u.phone_e164, u.status,
                GROUP_CONCAT(s.full_name ORDER BY s.full_name SEPARATOR ', ') AS students
         FROM users u
         LEFT JOIN sinapsis_guardian_students gs ON gs.guardian_user_id = u.id
         LEFT JOIN sinapsis_students s ON s.id = gs.student_id
         WHERE u.role = 'guardian'
         GROUP BY u.id, u.full_name, u.email, u.phone_e164, u.status
         ORDER BY u.created_at DESC, u.id DESC"
    );
    return $stmt->fetchAll();
}

function sinapsis_challenges(PDO $pdo, bool $activeOnly = false): array
{
    if (!table_exists($pdo, 'sinapsis_challenges')) {
        return [];
    }
    $where = $activeOnly ? "WHERE status = 'active'" : '';
    return $pdo->query("SELECT * FROM sinapsis_challenges {$where} ORDER BY created_at DESC, id DESC")->fetchAll();
}

function sinapsis_challenges_for_student(PDO $pdo, int $studentId): array
{
    if (!table_exists($pdo, 'sinapsis_student_challenges')) {
        return [];
    }
    $stmt = $pdo->prepare(
        'SELECT sc.*, c.title, c.description, c.instructions, c.category, c.skill_area, c.difficulty, c.estimated_time
         FROM sinapsis_student_challenges sc
         INNER JOIN sinapsis_challenges c ON c.id = sc.challenge_id
         WHERE sc.student_id = :student_id AND sc.status <> "cancelled"
         ORDER BY sc.assigned_at DESC, sc.id DESC'
    );
    $stmt->execute(['student_id' => $studentId]);
    return $stmt->fetchAll();
}

function sinapsis_progress_for_student(PDO $pdo, int $studentId, ?int $guardianUserId = null): array
{
    if (!table_exists($pdo, 'sinapsis_progress')) {
        return [];
    }
    $sql = 'SELECT p.*
            FROM sinapsis_progress p
            INNER JOIN sinapsis_students s ON s.id = p.student_id';
    $params = ['student_id' => $studentId];
    if ($guardianUserId !== null && !is_superadmin()) {
        $sql .= ' INNER JOIN sinapsis_guardian_students gs ON gs.student_id = s.id AND gs.guardian_user_id = :guardian_user_id AND gs.status = "active"';
        $params['guardian_user_id'] = $guardianUserId;
    }
    $sql .= ' WHERE p.student_id = :student_id AND p.visible_to_family = 1 ORDER BY p.progress_date DESC, p.id DESC LIMIT 12';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function sinapsis_recent_progress(PDO $pdo): array
{
    if (!table_exists($pdo, 'sinapsis_progress')) {
        return [];
    }
    $stmt = $pdo->query(
        'SELECT p.*, s.full_name AS student_name
         FROM sinapsis_progress p
         INNER JOIN sinapsis_students s ON s.id = p.student_id
         ORDER BY p.progress_date DESC, p.id DESC
         LIMIT 15'
    );
    return $stmt->fetchAll();
}

function sinapsis_receipts_for_guardian(PDO $pdo, int $guardianUserId): array
{
    if (!table_exists($pdo, 'sinapsis_payment_receipts')) {
        return [];
    }
    $stmt = $pdo->prepare(
        'SELECT r.*, s.full_name AS student_name
         FROM sinapsis_payment_receipts r
         INNER JOIN sinapsis_students s ON s.id = r.student_id
         WHERE r.guardian_user_id = :guardian_user_id
         ORDER BY r.year DESC, r.month DESC, r.due_date DESC'
    );
    $stmt->execute(['guardian_user_id' => $guardianUserId]);
    return $stmt->fetchAll();
}

function sinapsis_receipts(PDO $pdo): array
{
    if (!table_exists($pdo, 'sinapsis_payment_receipts')) {
        return [];
    }
    $stmt = $pdo->query(
        'SELECT r.*, s.full_name AS student_name, u.full_name AS guardian_name
         FROM sinapsis_payment_receipts r
         INNER JOIN sinapsis_students s ON s.id = r.student_id
         INNER JOIN users u ON u.id = r.guardian_user_id
         ORDER BY r.year DESC, r.month DESC, r.id DESC
         LIMIT 80'
    );
    return $stmt->fetchAll();
}

function sinapsis_next_receipt(PDO $pdo, int $studentId, int $guardianUserId): ?array
{
    if (!table_exists($pdo, 'sinapsis_payment_receipts')) {
        return null;
    }
    $stmt = $pdo->prepare(
        "SELECT * FROM sinapsis_payment_receipts
         WHERE student_id = :student_id AND guardian_user_id = :guardian_user_id AND status IN ('pending','partial','overdue')
         ORDER BY due_date ASC LIMIT 1"
    );
    $stmt->execute(['student_id' => $studentId, 'guardian_user_id' => $guardianUserId]);
    return $stmt->fetch() ?: null;
}

function sinapsis_admin_summary(PDO $pdo): array
{
    if (!sinapsis_schema_ready($pdo)) {
        return ['active_students' => 0, 'guardians' => 0, 'active_challenges' => 0, 'pending' => 0, 'submitted' => 0, 'pending_payments' => 0, 'overdue_payments' => 0, 'month_income' => 0];
    }
    return [
        'active_students' => (int)$pdo->query("SELECT COUNT(*) FROM sinapsis_students WHERE status = 'active'")->fetchColumn(),
        'guardians' => (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role = 'guardian' AND status = 'active'")->fetchColumn(),
        'active_challenges' => (int)$pdo->query("SELECT COUNT(*) FROM sinapsis_challenges WHERE status = 'active'")->fetchColumn(),
        'pending' => (int)$pdo->query("SELECT COUNT(*) FROM sinapsis_student_challenges WHERE status IN ('assigned','in_progress')")->fetchColumn(),
        'submitted' => (int)$pdo->query("SELECT COUNT(*) FROM sinapsis_student_challenges WHERE status = 'submitted'")->fetchColumn(),
        'pending_payments' => (int)$pdo->query("SELECT COUNT(*) FROM sinapsis_payment_receipts WHERE status IN ('pending','partial')")->fetchColumn(),
        'overdue_payments' => (int)$pdo->query("SELECT COUNT(*) FROM sinapsis_payment_receipts WHERE status = 'overdue' OR (status IN ('pending','partial') AND due_date < CURDATE())")->fetchColumn(),
        'month_income' => (int)$pdo->query("SELECT COALESCE(SUM(amount_cop),0) FROM sinapsis_payment_receipts WHERE status = 'paid' AND YEAR(COALESCE(paid_at, created_at)) = YEAR(CURDATE()) AND MONTH(COALESCE(paid_at, created_at)) = MONTH(CURDATE())")->fetchColumn(),
    ];
}

function sinapsis_find_guardian(PDO $pdo, string $email, ?string $phone): ?array
{
    $email = strtolower(trim($email));
    $phone = $phone ? normalize_phone($phone) : null;
    if ($email === '' && !$phone) {
        return null;
    }
    $stmt = $pdo->prepare('SELECT * FROM users WHERE (:email <> "" AND email = :email) OR (:phone IS NOT NULL AND phone_e164 = :phone) LIMIT 1');
    $stmt->execute(['email' => $email, 'phone' => $phone]);
    return $stmt->fetch() ?: null;
}

function sinapsis_create_guardian_and_student(PDO $pdo, array $data): array
{
    if (!sinapsis_schema_ready($pdo)) {
        throw new RuntimeException('Falta ejecutar database/sinapsis_family_schema.sql.');
    }

    $guardianName = clean_text($data['guardian_name'] ?? '');
    $guardianEmail = strtolower(clean_text($data['guardian_email'] ?? ''));
    $guardianPhone = normalize_phone($data['guardian_phone'] ?? '');
    $studentName = clean_text($data['student_name'] ?? '');
    if ($guardianName === '' || $studentName === '') {
        throw new RuntimeException('El nombre del acudiente y del estudiante son obligatorios.');
    }
    if ($guardianEmail === '' && !$guardianPhone) {
        throw new RuntimeException('El acudiente debe tener correo o celular.');
    }

    $temporaryPasswords = [];
    $pdo->beginTransaction();
    try {
        $guardian = sinapsis_find_guardian($pdo, $guardianEmail, $guardianPhone);
        if ($guardian) {
            $guardianId = (int)$guardian['id'];
            if (in_array((string)$guardian['role'], ['teacher', 'institution'], true)) {
                $pdo->prepare("UPDATE users SET role = 'guardian', updated_at = NOW() WHERE id = :id")->execute(['id' => $guardianId]);
            }
        } else {
            $plain = clean_text($data['guardian_temp_password'] ?? '') ?: bin2hex(random_bytes(4));
            $guardianId = create_user([
                'full_name' => $guardianName,
                'email' => $guardianEmail ?: null,
                'phone_e164' => $guardianPhone,
                'password_hash' => password_hash($plain, PASSWORD_DEFAULT),
                'role' => 'guardian',
                'status' => clean_text($data['guardian_status'] ?? 'active') ?: 'active',
            ]);
            $temporaryPasswords[] = 'Acudiente: ' . $plain;
        }

        $studentUserId = null;
        if (!empty($data['create_student_user'])) {
            $plain = bin2hex(random_bytes(4));
            $studentEmail = strtolower(clean_text($data['student_email'] ?? ''));
            $studentUserId = create_user([
                'full_name' => $studentName,
                'email' => $studentEmail ?: null,
                'phone_e164' => null,
                'password_hash' => password_hash($plain, PASSWORD_DEFAULT),
                'role' => 'student',
                'status' => 'active',
            ]);
            $temporaryPasswords[] = 'Estudiante: ' . $plain;
        }

        $groupId = (int)($data['group_id'] ?? 0) ?: null;
        $monthlyFee = SINAPSIS_MONTHLY_FEE;
        if ($groupId) {
            $feeStmt = $pdo->prepare('SELECT monthly_fee_cop FROM sinapsis_groups WHERE id = :id LIMIT 1');
            $feeStmt->execute(['id' => $groupId]);
            $monthlyFee = (int)($feeStmt->fetchColumn() ?: SINAPSIS_MONTHLY_FEE);
        }
        $category = clean_text($data['category'] ?? 'kids');
        $route = clean_text($data['route_current'] ?? '');
        $stmt = $pdo->prepare(
            'INSERT INTO sinapsis_students (user_id, full_name, birth_date, document_number, age_group, category, visible_category, current_path, route_current, group_id, schedule_label, status, created_at)
             VALUES (:user_id, :full_name, :birth_date, :document_number, :age_group, :category, :visible_category, :current_path, :route_current, :group_id, :schedule_label, :status, NOW())'
        );
        $stmt->execute([
            'user_id' => $studentUserId,
            'full_name' => $studentName,
            'birth_date' => clean_text($data['birth_date'] ?? '') ?: null,
            'document_number' => clean_text($data['document_number'] ?? '') ?: null,
            'age_group' => $category === 'teens' ? 'teens' : 'kids',
            'category' => in_array($category, ['kids', 'teens', 'lhlc'], true) ? $category : 'kids',
            'visible_category' => clean_text($data['visible_category'] ?? '') ?: ucfirst($category),
            'current_path' => $route,
            'route_current' => $route,
            'group_id' => $groupId,
            'schedule_label' => clean_text($data['schedule_label'] ?? ''),
            'status' => clean_text($data['student_status'] ?? 'active') ?: 'active',
        ]);
        $studentId = (int)$pdo->lastInsertId();

        $pdo->prepare(
            'INSERT INTO sinapsis_guardian_students (guardian_user_id, student_id, relationship, is_primary, status, created_at)
             VALUES (:guardian_user_id, :student_id, :relationship, 1, "active", NOW())
             ON DUPLICATE KEY UPDATE relationship = VALUES(relationship), status = "active"'
        )->execute([
            'guardian_user_id' => $guardianId,
            'student_id' => $studentId,
            'relationship' => clean_text($data['relationship'] ?? 'Acudiente') ?: 'Acudiente',
        ]);

        $pdo->prepare(
            'INSERT INTO sinapsis_enrollments (student_id, group_id, category, route_current, start_date, monthly_fee_cop, status, created_at)
             VALUES (:student_id, :group_id, :category, :route_current, CURDATE(), :monthly_fee, "active", NOW())'
        )->execute([
            'student_id' => $studentId,
            'group_id' => $groupId,
            'category' => in_array($category, ['kids', 'teens', 'lhlc'], true) ? $category : 'kids',
            'route_current' => $route,
            'monthly_fee' => $monthlyFee,
        ]);

        if (!empty($data['create_current_receipt'])) {
            sinapsis_create_receipt($pdo, $studentId, $guardianId, (int)date('Y'), (int)date('n'), (string)date('Y-m-10'), $monthlyFee);
        }

        $pdo->commit();
        return ['student_id' => $studentId, 'guardian_id' => $guardianId, 'temporary_passwords' => $temporaryPasswords];
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function sinapsis_create_receipt(PDO $pdo, int $studentId, int $guardianId, int $year, int $month, string $dueDate, int $amount = SINAPSIS_MONTHLY_FEE): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO sinapsis_payment_receipts (student_id, guardian_user_id, year, month, concept, amount_cop, due_date, status, created_by, created_at)
         VALUES (:student_id, :guardian_user_id, :year, :month, "Mensualidad TecnoClan Sinapsis", :amount, :due_date, "pending", :created_by, NOW())
         ON DUPLICATE KEY UPDATE amount_cop = VALUES(amount_cop), due_date = VALUES(due_date), status = IF(status = "paid", status, VALUES(status))'
    );
    $stmt->execute([
        'student_id' => $studentId,
        'guardian_user_id' => $guardianId,
        'year' => $year,
        'month' => $month,
        'amount' => $amount,
        'due_date' => $dueDate,
        'created_by' => user_id(),
    ]);
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

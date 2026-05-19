-- Migracion TecnoClan Sinapsis familiar.
-- Ejecutar manualmente en MySQL/MariaDB. No contiene credenciales y no elimina datos.

ALTER TABLE users
  MODIFY COLUMN role ENUM('superadmin','admin','teacher','institution','guardian','student') NOT NULL DEFAULT 'teacher';

-- Superusuario principal solicitado por el propietario del sitio.
-- No modifica contrasena ni datos sensibles.
UPDATE users SET role = 'superadmin', updated_at = NOW() WHERE email = 'anfaliz@gmail.com';

CREATE TABLE IF NOT EXISTS sinapsis_groups (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category ENUM('kids','teens','lhlc','general') NOT NULL DEFAULT 'general',
  schedule_label VARCHAR(160) NOT NULL,
  capacity INT UNSIGNED NULL,
  monthly_fee_cop INT UNSIGNED NOT NULL DEFAULT 80000,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_sinapsis_groups_category (category),
  KEY idx_sinapsis_groups_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE sinapsis_groups ADD COLUMN IF NOT EXISTS monthly_fee_cop INT UNSIGNED NOT NULL DEFAULT 80000 AFTER capacity;
ALTER TABLE sinapsis_groups ADD COLUMN IF NOT EXISTS status ENUM('active','inactive') NOT NULL DEFAULT 'active' AFTER monthly_fee_cop;
ALTER TABLE sinapsis_groups ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

INSERT INTO sinapsis_groups (id, name, category, schedule_label, capacity, monthly_fee_cop, status) VALUES
(1, 'TecnoClan Kids - Scratch, LEGO y Storytelling', 'kids', 'Lunes 3:30 p. m. a 4:30 p. m.', 12, 80000, 'active'),
(2, 'TecnoClan Teens - Scratch y Videojuegos', 'teens', 'Lunes 4:40 p. m. a 5:40 p. m.', 12, 80000, 'active'),
(3, 'TecnoClan Kids - Scratch, LEGO y Storytelling', 'kids', 'Martes 3:30 p. m. a 4:30 p. m.', 12, 80000, 'active'),
(4, 'TecnoClan Teens - Scratch y Videojuegos', 'teens', 'Martes 4:40 p. m. a 5:40 p. m.', 12, 80000, 'active'),
(5, 'Ruta Lighthouse LC - Micro:bit y MakeCode', 'lhlc', 'Miercoles 4:00 p. m. a 5:00 p. m.', 12, 80000, 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  schedule_label = VALUES(schedule_label),
  monthly_fee_cop = VALUES(monthly_fee_cop),
  status = VALUES(status),
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS sinapsis_students (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  parent_user_id INT NULL,
  full_name VARCHAR(160) NOT NULL,
  birth_date DATE NULL,
  document_number VARCHAR(60) NULL,
  age_group ENUM('kids','teens') NOT NULL DEFAULT 'kids',
  category ENUM('kids','teens','lhlc') NOT NULL DEFAULT 'kids',
  visible_category VARCHAR(120) NULL,
  current_path VARCHAR(180) NULL,
  route_current VARCHAR(180) NULL,
  group_id INT UNSIGNED NULL,
  schedule_label VARCHAR(160) NULL,
  status ENUM('active','inactive','paused','graduated') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_sinapsis_students_user (user_id),
  KEY idx_sinapsis_students_parent (parent_user_id),
  KEY idx_sinapsis_students_group (group_id),
  KEY idx_sinapsis_students_status (status),
  CONSTRAINT fk_sinapsis_students_group FOREIGN KEY (group_id) REFERENCES sinapsis_groups(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE sinapsis_students ADD COLUMN IF NOT EXISTS user_id INT NULL AFTER id;
ALTER TABLE sinapsis_students ADD COLUMN IF NOT EXISTS document_number VARCHAR(60) NULL AFTER birth_date;
ALTER TABLE sinapsis_students ADD COLUMN IF NOT EXISTS category ENUM('kids','teens','lhlc') NOT NULL DEFAULT 'kids' AFTER age_group;
ALTER TABLE sinapsis_students ADD COLUMN IF NOT EXISTS route_current VARCHAR(180) NULL AFTER current_path;
ALTER TABLE sinapsis_students ADD COLUMN IF NOT EXISTS group_id INT UNSIGNED NULL AFTER route_current;

CREATE TABLE IF NOT EXISTS sinapsis_guardian_students (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  guardian_user_id INT NOT NULL,
  student_id INT UNSIGNED NOT NULL,
  relationship ENUM('Madre','Padre','Acudiente','Familiar','Otro') NOT NULL DEFAULT 'Acudiente',
  is_primary TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_guardian_student (guardian_user_id, student_id),
  KEY idx_sgs_guardian (guardian_user_id),
  KEY idx_sgs_student (student_id),
  CONSTRAINT fk_sgs_student FOREIGN KEY (student_id) REFERENCES sinapsis_students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sinapsis_enrollments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  group_id INT UNSIGNED NULL,
  category ENUM('kids','teens','lhlc') NOT NULL DEFAULT 'kids',
  route_current VARCHAR(180) NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  monthly_fee_cop INT UNSIGNED NOT NULL DEFAULT 80000,
  status ENUM('active','inactive','paused','graduated') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_enrollments_student (student_id),
  KEY idx_enrollments_group (group_id),
  KEY idx_enrollments_status (status),
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES sinapsis_students(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_group FOREIGN KEY (group_id) REFERENCES sinapsis_groups(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sinapsis_challenges (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  description TEXT NULL,
  instructions TEXT NULL,
  category ENUM('kids','teens','lhlc','general') NOT NULL DEFAULT 'general',
  skill_area ENUM('scratch','lego','storytelling','videogames','microbit','makecode','soft_skills','logic','other') NOT NULL DEFAULT 'other',
  difficulty ENUM('basic','intermediate','advanced') NOT NULL DEFAULT 'basic',
  estimated_time VARCHAR(80) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sinapsis_challenges_slug (slug),
  KEY idx_challenges_category_status (category, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO sinapsis_challenges (slug, title, description, instructions, category, skill_area, difficulty, estimated_time, status) VALUES
('mi-primer-personaje-en-scratch', 'Mi primer personaje en Scratch', 'Crea un personaje y dale movimiento con bloques.', 'Elige un personaje, agrega un fondo y programa al menos dos movimientos.', 'kids', 'scratch', 'basic', '45 minutos', 'active'),
('cuenta-una-historia-con-lego', 'Cuenta una historia con LEGO', 'Construye una escena y narra lo que ocurre.', 'Crea una escena con inicio, problema y solucion. Luego explica tu historia.', 'kids', 'lego', 'basic', '45 minutos', 'active'),
('crea-una-escena-interactiva', 'Crea una escena interactiva', 'Disena una escena que responda a clics o teclas.', 'Programa al menos dos eventos de interaccion.', 'general', 'storytelling', 'intermediate', '60 minutos', 'active'),
('disena-las-reglas-de-tu-videojuego', 'Disena las reglas de tu videojuego', 'Define objetivo, controles, puntos y condiciones de victoria.', 'Escribe las reglas y crea una primera version jugable.', 'teens', 'videogames', 'intermediate', '60 minutos', 'active'),
('controla-una-animacion-con-microbit', 'Controla una animacion con micro:bit', 'Usa botones o sensores para controlar una animacion.', 'Crea un programa en MakeCode que reaccione a una entrada.', 'lhlc', 'microbit', 'intermediate', '60 minutos', 'active'),
('muestra-un-mensaje-en-makecode', 'Muestra un mensaje en MakeCode', 'Programa un mensaje usando la matriz LED.', 'Muestra tu nombre o una idea corta en micro:bit.', 'lhlc', 'makecode', 'basic', '30 minutos', 'active');

CREATE TABLE IF NOT EXISTS sinapsis_student_challenges (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  challenge_id INT UNSIGNED NOT NULL,
  assigned_by INT NULL,
  status ENUM('assigned','in_progress','submitted','validated','returned','cancelled') NOT NULL DEFAULT 'assigned',
  student_note TEXT NULL,
  guardian_note TEXT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  validated_at DATETIME NULL,
  validated_by INT NULL,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_challenge (student_id, challenge_id),
  KEY idx_student_challenges_student_status (student_id, status),
  KEY idx_student_challenges_challenge (challenge_id),
  CONSTRAINT fk_student_challenges_student FOREIGN KEY (student_id) REFERENCES sinapsis_students(id) ON DELETE CASCADE,
  CONSTRAINT fk_student_challenges_challenge FOREIGN KEY (challenge_id) REFERENCES sinapsis_challenges(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sinapsis_progress (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  skill_area ENUM('scratch','lego','storytelling','videogames','microbit','makecode','soft_skills','logic','other') NOT NULL DEFAULT 'other',
  level ENUM('inicio','en_proceso','logrado','destacado') NOT NULL DEFAULT 'inicio',
  progress_date DATE NOT NULL,
  photo_path VARCHAR(255) NULL,
  visible_to_family TINYINT(1) NOT NULL DEFAULT 1,
  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_progress_student_date (student_id, progress_date),
  CONSTRAINT fk_progress_student FOREIGN KEY (student_id) REFERENCES sinapsis_students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE sinapsis_progress ADD COLUMN IF NOT EXISTS visible_to_family TINYINT(1) NOT NULL DEFAULT 1 AFTER photo_path;

CREATE TABLE IF NOT EXISTS sinapsis_payment_receipts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  guardian_user_id INT NOT NULL,
  year SMALLINT UNSIGNED NOT NULL,
  month TINYINT UNSIGNED NOT NULL,
  concept VARCHAR(180) NOT NULL DEFAULT 'Mensualidad TecnoClan Sinapsis',
  amount_cop INT UNSIGNED NOT NULL DEFAULT 80000,
  due_date DATE NOT NULL,
  status ENUM('pending','paid','overdue','partial','scholarship','cancelled') NOT NULL DEFAULT 'pending',
  payment_method ENUM('cash','transfer','mercado_pago','other') NULL,
  paid_at DATETIME NULL,
  reference VARCHAR(120) NULL,
  receipt_path VARCHAR(255) NULL,
  proof_path VARCHAR(255) NULL,
  internal_notes TEXT NULL,
  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_receipt_student_period (student_id, year, month),
  KEY idx_receipts_guardian (guardian_user_id),
  KEY idx_receipts_status_due (status, due_date),
  CONSTRAINT fk_receipts_student FOREIGN KEY (student_id) REFERENCES sinapsis_students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

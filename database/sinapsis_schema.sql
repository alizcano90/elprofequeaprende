-- Migracion TecnoClan Sinapsis. Ejecutar manualmente. No contiene DROP TABLE.

CREATE TABLE IF NOT EXISTS sinapsis_students (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_user_id INT UNSIGNED NULL,
  full_name VARCHAR(160) NOT NULL,
  birth_date DATE NULL,
  age_group ENUM('kids', 'teens') NOT NULL DEFAULT 'kids',
  visible_category VARCHAR(120) NOT NULL,
  current_path VARCHAR(190) NOT NULL,
  schedule_label VARCHAR(120) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_sinapsis_students_parent (parent_user_id),
  KEY idx_sinapsis_students_status (status),
  CONSTRAINT fk_sinapsis_students_parent FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sinapsis_progress (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  title VARCHAR(190) NOT NULL,
  description TEXT NULL,
  skill_area ENUM('scratch', 'lego', 'storytelling', 'videogames', 'microbit', 'makecode', 'soft_skills', 'other') NOT NULL DEFAULT 'other',
  level ENUM('inicio', 'en_proceso', 'logrado', 'destacado') NOT NULL DEFAULT 'inicio',
  progress_date DATE NOT NULL,
  photo_path VARCHAR(255) NULL,
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_sinapsis_progress_student (student_id),
  KEY idx_sinapsis_progress_date (progress_date),
  CONSTRAINT fk_sinapsis_progress_student FOREIGN KEY (student_id) REFERENCES sinapsis_students(id) ON DELETE CASCADE,
  CONSTRAINT fk_sinapsis_progress_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

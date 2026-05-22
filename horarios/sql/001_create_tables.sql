CREATE TABLE IF NOT EXISTS institutions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  timezone VARCHAR(80) NOT NULL DEFAULT 'America/Bogota',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sites (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institution_id INT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(140) NOT NULL,
  site_type VARCHAR(40) NOT NULL DEFAULT 'principal',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sites_code (institution_id, code),
  CONSTRAINT fk_sites_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS periods (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institution_id INT UNSIGNED NOT NULL,
  level VARCHAR(30) NOT NULL,
  period_number TINYINT UNSIGNED NOT NULL,
  label VARCHAR(20) NOT NULL,
  starts_at TIME NULL,
  ends_at TIME NULL,
  UNIQUE KEY uq_period_level_number (institution_id, level, period_number),
  CONSTRAINT fk_periods_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS groups (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institution_id INT UNSIGNED NOT NULL,
  site_id INT UNSIGNED NOT NULL,
  code VARCHAR(30) NOT NULL,
  level VARCHAR(30) NOT NULL,
  weekly_hours SMALLINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_groups_code (institution_id, code),
  CONSTRAINT fk_groups_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  CONSTRAINT fk_groups_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teachers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institution_id INT UNSIGNED NOT NULL,
  code VARCHAR(60) NOT NULL,
  name VARCHAR(160) NOT NULL,
  min_secondary_hours SMALLINT UNSIGNED NOT NULL DEFAULT 22,
  min_hours_exception TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_teachers_code (institution_id, code),
  CONSTRAINT fk_teachers_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subjects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institution_id INT UNSIGNED NOT NULL,
  code VARCHAR(60) NOT NULL,
  name VARCHAR(160) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#dbeafe',
  requires_room_type VARCHAR(40) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_subjects_code (institution_id, code),
  CONSTRAINT fk_subjects_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rooms (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institution_id INT UNSIGNED NOT NULL,
  site_id INT UNSIGNED NOT NULL,
  code VARCHAR(60) NOT NULL,
  name VARCHAR(160) NOT NULL,
  room_type VARCHAR(40) NOT NULL DEFAULT 'aula',
  capacity SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rooms_code (institution_id, code),
  CONSTRAINT fk_rooms_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  CONSTRAINT fk_rooms_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teacher_loads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institution_id INT UNSIGNED NOT NULL,
  external_id VARCHAR(80) NOT NULL,
  site_id INT UNSIGNED NOT NULL,
  group_id INT UNSIGNED NOT NULL,
  teacher_id INT UNSIGNED NOT NULL,
  subject_id INT UNSIGNED NOT NULL,
  preferred_room_id INT UNSIGNED NULL,
  weekly_hours SMALLINT UNSIGNED NOT NULL,
  source VARCHAR(80) NOT NULL DEFAULT 'seed',
  locked_assignment TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_teacher_load_external (institution_id, external_id),
  CONSTRAINT fk_loads_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  CONSTRAINT fk_loads_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE RESTRICT,
  CONSTRAINT fk_loads_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE RESTRICT,
  CONSTRAINT fk_loads_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_loads_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  CONSTRAINT fk_loads_room FOREIGN KEY (preferred_room_id) REFERENCES rooms(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS constraints (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institution_id INT UNSIGNED NOT NULL,
  code VARCHAR(80) NOT NULL,
  priority ENUM('P0','P1','P2') NOT NULL,
  name VARCHAR(180) NOT NULL,
  rule_type VARCHAR(80) NOT NULL,
  payload JSON NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_constraints_code (institution_id, code),
  CONSTRAINT fk_constraints_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schedules (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institution_id INT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  status ENUM('DRAFT','AUDITED','FINAL') NOT NULL DEFAULT 'DRAFT',
  score DECIMAL(6,2) NOT NULL DEFAULT 0,
  p0_count INT UNSIGNED NOT NULL DEFAULT 0,
  p1_count INT UNSIGNED NOT NULL DEFAULT 0,
  p2_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_schedules_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schedule_slots (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT UNSIGNED NOT NULL,
  teacher_load_id INT UNSIGNED NOT NULL,
  day_name VARCHAR(20) NOT NULL,
  period_number TINYINT UNSIGNED NOT NULL,
  room_id INT UNSIGNED NULL,
  site_id INT UNSIGNED NOT NULL,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  source VARCHAR(80) NOT NULL DEFAULT 'optimizer',
  justification TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_slot_load_period (schedule_id, teacher_load_id, day_name, period_number),
  KEY idx_slot_time (schedule_id, day_name, period_number),
  CONSTRAINT fk_slots_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
  CONSTRAINT fk_slots_load FOREIGN KEY (teacher_load_id) REFERENCES teacher_loads(id) ON DELETE RESTRICT,
  CONSTRAINT fk_slots_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  CONSTRAINT fk_slots_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_results (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT UNSIGNED NOT NULL,
  constraint_code VARCHAR(80) NOT NULL,
  priority ENUM('P0','P1','P2') NOT NULL,
  status ENUM('CUMPLE','NO CUMPLE','JUSTIFICADO') NOT NULL,
  explanation TEXT NOT NULL,
  suggestion TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS versions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT UNSIGNED NOT NULL,
  version_number INT UNSIGNED NOT NULL,
  status ENUM('DRAFT','FINAL') NOT NULL DEFAULT 'DRAFT',
  summary VARCHAR(220) NOT NULL,
  p0_count INT UNSIGNED NOT NULL DEFAULT 0,
  p1_count INT UNSIGNED NOT NULL DEFAULT 0,
  p2_count INT UNSIGNED NOT NULL DEFAULT 0,
  snapshot_json JSON NOT NULL,
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_versions_number (schedule_id, version_number),
  CONSTRAINT fk_versions_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institution_id INT UNSIGNED NULL,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','editor','visor') NOT NULL DEFAULT 'visor',
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_epqa_users_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

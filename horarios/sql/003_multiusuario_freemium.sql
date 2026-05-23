-- ============================================================
-- EPQA HORARIOS INTELIGENTES
-- Migracion multiusuario, propiedad de horarios, freemium,
-- import/export, auditoria, simulaciones y bitacora.
-- ============================================================

CREATE TABLE IF NOT EXISTS horario_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(180) NOT NULL,
  institution_name VARCHAR(180) NULL,
  description TEXT NULL,
  status ENUM('draft','auditing','publishable','finalized','archived') DEFAULT 'draft',
  plan_scope ENUM('free','pro','institutional') DEFAULT 'free',
  active_version_id INT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_horario_schedules_user_id (user_id),
  INDEX idx_horario_schedules_status (status),
  INDEX idx_horario_schedules_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS horario_schedule_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  user_id INT NOT NULL,
  version_number INT NOT NULL DEFAULT 1,
  name VARCHAR(180) NULL,
  snapshot JSON NOT NULL,
  audit_summary JSON NULL,
  created_by_action VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_horario_versions_schedule_id (schedule_id),
  INDEX idx_horario_versions_user_id (user_id),
  UNIQUE KEY uq_schedule_version (schedule_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS horario_import_exports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NULL,
  user_id INT NOT NULL,
  type ENUM('import','export') NOT NULL,
  format ENUM('json','xlsx','pdf','zip') DEFAULT 'json',
  file_name VARCHAR(255) NULL,
  payload JSON NULL,
  summary JSON NULL,
  status ENUM('success','error') DEFAULT 'success',
  message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_horario_import_exports_schedule (schedule_id),
  INDEX idx_horario_import_exports_user (user_id),
  INDEX idx_horario_import_exports_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS horario_audit_pendings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  user_id INT NOT NULL,
  priority ENUM('P0','P1','P2') NOT NULL,
  type VARCHAR(100) NOT NULL,
  status ENUM('pending','reviewing','resolved','ignored','approved_exception') DEFAULT 'pending',
  teacher_id VARCHAR(80) NULL,
  group_id VARCHAR(80) NULL,
  subject_id VARCHAR(120) NULL,
  space_id VARCHAR(80) NULL,
  campus_id VARCHAR(80) NULL,
  day_index INT NULL,
  period_index INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  cause TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_horario_audit_schedule_user (schedule_id, user_id),
  INDEX idx_horario_audit_priority (priority),
  INDEX idx_horario_audit_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS horario_solution_suggestions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pending_id INT NOT NULL,
  schedule_id INT NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  risk_level ENUM('low','medium','high') DEFAULT 'medium',
  score INT DEFAULT 0,
  p0_broken INT DEFAULT 0,
  p1_broken INT DEFAULT 0,
  p2_broken INT DEFAULT 0,
  p0_resolved INT DEFAULT 0,
  p1_resolved INT DEFAULT 0,
  p2_resolved INT DEFAULT 0,
  changes JSON NOT NULL,
  simulation_result JSON NULL,
  requires_confirmation BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_horario_suggestions_pending (pending_id),
  INDEX idx_horario_suggestions_schedule_user (schedule_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS horario_simulations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  pending_id INT NULL,
  user_id INT NOT NULL,
  status ENUM('draft','applied','discarded') DEFAULT 'draft',
  base_snapshot JSON NOT NULL,
  proposed_changes JSON NOT NULL,
  result_snapshot JSON NULL,
  score_before INT NULL,
  score_after INT NULL,
  summary TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_at TIMESTAMP NULL,
  INDEX idx_horario_simulations_schedule_user (schedule_id, user_id),
  INDEX idx_horario_simulations_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS horario_decision_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  user_id INT NOT NULL,
  action_type VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NULL,
  entity_id VARCHAR(80) NULL,
  priority ENUM('P0','P1','P2') NULL,
  before_state JSON NULL,
  after_state JSON NULL,
  affected_teachers JSON NULL,
  affected_groups JSON NULL,
  affected_spaces JSON NULL,
  resolved_pending_ids JSON NULL,
  created_pending_ids JSON NULL,
  justification TEXT NULL,
  system_score_before INT NULL,
  system_score_after INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_horario_decision_schedule_user (schedule_id, user_id),
  INDEX idx_horario_decision_action (action_type),
  INDEX idx_horario_decision_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS horario_user_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_code VARCHAR(50) DEFAULT 'free',
  max_schedules INT DEFAULT 1,
  can_create_multiple BOOLEAN DEFAULT FALSE,
  can_export BOOLEAN DEFAULT TRUE,
  can_use_advanced_audit BOOLEAN DEFAULT TRUE,
  can_use_auto_resolve BOOLEAN DEFAULT FALSE,
  can_use_scenarios BOOLEAN DEFAULT FALSE,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_horario_user_limits_user (user_id),
  INDEX idx_horario_user_limits_plan (plan_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO horario_user_limits (
  user_id,
  plan_code,
  max_schedules,
  can_create_multiple,
  can_export,
  can_use_advanced_audit,
  can_use_auto_resolve,
  can_use_scenarios
)
SELECT
  u.id,
  'free',
  1,
  FALSE,
  TRUE,
  TRUE,
  FALSE,
  FALSE
FROM users u
WHERE NOT EXISTS (
  SELECT 1
  FROM horario_user_limits hul
  WHERE hul.user_id = u.id
);

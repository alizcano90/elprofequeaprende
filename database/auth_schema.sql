-- Migracion de autenticacion para El Profe Que Aprende.
-- Ejecutar manualmente en MySQL/MariaDB. No contiene DROP TABLE.
-- Revisa el resultado en staging antes de correr en produccion.

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NULL,
  phone_e164 VARCHAR(20) NULL,
  password_hash VARCHAR(255) NULL,
  role ENUM('admin', 'teacher', 'institution') NOT NULL DEFAULT 'teacher',
  status ENUM('pending', 'active', 'blocked', 'deleted') NOT NULL DEFAULT 'active',
  email_verified_at DATETIME NULL,
  phone_verified_at DATETIME NULL,
  last_login_at DATETIME NULL,
  last_login_ip VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_users_email (email),
  UNIQUE KEY idx_users_phone_e164 (phone_e164),
  KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(160) NULL AFTER id;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_e164 VARCHAR(20) NULL AFTER email;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at DATETIME NULL AFTER status;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at DATETIME NULL AFTER email_verified_at;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at DATETIME NULL AFTER phone_verified_at;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45) NULL AFTER last_login_at;
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;
ALTER TABLE users MODIFY COLUMN status ENUM('pending', 'active', 'blocked', 'deleted') NOT NULL DEFAULT 'active';
UPDATE users SET full_name = COALESCE(NULLIF(full_name, ''), 'Usuario') WHERE full_name IS NULL OR full_name = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_e164 ON users (phone_e164);

CREATE TABLE IF NOT EXISTS user_identities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  provider ENUM('google', 'microsoft') NOT NULL,
  provider_user_id VARCHAR(191) NOT NULL,
  provider_tenant_id VARCHAR(191) NULL,
  email VARCHAR(190) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_provider_user (provider, provider_user_id),
  KEY idx_user_identities_user_id (user_id),
  CONSTRAINT fk_user_identities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_type ENUM('email_verification', 'password_reset', 'phone_verification') NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_user_tokens_hash (token_hash),
  KEY idx_user_tokens_user_type (user_id, token_type),
  CONSTRAINT fk_user_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  session_id_hash CHAR(64) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_user_sessions_hash (session_id_hash),
  KEY idx_user_sessions_user_id (user_id),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  identifier VARCHAR(190) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent VARCHAR(255) NULL,
  success TINYINT(1) NOT NULL DEFAULT 0,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_login_attempts_rate (identifier, ip_address, success, attempted_at),
  KEY idx_login_attempts_user_id (user_id),
  CONSTRAINT fk_login_attempts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  event_type VARCHAR(80) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  meta_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_auth_audit_user_id (user_id),
  KEY idx_auth_audit_event_type (event_type),
  CONSTRAINT fk_auth_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

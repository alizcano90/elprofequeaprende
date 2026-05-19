-- Migracion opcional para dashboard de planes.
-- Ejecutar si quieres mostrar suscripciones reales en /?pg=dashboard.
-- No contiene DROP TABLE.

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  plan_id INT UNSIGNED NOT NULL,
  status ENUM('active', 'paused', 'cancelled', 'expired') NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user_subscriptions_user_status (user_id, status),
  KEY idx_user_subscriptions_plan (plan_id),
  CONSTRAINT fk_user_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

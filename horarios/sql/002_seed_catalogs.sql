INSERT INTO institutions (id, name, slug, timezone)
VALUES (1, 'Institucion Educativa Rural Filo de Platanares', 'ier-filo-platanares', 'America/Bogota')
ON DUPLICATE KEY UPDATE name = VALUES(name), timezone = VALUES(timezone);

INSERT INTO sites (institution_id, code, name, site_type) VALUES
(1, 'filo', 'Filo', 'principal'),
(1, 'rural', 'Sedes rurales', 'rural')
ON DUPLICATE KEY UPDATE name = VALUES(name), site_type = VALUES(site_type);

INSERT INTO periods (institution_id, level, period_number, label) VALUES
(1, 'primary', 1, 'H1'), (1, 'primary', 2, 'H2'), (1, 'primary', 3, 'H3'), (1, 'primary', 4, 'H4'), (1, 'primary', 5, 'H5'),
(1, 'secondary', 1, 'H1'), (1, 'secondary', 2, 'H2'), (1, 'secondary', 3, 'H3'), (1, 'secondary', 4, 'H4'), (1, 'secondary', 5, 'H5'), (1, 'secondary', 6, 'H6')
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO teachers (institution_id, code, name, min_secondary_hours, min_hours_exception) VALUES
(1, 'andres', 'Andres', 22, 0), (1, 'raducha', 'Raducha', 22, 0), (1, 'chavarro', 'Chavarro', 22, 0), (1, 'camilo', 'Camilo', 22, 0),
(1, 'hernan', 'Hernan', 22, 0), (1, 'karen', 'Karen', 22, 0), (1, 'jissel', 'Jissel', 22, 0), (1, 'alex', 'Alex', 22, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), min_hours_exception = VALUES(min_hours_exception);

INSERT INTO subjects (institution_id, code, name, color, requires_room_type) VALUES
(1, 'castellano', 'Castellano', '#fde2e4', NULL),
(1, 'matematicas', 'Matematicas', '#dbeafe', NULL),
(1, 'tecnologia-e-informatica', 'Tecnologia e Informatica', '#dcfce7', 'sala-ti'),
(1, 'dpc', 'DPC', '#ccfbf1', 'sala-ti'),
(1, 'emprendimiento', 'Emprendimiento', '#fef3c7', 'sala-ti'),
(1, 'educacion-fisica', 'Educacion Fisica', '#fed7aa', 'cancha'),
(1, 'fisica', 'Fisica', '#e0e7ff', NULL),
(1, 'quimica', 'Quimica', '#fbcfe8', NULL),
(1, 'biologia', 'Biologia', '#bbf7d0', NULL),
(1, 'ingles', 'Ingles', '#cffafe', NULL),
(1, 'sociales', 'Sociales', '#ddd6fe', NULL),
(1, 'artistica', 'Artistica', '#fae8ff', NULL),
(1, 'religion', 'Religion', '#f5f5f4', NULL),
(1, 'etica', 'Etica', '#e7e5e4', NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), color = VALUES(color), requires_room_type = VALUES(requires_room_type);

INSERT INTO rooms (institution_id, site_id, code, name, room_type, capacity)
SELECT 1, s.id, 'aula', 'Aula', 'aula', 99 FROM sites s WHERE s.institution_id = 1 AND s.code = 'filo'
ON DUPLICATE KEY UPDATE name = VALUES(name), room_type = VALUES(room_type), capacity = VALUES(capacity);
INSERT INTO rooms (institution_id, site_id, code, name, room_type, capacity)
SELECT 1, s.id, 'sala-ti', 'Sala TI', 'sala-ti', 1 FROM sites s WHERE s.institution_id = 1 AND s.code = 'filo'
ON DUPLICATE KEY UPDATE name = VALUES(name), room_type = VALUES(room_type), capacity = VALUES(capacity);
INSERT INTO rooms (institution_id, site_id, code, name, room_type, capacity)
SELECT 1, s.id, 'cancha', 'Cancha', 'cancha', 1 FROM sites s WHERE s.institution_id = 1 AND s.code = 'filo'
ON DUPLICATE KEY UPDATE name = VALUES(name), room_type = VALUES(room_type), capacity = VALUES(capacity);

INSERT INTO users (institution_id, full_name, email, password_hash, role, status)
VALUES (1, 'Administrador EPQA', 'admin@epqa.local', '$2y$10$e0NR8BJP1dbjQyF7k9ZCAuQsgjYbHJLtN9fYaf4lm7SxtehcxjGCW', 'admin', 'active')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role), status = VALUES(status);

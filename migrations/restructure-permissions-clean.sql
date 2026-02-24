-- Migration: Restructuration des permissions en permissions composées
-- Suppression de toutes les permissions existantes
TRUNCATE TABLE role_permissions;

-- ===== ADMIN =====
-- Admin: users (manage - toutes les permissions)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('admin', 'users', 'create', true),
('admin', 'users', 'read', true),
('admin', 'users', 'update', true),
('admin', 'users', 'delete', true);

-- Admin: vehicles (manage)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('admin', 'vehicles', 'create', true),
('admin', 'vehicles', 'read', true),
('admin', 'vehicles', 'update', true),
('admin', 'vehicles', 'delete', true);

-- Admin: bookings (manage)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('admin', 'bookings', 'create', true),
('admin', 'bookings', 'read', true),
('admin', 'bookings', 'update', true),
('admin', 'bookings', 'delete', true);

-- Admin: quotes (manage)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('admin', 'quotes', 'create', true),
('admin', 'quotes', 'read', true),
('admin', 'quotes', 'update', true),
('admin', 'quotes', 'delete', true);

-- Admin: reviews (manage)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('admin', 'reviews', 'create', true),
('admin', 'reviews', 'read', true),
('admin', 'reviews', 'update', true),
('admin', 'reviews', 'delete', true);

-- ===== MANAGER =====
-- Manager: users (manage)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('manager', 'users', 'create', true),
('manager', 'users', 'read', true),
('manager', 'users', 'update', true),
('manager', 'users', 'delete', true);

-- Manager: vehicles (manage)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('manager', 'vehicles', 'create', true),
('manager', 'vehicles', 'read', true),
('manager', 'vehicles', 'update', true),
('manager', 'vehicles', 'delete', true);

-- Manager: bookings (manage)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('manager', 'bookings', 'create', true),
('manager', 'bookings', 'read', true),
('manager', 'bookings', 'update', true),
('manager', 'bookings', 'delete', true);

-- Manager: quotes (manage)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('manager', 'quotes', 'create', true),
('manager', 'quotes', 'read', true),
('manager', 'quotes', 'update', true),
('manager', 'quotes', 'delete', true);

-- Manager: reviews (manage)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('manager', 'reviews', 'create', true),
('manager', 'reviews', 'read', true),
('manager', 'reviews', 'update', true),
('manager', 'reviews', 'delete', true);

-- ===== CUSTOMER =====
-- Customer: users (aucune permission)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('customer', 'users', 'create', false),
('customer', 'users', 'read', false),
('customer', 'users', 'update', false),
('customer', 'users', 'delete', false);

-- Customer: vehicles (aucune permission)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('customer', 'vehicles', 'create', false),
('customer', 'vehicles', 'read', false),
('customer', 'vehicles', 'update', false),
('customer', 'vehicles', 'delete', false);

-- Customer: bookings (read uniquement)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('customer', 'bookings', 'create', false),
('customer', 'bookings', 'read', true),
('customer', 'bookings', 'update', false),
('customer', 'bookings', 'delete', false);

-- Customer: quotes (read uniquement)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('customer', 'quotes', 'create', false),
('customer', 'quotes', 'read', true),
('customer', 'quotes', 'update', false),
('customer', 'quotes', 'delete', false);

-- Customer: reviews (read uniquement)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('customer', 'reviews', 'create', false),
('customer', 'reviews', 'read', true),
('customer', 'reviews', 'update', false),
('customer', 'reviews', 'delete', false);

-- ===== DRIVER =====
-- Driver: users (aucune permission)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('driver', 'users', 'create', false),
('driver', 'users', 'read', false),
('driver', 'users', 'update', false),
('driver', 'users', 'delete', false);

-- Driver: vehicles (read uniquement)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('driver', 'vehicles', 'create', false),
('driver', 'vehicles', 'read', true),
('driver', 'vehicles', 'update', false),
('driver', 'vehicles', 'delete', false);

-- Driver: bookings (read et update)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('driver', 'bookings', 'create', false),
('driver', 'bookings', 'read', true),
('driver', 'bookings', 'update', true),
('driver', 'bookings', 'delete', false);

-- Driver: quotes (aucune permission)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('driver', 'quotes', 'create', false),
('driver', 'quotes', 'read', false),
('driver', 'quotes', 'update', false),
('driver', 'quotes', 'delete', false);

-- Driver: reviews (read uniquement)
INSERT INTO role_permissions (role_name, resource, action, allowed) VALUES
('driver', 'reviews', 'create', false),
('driver', 'reviews', 'read', true),
('driver', 'reviews', 'update', false),
('driver', 'reviews', 'delete', false);

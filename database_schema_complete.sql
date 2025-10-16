
-- =====================================================
-- RESTAURACIÓN LIMPIA - SISTEMA DE GESTIÓN DE OBRAS
-- Maneja conflictos y objetos existentes
-- =====================================================

-- Eliminar objetos existentes si los hay (en orden inverso de dependencias)
DROP VIEW IF EXISTS zone_inventory CASCADE;
DROP VIEW IF EXISTS worker_stats CASCADE;
DROP VIEW IF EXISTS supervisor_dashboard CASCADE;

DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS metrics CASCADE;
DROP TABLE IF EXISTS check_ins CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS material_requests CASCADE;
DROP TABLE IF EXISTS material_zone CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS work_zones CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Eliminar funciones existentes
DROP FUNCTION IF EXISTS get_zone_stats CASCADE;
DROP FUNCTION IF EXISTS get_users_nearby CASCADE;
DROP FUNCTION IF EXISTS calculate_distance CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- =====================================================
-- 1. CREACIÓN DE TABLAS (ORDEN CORRECTO POR DEPENDENCIAS)
-- =====================================================

-- Tabla de roles (sin dependencias)
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name TEXT NOT NULL,
    permissions TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de trabajos/cargos (sin dependencias)
CREATE TABLE jobs (
    "idJob" SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios (depende de roles y jobs)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    role_id INTEGER NOT NULL,
    password TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    blood_type TEXT,
    reset_token TEXT,
    reset_token_expiry TIMESTAMP,
    job_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT users_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs("idJob") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla de zonas de trabajo (depende de users)
CREATE TABLE work_zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    supervisor_id INTEGER NOT NULL,
    latitud REAL,
    longitud REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT work_zones_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabla de materiales (sin dependencias)
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    image_url TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de asignación de materiales a zonas (depende de materials y work_zones)
CREATE TABLE material_zone (
    id SERIAL PRIMARY KEY,
    id_zona INTEGER NOT NULL,
    id_material INTEGER NOT NULL,
    cantidad_asignada INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT material_zone_id_zona_fkey FOREIGN KEY (id_zona) REFERENCES work_zones(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT material_zone_id_material_fkey FOREIGN KEY (id_material) REFERENCES materials(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT unique_zone_material UNIQUE (id_zona, id_material)
);

-- Tabla de solicitudes de materiales (depende de users y work_zones)
CREATE TABLE material_requests (
    id BIGSERIAL PRIMARY KEY,
    zone_id BIGINT NOT NULL,
    quantity_requested DOUBLE PRECISION,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    material TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT material_requests_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES work_zones(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT material_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla de tareas (depende de work_zones y users)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    work_zone_id INTEGER NOT NULL,
    assigned_to INTEGER NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    completion_date TIMESTAMP,
    evidence_url VARCHAR(255),
    priority VARCHAR(20) DEFAULT 'medium',
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT tasks_work_zone_id_fkey FOREIGN KEY (work_zone_id) REFERENCES work_zones(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabla de asistencia (depende de users)
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    check_in TIMESTAMP NOT NULL,
    check_out TIMESTAMP,
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    work_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabla de check-ins mejorada (depende de users y work_zones)
CREATE TABLE check_ins (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    zone_id INTEGER,
    check_in_time TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    photo_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    check_out_time TIMESTAMP(6),
    work_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_ins_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT check_ins_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES work_zones(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla de métricas (depende de work_zones)
CREATE TABLE metrics (
    id SERIAL PRIMARY KEY,
    work_zone_id INTEGER NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT metrics_work_zone_id_fkey FOREIGN KEY (work_zone_id) REFERENCES work_zones(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabla de mensajes privados (depende de users)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabla de mensajes de chat (depende de users y work_zones)
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    work_zone_id INTEGER,
    content TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    message_type VARCHAR(20) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chat_messages_work_zone_id_fkey FOREIGN KEY (work_zone_id) REFERENCES work_zones(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla de solicitudes legacy (mantener para compatibilidad)
CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT requests_material_id_fkey FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- =====================================================
-- 2. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices únicos (con verificación de existencia)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS materials_image_url_key ON materials(image_url);
CREATE UNIQUE INDEX IF NOT EXISTS unique_zone_material_idx ON material_zone(id_zona, id_material);

-- Índices para consultas frecuentes (con verificación de existencia)
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_job_id ON users(job_id);
CREATE INDEX IF NOT EXISTS idx_work_zones_supervisor_id ON work_zones(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_tasks_work_zone_id ON tasks(work_zone_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in ON attendance(check_in);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_zone_id ON check_ins(zone_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_status ON check_ins(status);
CREATE INDEX IF NOT EXISTS idx_check_ins_work_date ON check_ins(work_date);
CREATE INDEX IF NOT EXISTS idx_material_requests_zone_id ON material_requests(zone_id);
CREATE INDEX IF NOT EXISTS idx_material_requests_user_id ON material_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_material_requests_status ON material_requests(status);
CREATE INDEX IF NOT EXISTS idx_material_requests_created_at ON material_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_work_zone_id ON chat_messages(work_zone_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sent_at ON chat_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_metrics_work_zone_id ON metrics(work_zone_id);
CREATE INDEX IF NOT EXISTS idx_metrics_recorded_at ON metrics(recorded_at);

-- =====================================================
-- 3. DATOS INICIALES (INSERT STATEMENTS)
-- =====================================================

-- Insertar roles del sistema (evitar duplicados)
INSERT INTO roles (role_name, permissions) VALUES
('Administrador', '{"users": "all", "zones": "all", "materials": "all", "tasks": "all", "reports": "all", "settings": "all"}'),
('Supervisor', '{"zones": "manage", "materials": "approve", "tasks": "assign", "reports": "view", "users": "view"}'),
('Trabajador', '{"tasks": "view", "materials": "request", "attendance": "manage", "chat": "participate"}'),
('Empleado', '{"tasks": "view", "materials": "request", "attendance": "manage", "chat": "participate"}')
ON CONFLICT DO NOTHING;

-- Insertar trabajos/cargos comunes (evitar duplicados)
INSERT INTO jobs (name, description) VALUES
('Obrero General', 'Trabajador general de construcción'),
('Albañil', 'Especialista en construcción de muros y estructuras'),
('Carpintero', 'Especialista en trabajos de madera'),
('Electricista', 'Especialista en instalaciones eléctricas'),
('Plomero', 'Especialista en instalaciones hidráulicas'),
('Supervisor de Obra', 'Supervisor de zona de trabajo'),
('Ingeniero Civil', 'Profesional responsable del proyecto'),
('Arquitecto', 'Profesional responsable del diseño'),
('Capataz', 'Supervisor de campo'),
('Operario de Maquinaria', 'Operador de equipos pesados')
ON CONFLICT DO NOTHING;

-- Insertar materiales comunes (evitar duplicados)
INSERT INTO materials (name, description, quantity) VALUES
('Cemento', 'Cemento Portland para construcción', 1000),
('Arena', 'Arena fina para mezclas', 2000),
('Grava', 'Grava gruesa para concreto', 1500),
('Varilla #3', 'Varilla de acero de 3/8 pulgada', 500),
('Varilla #4', 'Varilla de acero de 1/2 pulgada', 300),
('Varilla #5', 'Varilla de acero de 5/8 pulgada', 200),
('Bloque de Concreto', 'Bloque de concreto 15x20x40 cm', 2000),
('Ladrillo', 'Ladrillo cerámico rojo', 5000),
('Cable Eléctrico', 'Cable THW calibre 12', 1000),
('Tubería PVC', 'Tubería PVC de 4 pulgadas', 200),
('Pintura', 'Pintura vinílica blanca', 50),
('Madera', 'Madera de pino 2x4 pulgadas', 100),
('Cemento Gris', 'Cemento gris para acabados', 200),
('Cal', 'Cal hidratada para acabados', 100),
('Yeso', 'Yeso para acabados interiores', 150)
ON CONFLICT DO NOTHING;

-- Insertar usuario administrador por defecto (evitar duplicados)
INSERT INTO users (email, username, role_id, password, blood_type) VALUES
('admin@constructor.com', 'Administrador', 1, '$2b$10$rQZ8K9mN2pL3oI4uY5vW6eR7tY8uI9oP0aS1dF2gH3jK4lM5nB6cV7xZ8wE9rT0', 'O+')
ON CONFLICT (email) DO NOTHING;

-- Insertar zonas de trabajo de ejemplo (evitar duplicados)
INSERT INTO work_zones (name, description, supervisor_id, latitud, longitud) VALUES
('Zona A - Estructura Principal', 'Zona de construcción de la estructura principal del edificio', 1, 4.8133, -75.6961),
('Zona B - Acabados', 'Zona de trabajos de acabados y detalles', 1, 4.8140, -75.6970),
('Zona C - Instalaciones', 'Zona de instalaciones eléctricas e hidráulicas', 1, 4.8125, -75.6955),
('Zona D - Exteriores', 'Zona de trabajos exteriores y paisajismo', 1, 4.8150, -75.6980)
ON CONFLICT DO NOTHING;

-- Insertar asignaciones de materiales a zonas (evitar duplicados)
INSERT INTO material_zone (id_zona, id_material, cantidad_asignada) VALUES
(1, 1, 500),  -- Cemento para Zona A
(1, 2, 1000), -- Arena para Zona A
(1, 3, 800),  -- Grava para Zona A
(1, 4, 200),  -- Varilla #3 para Zona A
(2, 1, 200),  -- Cemento para Zona B
(2, 7, 1000), -- Bloques para Zona B
(2, 8, 2000), -- Ladrillos para Zona B
(3, 9, 500),  -- Cable eléctrico para Zona C
(3, 10, 100), -- Tubería PVC para Zona C
(4, 11, 25),  -- Pintura para Zona D
(4, 12, 50)   -- Madera para Zona D
ON CONFLICT (id_zona, id_material) DO NOTHING;

-- =====================================================
-- 4. FUNCIONES PERSONALIZADAS
-- =====================================================

-- Función para actualizar timestamp de actualización
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para calcular distancia entre coordenadas
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN 6371 * acos(
        cos(radians(lat1)) * cos(radians(lat2)) * 
        cos(radians(lon2) - radians(lon1)) + 
        sin(radians(lat1)) * sin(radians(lat2))
    );
END;
$$ LANGUAGE plpgsql;

-- Función para obtener usuarios cercanos
CREATE OR REPLACE FUNCTION get_users_nearby(
    p_lat DOUBLE PRECISION,
    p_lon DOUBLE PRECISION,
    p_radius DOUBLE PRECISION DEFAULT 1.0
)
RETURNS TABLE (
    user_id INTEGER,
    username TEXT,
    email TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.email,
        u.latitude,
        u.longitude,
        calculate_distance(p_lat, p_lon, u.latitude, u.longitude) as distance
    FROM users u
    WHERE u.latitude IS NOT NULL 
        AND u.longitude IS NOT NULL
        AND calculate_distance(p_lat, p_lon, u.latitude, u.longitude) <= p_radius
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de zona
CREATE OR REPLACE FUNCTION get_zone_stats(p_zone_id INTEGER)
RETURNS TABLE (
    total_tasks INTEGER,
    completed_tasks INTEGER,
    pending_tasks INTEGER,
    active_workers INTEGER,
    total_materials INTEGER,
    assigned_materials INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(t.id)::INTEGER as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::INTEGER as completed_tasks,
        COUNT(CASE WHEN t.status = 'pending' THEN 1 END)::INTEGER as pending_tasks,
        COUNT(DISTINCT ci.user_id)::INTEGER as active_workers,
        COUNT(m.id)::INTEGER as total_materials,
        COUNT(mz.id)::INTEGER as assigned_materials
    FROM work_zones wz
    LEFT JOIN tasks t ON wz.id = t.work_zone_id
    LEFT JOIN check_ins ci ON wz.id = ci.zone_id AND ci.status = 'active'
    LEFT JOIN materials m ON TRUE
    LEFT JOIN material_zone mz ON wz.id = mz.id_zona
    WHERE wz.id = p_zone_id
    GROUP BY wz.id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at en users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en work_zones
CREATE TRIGGER update_work_zones_updated_at 
    BEFORE UPDATE ON work_zones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en materials
CREATE TRIGGER update_materials_updated_at 
    BEFORE UPDATE ON materials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en tasks
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en material_requests
CREATE TRIGGER update_material_requests_updated_at 
    BEFORE UPDATE ON material_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en check_ins
CREATE TRIGGER update_check_ins_updated_at 
    BEFORE UPDATE ON check_ins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en jobs
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en roles
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en tablas sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id')::INTEGER 
            AND u.role_id = 1
        )
    );

CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY "Supervisors can view workers in their zones" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM work_zones wz 
            WHERE wz.supervisor_id = current_setting('app.current_user_id')::INTEGER
            AND EXISTS (
                SELECT 1 FROM check_ins ci 
                WHERE ci.user_id = users.id 
                AND ci.zone_id = wz.id
            )
        )
    );

-- Políticas para zonas de trabajo
CREATE POLICY "Admins can manage all zones" ON work_zones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id')::INTEGER 
            AND u.role_id = 1
        )
    );

CREATE POLICY "Supervisors can manage their zones" ON work_zones
    FOR ALL USING (supervisor_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY "Workers can view zones they work in" ON work_zones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM check_ins ci 
            WHERE ci.zone_id = work_zones.id 
            AND ci.user_id = current_setting('app.current_user_id')::INTEGER
        )
    );

-- Políticas para tareas
CREATE POLICY "Admins can manage all tasks" ON tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id')::INTEGER 
            AND u.role_id = 1
        )
    );

CREATE POLICY "Supervisors can manage tasks in their zones" ON tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM work_zones wz 
            WHERE wz.id = tasks.work_zone_id 
            AND wz.supervisor_id = current_setting('app.current_user_id')::INTEGER
        )
    );

CREATE POLICY "Workers can view their assigned tasks" ON tasks
    FOR SELECT USING (assigned_to = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY "Workers can update their task status" ON tasks
    FOR UPDATE USING (assigned_to = current_setting('app.current_user_id')::INTEGER);

-- Políticas para solicitudes de materiales
CREATE POLICY "Admins can manage all material requests" ON material_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id')::INTEGER 
            AND u.role_id = 1
        )
    );

CREATE POLICY "Supervisors can manage requests in their zones" ON material_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM work_zones wz 
            WHERE wz.id = material_requests.zone_id 
            AND wz.supervisor_id = current_setting('app.current_user_id')::INTEGER
        )
    );

CREATE POLICY "Workers can create and view their requests" ON material_requests
    FOR ALL USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Políticas para check-ins
CREATE POLICY "Admins can view all check-ins" ON check_ins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id')::INTEGER 
            AND u.role_id = 1
        )
    );

CREATE POLICY "Supervisors can view check-ins in their zones" ON check_ins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM work_zones wz 
            WHERE wz.id = check_ins.zone_id 
            AND wz.supervisor_id = current_setting('app.current_user_id')::INTEGER
        )
    );

CREATE POLICY "Workers can manage their own check-ins" ON check_ins
    FOR ALL USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Políticas para mensajes de chat
CREATE POLICY "Users can view messages in their zones" ON chat_messages
    FOR SELECT USING (
        work_zone_id IS NULL OR -- Mensajes generales
        EXISTS (
            SELECT 1 FROM check_ins ci 
            WHERE ci.zone_id = chat_messages.work_zone_id 
            AND ci.user_id = current_setting('app.current_user_id')::INTEGER
        )
    );

CREATE POLICY "Users can send messages to their zones" ON chat_messages
    FOR INSERT WITH CHECK (
        sender_id = current_setting('app.current_user_id')::INTEGER AND
        (work_zone_id IS NULL OR EXISTS (
            SELECT 1 FROM check_ins ci 
            WHERE ci.zone_id = chat_messages.work_zone_id 
            AND ci.user_id = current_setting('app.current_user_id')::INTEGER
        ))
    );

-- Políticas para mensajes privados
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (
        sender_id = current_setting('app.current_user_id')::INTEGER OR 
        receiver_id = current_setting('app.current_user_id')::INTEGER
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (sender_id = current_setting('app.current_user_id')::INTEGER);

-- =====================================================
-- 7. VISTAS ÚTILES
-- =====================================================

-- Vista para dashboard de supervisores
CREATE VIEW supervisor_dashboard AS
SELECT 
    wz.id as zone_id,
    wz.name as zone_name,
    wz.description,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
    COUNT(DISTINCT ci.user_id) as active_workers,
    COUNT(DISTINCT mr.id) as pending_requests,
    u.username as supervisor_name
FROM work_zones wz
LEFT JOIN tasks t ON wz.id = t.work_zone_id
LEFT JOIN check_ins ci ON wz.id = ci.zone_id AND ci.status = 'active'
LEFT JOIN material_requests mr ON wz.id = mr.zone_id AND mr.status = 'pending'
LEFT JOIN users u ON wz.supervisor_id = u.id
GROUP BY wz.id, wz.name, wz.description, u.username;

-- Vista para estadísticas de trabajadores
CREATE VIEW worker_stats AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    r.role_name,
    j.name as job_name,
    COUNT(DISTINCT ci.id) as total_checkins,
    COUNT(CASE WHEN ci.status = 'active' THEN 1 END) as active_checkins,
    COUNT(DISTINCT t.id) as assigned_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    AVG(EXTRACT(EPOCH FROM (ci.check_out_time - ci.check_in_time))/3600) as avg_hours_worked
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN jobs j ON u.job_id = j."idJob"
LEFT JOIN check_ins ci ON u.id = ci.user_id
LEFT JOIN tasks t ON u.id = t.assigned_to
GROUP BY u.id, u.username, u.email, r.role_name, j.name;

-- Vista para inventario por zona
CREATE VIEW zone_inventory AS
SELECT 
    wz.id as zone_id,
    wz.name as zone_name,
    m.id as material_id,
    m.name as material_name,
    m.description,
    mz.cantidad_asignada,
    m.quantity as total_available,
    (m.quantity - COALESCE(SUM(mr.quantity_requested), 0)) as available_after_requests
FROM work_zones wz
LEFT JOIN material_zone mz ON wz.id = mz.id_zona
LEFT JOIN materials m ON mz.id_material = m.id
LEFT JOIN material_requests mr ON m.name = mr.material AND mr.status = 'pending'
GROUP BY wz.id, wz.name, m.id, m.name, m.description, mz.cantidad_asignada, m.quantity;

-- =====================================================
-- 8. CONFIGURACIÓN DE CONEXIÓN
-- =====================================================

-- Crear usuario de aplicación (evitar duplicados)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
        CREATE USER app_user WITH PASSWORD 'secure_password_2024';
    END IF;
END
$$;

-- Otorgar permisos
GRANT CONNECT ON DATABASE postgres TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Configurar variables de sesión para RLS
ALTER USER app_user SET row_security = on;

-- =====================================================
-- 9. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE users IS 'Usuarios del sistema con roles y ubicación GPS';
COMMENT ON TABLE roles IS 'Roles del sistema con permisos específicos';
COMMENT ON TABLE work_zones IS 'Zonas de trabajo con supervisor asignado';
COMMENT ON TABLE tasks IS 'Tareas asignadas a trabajadores en zonas específicas';
COMMENT ON TABLE materials IS 'Inventario de materiales disponibles';
COMMENT ON TABLE material_requests IS 'Solicitudes de materiales por zona';
COMMENT ON TABLE check_ins IS 'Registro de entrada y salida con geolocalización';
COMMENT ON TABLE chat_messages IS 'Mensajes de chat por zona de trabajo';
COMMENT ON TABLE attendance IS 'Registro de asistencia tradicional';

COMMENT ON FUNCTION calculate_distance IS 'Calcula distancia entre dos puntos GPS usando fórmula de Haversine';
COMMENT ON FUNCTION get_users_nearby IS 'Obtiene usuarios cercanos a una ubicación específica';
COMMENT ON FUNCTION get_zone_stats IS 'Obtiene estadísticas completas de una zona de trabajo';

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================

-- Para aplicar este esquema:
-- 1. Conectarse a PostgreSQL como superusuario
-- 2. Ejecutar este archivo completo
-- 3. Verificar que todas las tablas se crearon correctamente
-- 4. Configurar la conexión de la aplicación con el usuario app_user

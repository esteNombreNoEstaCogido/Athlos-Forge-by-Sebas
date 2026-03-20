-- ============================================
-- SCRIPT DE BASE DE DATOS - Athlos Forge
-- ============================================
-- Este script crea todas las tablas necesarias para
-- el funcionamiento de la plataforma de entrenamientos
-- Contraseñas: hash bcrypt (password_hash PHP)
-- Tarjetas de crédito: cifrado AES-256-CBC (openssl PHP)

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS athlos_forge;
USE athlos_forge;

-- ============================================
-- TABLA: USUARIOS
-- ============================================
-- Almacena información de usuarios registrados
-- password → hash bcrypt (no reversible)
-- tarjeta_credito → cifrado AES-256-CBC (reversible solo con clave del servidor)
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL COMMENT 'Máximo dos palabras',
    apellidos VARCHAR(100) NOT NULL COMMENT 'Máximo dos palabras',
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt via password_hash()',
    rol ENUM('cliente', 'administrador') DEFAULT 'cliente',
    genero ENUM('masculino', 'femenino', 'otros') DEFAULT NULL,
    fecha_nacimiento DATE DEFAULT NULL,
    direccion VARCHAR(200) DEFAULT NULL,
    pais VARCHAR(100) DEFAULT NULL,
    tarjeta_credito TEXT COMMENT 'Cifrado AES-256-CBC, base64 encoded',
    telefono VARCHAR(20),
    notificaciones BOOLEAN DEFAULT FALSE,
    estado ENUM('activo', 'inactivo', 'bloqueado') DEFAULT 'activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_sesion DATETIME,
    INDEX idx_email (email),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: SESIONES
-- ============================================
-- Gestión de sesiones activas de usuarios
CREATE TABLE sesiones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    session_id VARCHAR(128) NOT NULL COMMENT 'PHP session_id()',
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_usuario (id_usuario),
    INDEX idx_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: CATEGORÍAS
-- ============================================
-- Categorización de entrenamientos
CREATE TABLE categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: ARTÍCULOS / ENTRENAMIENTOS
-- ============================================
-- Productos de entrenamiento disponibles
CREATE TABLE articulos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    id_categoria INT NOT NULL,
    imagen_url VARCHAR(255),
    disponible BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE CASCADE,
    INDEX idx_categoria (id_categoria),
    INDEX idx_disponible (disponible),
    INDEX idx_precio (precio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: PEDIDOS
-- ============================================
-- Registra los pedidos realizados por usuarios
CREATE TABLE pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    numero_pedido VARCHAR(20) UNIQUE NOT NULL,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
    total DECIMAL(10, 2) NOT NULL,
    direccion_envio VARCHAR(200),
    fecha_entrega_estimada DATE,
    fecha_entrega_real DATE,
    notas TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (id_usuario),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: DETALLE_PEDIDO
-- ============================================
-- Detalles de los artículos en cada pedido
CREATE TABLE detalle_pedido (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    id_articulo INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_articulo) REFERENCES articulos(id) ON DELETE RESTRICT,
    INDEX idx_pedido (id_pedido),
    INDEX idx_articulo (id_articulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: CARRITO_SESION
-- ============================================
-- Almacena carritos temporales de usuarios
CREATE TABLE carrito_sesion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    token_sesion VARCHAR(100) UNIQUE,
    id_articulo INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_articulo) REFERENCES articulos(id) ON DELETE CASCADE,
    INDEX idx_usuario (id_usuario),
    INDEX idx_token (token_sesion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: MOVIMIENTO_STOCK
-- ============================================
-- Auditoría de cambios en el stock
CREATE TABLE movimiento_stock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_articulo INT NOT NULL,
    cantidad_anterior INT,
    cantidad_nueva INT,
    tipo_movimiento ENUM('entrada', 'salida', 'ajuste') NOT NULL,
    motivo VARCHAR(200),
    usuario_responsable INT,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_articulo) REFERENCES articulos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_responsable) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_articulo (id_articulo),
    INDEX idx_fecha (fecha_movimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: OPINIONES / RESEÑAS
-- ============================================
-- Reseñas de usuarios sobre entrenamientos
CREATE TABLE opiniones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_articulo INT NOT NULL,
    calificacion INT NOT NULL COMMENT 'Del 1 al 5',
    comentario TEXT,
    fecha_resena TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('aprobada', 'pendiente', 'rechazada') DEFAULT 'pendiente',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_articulo) REFERENCES articulos(id) ON DELETE CASCADE,
    INDEX idx_usuario (id_usuario),
    INDEX idx_articulo (id_articulo),
    INDEX idx_estado (estado),
    UNIQUE KEY unique_resena (id_usuario, id_articulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: NOTIFICACIONES
-- ============================================
-- Registro de notificaciones enviadas a usuarios
CREATE TABLE notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    tipo ENUM('pedido', 'oferta', 'revista', 'sistema') DEFAULT 'sistema',
    asunto VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (id_usuario),
    INDEX idx_leida (leida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: REVISTA_DIGITAL
-- ============================================
-- Registro de envíos de revista digital
CREATE TABLE revista_digital (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    numero INT NOT NULL,
    mes INT NOT NULL,
    anno INT NOT NULL,
    fecha_envio DATE NOT NULL,
    contenido TEXT,
    abierta BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (id_usuario),
    INDEX idx_fecha (fecha_envio),
    UNIQUE KEY unique_revista (id_usuario, mes, anno)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: LOGS_SISTEMA
-- ============================================
-- Auditoría de actividades importantes
CREATE TABLE logs_sistema (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo_accion VARCHAR(100) NOT NULL,
    id_usuario INT,
    descripcion TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_tipo (tipo_accion),
    INDEX idx_usuario (id_usuario),
    INDEX idx_fecha (fecha_accion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERCIONES DE DATOS INICIALES
-- ============================================

-- Insertar categorías
INSERT INTO categorias (nombre, descripcion) VALUES
('Funcional', 'Entrenamientos que mejoran tu resistencia y fuerza general'),
('Boxeo', 'Clases de boxeo y kickboxing con técnicas profesionales'),
('Pilates', 'Mejora tu flexibilidad y fortalece tu core'),
('Asesoramiento', 'Consultas personalizadas de nutrición y entrenamiento');

-- Insertar artículos (coinciden con entrenamientos.html)
INSERT INTO articulos (nombre, descripcion, precio, stock, id_categoria, imagen_url, disponible) VALUES
('Entrenamiento Funcional', 'Mejora tu resistencia y fuerza con ejercicios dinámicos que fortalecen todo el cuerpo.', 50.00, 100, 1, 'img/funcional.webp', TRUE),
('Boxeo / Kickboxing', 'Aprende técnicas de defensa y ataque con profesionales certificados.', 60.00, 80, 2, 'img/boxeo.webp', TRUE),
('Pilates / Movilidad', 'Aumenta tu flexibilidad y fortalece el core con movimientos controlados.', 45.00, 90, 3, 'img/pilates.webp', TRUE),
('Paquete Completo', 'Acceso a todos los entrenamientos + asesoramiento personalizado.', 120.00, 50, 4, 'img/paquete.webp', TRUE),
('GAP', 'Abdomen, Glúteos y Piernas. Tonifica las zonas más buscadas con ejercicios efectivos.', 55.00, 70, 1, 'img/gap.webp', TRUE),
('Rehabilitación', 'Recuperate y fortalécete con fisioterapia especializada e individualizada.', 65.00, 40, 4, 'img/rehabilitacion.webp', TRUE),
('Fuerza', 'Potencia tus músculos con entrenamientos de musculación de alta intensidad.', 70.00, 60, 1, 'img/fuerza.webp', TRUE),
('Ciclo / Spinning', 'Quema calorías y mejora tu resistencia cardiovascular en bicicleta estática.', 50.00, 85, 1, 'img/spinning.webp', TRUE);

-- Crear usuario administrador de prueba (contraseña: Admin123!)
-- En producción, usar un hash bcrypt adecuado
INSERT INTO usuarios (nombre, apellidos, email, password, rol, genero, fecha_nacimiento, direccion, pais, estado) VALUES
('Admin', 'Sistema', 'admin@athlosforge.com', '$2y$10$53xGXGd92GpbV4GAz0kP.eTyH2Q.dFtwZ6cAxfSXPNeSiEpdNPb2S', 'administrador', 'masculino', '1990-01-01', 'Calle Admin, 1', 'España', 'activo');

-- ============================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================

-- Procedimiento para registrar un nuevo usuario
DELIMITER //
CREATE PROCEDURE sp_registrar_usuario(
    IN p_nombre VARCHAR(100),
    IN p_apellidos VARCHAR(100),
    IN p_email VARCHAR(120),
    IN p_password VARCHAR(255),
    IN p_genero VARCHAR(50),
    IN p_fecha_nacimiento DATE,
    IN p_direccion VARCHAR(200),
    IN p_pais VARCHAR(100),
    IN p_tarjeta TEXT,
    IN p_telefono VARCHAR(20),
    IN p_notificaciones BOOLEAN,
    OUT p_id INT,
    OUT p_success BOOLEAN,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_success = FALSE;
        SET p_mensaje = 'Error en la base de datos';
    END;

    IF EXISTS (SELECT id FROM usuarios WHERE email = p_email) THEN
        SET p_success = FALSE;
        SET p_mensaje = 'El correo ya está registrado';
    ELSE
        INSERT INTO usuarios (
            nombre, apellidos, email, password, genero,
            fecha_nacimiento, direccion, pais, tarjeta_credito,
            telefono, notificaciones
        ) VALUES (
            p_nombre, p_apellidos, p_email, p_password, p_genero,
            p_fecha_nacimiento, p_direccion, p_pais, p_tarjeta,
            p_telefono, p_notificaciones
        );
        
        SET p_id = LAST_INSERT_ID();
        SET p_success = TRUE;
        SET p_mensaje = 'Usuario registrado exitosamente';
    END IF;
END //
DELIMITER ;

-- Procedimiento para crear un pedido
DELIMITER //
CREATE PROCEDURE sp_crear_pedido(
    IN p_id_usuario INT,
    IN p_total DECIMAL(10,2),
    OUT p_id_pedido INT,
    OUT p_numero_pedido VARCHAR(20),
    OUT p_success BOOLEAN
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_success = FALSE;
    END;

    SET p_numero_pedido = CONCAT('PED-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'));
    
    INSERT INTO pedidos (id_usuario, numero_pedido, total, estado)
    VALUES (p_id_usuario, p_numero_pedido, p_total, 'pendiente');
    
    SET p_id_pedido = LAST_INSERT_ID();
    SET p_success = TRUE;
END //
DELIMITER ;

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Resumen de ventas por categoría
CREATE VIEW v_ventas_por_categoria AS
SELECT 
    c.nombre AS categoria,
    COUNT(DISTINCT p.id) AS total_pedidos,
    SUM(dp.cantidad) AS cantidad_vendida,
    SUM(dp.subtotal) AS ingresos_totales
FROM categorias c
LEFT JOIN articulos a ON c.id = a.id_categoria
LEFT JOIN detalle_pedido dp ON a.id = dp.id_articulo
LEFT JOIN pedidos p ON dp.id_pedido = p.id AND p.estado NOT IN ('cancelado', 'pendiente')
GROUP BY c.id, c.nombre;

-- Vista: Clientes más activos
CREATE VIEW v_clientes_activos AS
SELECT 
    u.id,
    u.nombre,
    u.apellidos,
    u.email,
    COUNT(DISTINCT p.id) AS total_pedidos,
    SUM(p.total) AS gasto_total,
    MAX(p.fecha_pedido) AS ultima_compra
FROM usuarios u
LEFT JOIN pedidos p ON u.id = p.id_usuario AND p.estado != 'cancelado'
WHERE u.estado = 'activo' AND u.rol = 'cliente'
GROUP BY u.id, u.nombre, u.apellidos, u.email
ORDER BY gasto_total DESC;

-- Vista: Stock bajo
CREATE VIEW v_stock_bajo AS
SELECT 
    id,
    nombre,
    stock,
    precio,
    id_categoria
FROM articulos
WHERE stock <= 10 AND disponible = TRUE
ORDER BY stock ASC;

COMMIT;

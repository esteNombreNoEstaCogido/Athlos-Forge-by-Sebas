<?php
/**
 * Configuración y conexión a la Base de Datos
 * Utilizamos PDO para consultas preparadas (seguridad contra SQL Injection)
 */

// Configuración de conexión
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'athlos_forge');

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        )
    );
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'mensaje' => 'Error de conexión a la base de datos',
        'debug' => $e->getMessage()
    ]));
}

/**
 * Función auxiliar para ejecutar consultas con preparadas
 */
function executeQuery($query, $params = []) {
    global $pdo;
    try {
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        return $stmt;
    } catch (PDOException $e) {
        throw new Exception('Error en la consulta: ' . $e->getMessage());
    }
}

/**
 * Función para validar tokens JWT (simplificado)
 */
function validateToken($token) {
    // En producción, implementar JWT adecuadamente
    if (empty($token)) {
        return false;
    }
    // Por ahora, retornar true (implementar luego)
    return true;
}

/**
 * Función para hash de contraseña
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
}

/**
 * Función para verificar contraseña
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Función para generar token (simplificado)
 */
function generateToken($user_id) {
    // En producción, implementar JWT
    return bin2hex(random_bytes(32));
}

/**
 * Función para obtener usuario autenticado
 */
function getAuthUser() {
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
        // Validar y retornar usuario basado en token
        // Por ahora, retornar null
        return null;
    }
    return null;
}
?>

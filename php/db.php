<?php
/**
 * Configuración y conexión a la Base de Datos
 * PDO con consultas preparadas (seguridad contra SQL Injection)
 * Sesiones PHP para autenticación y roles
 * AES-256-CBC para cifrado de tarjetas de crédito
 */

// ============ CARGA DE VARIABLES DE ENTORNO ============
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) {
            continue;
        }
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key   = trim($key);
            $value = trim($value);
            if (!array_key_exists($key, $_ENV)) {
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
    }
} else {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'mensaje' => 'Archivo .env no encontrado. Copia .env.example como .env y configura tus credenciales.'
    ]));
}

// ============ CONFIGURACIÓN ============
define('DB_HOST',    $_ENV['DB_HOST']    ?? 'localhost');
define('DB_USER',    $_ENV['DB_USER']    ?? 'root');
define('DB_PASS',    $_ENV['DB_PASS']    ?? '');
define('DB_NAME',    $_ENV['DB_NAME']    ?? 'athlos_forge');
define('AES_KEY',    $_ENV['AES_KEY']    ?? '');
define('AES_METHOD', 'aes-256-cbc');

// ============ CONEXIÓN PDO ============
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
        'mensaje' => 'Error de conexión a la base de datos'
    ]));
}

// ============ SESIONES PHP ============
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 3600, // 1 hora
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

/**
 * Iniciar sesión de usuario en PHP y registrar en la BD
 */
function iniciarSesion($usuario) {
    global $pdo;

    $_SESSION['usuario_id'] = $usuario['id'];
    $_SESSION['usuario_nombre'] = $usuario['nombre'];
    $_SESSION['usuario_email'] = $usuario['email'];
    $_SESSION['usuario_rol'] = $usuario['rol'];
    $_SESSION['login_time'] = time();

    // Registrar sesión en BD
    $stmt = $pdo->prepare('
        INSERT INTO sesiones (id_usuario, session_id, ip_address, user_agent)
        VALUES (?, ?, ?, ?)
    ');
    $stmt->execute([
        $usuario['id'],
        session_id(),
        $_SERVER['REMOTE_ADDR'] ?? '',
        $_SERVER['HTTP_USER_AGENT'] ?? ''
    ]);

    // Actualizar última sesión del usuario
    $stmt = $pdo->prepare('UPDATE usuarios SET fecha_ultima_sesion = NOW() WHERE id = ?');
    $stmt->execute([$usuario['id']]);
}

/**
 * Cerrar sesión del usuario
 */
function cerrarSesion() {
    global $pdo;

    if (isset($_SESSION['usuario_id'])) {
        // Desactivar sesión en BD
        $stmt = $pdo->prepare('UPDATE sesiones SET activa = FALSE WHERE session_id = ?');
        $stmt->execute([session_id()]);
    }

    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
}

/**
 * Obtener el usuario autenticado de la sesión activa
 * Retorna array con datos del usuario o null
 */
function getUsuarioSesion() {
    if (isset($_SESSION['usuario_id'])) {
        return [
            'id' => $_SESSION['usuario_id'],
            'nombre' => $_SESSION['usuario_nombre'],
            'email' => $_SESSION['usuario_email'],
            'rol' => $_SESSION['usuario_rol']
        ];
    }
    return null;
}

/**
 * Verificar que el usuario está autenticado.
 * Si no, devuelve error 401 y termina.
 */
function requiereAutenticacion() {
    $usuario = getUsuarioSesion();
    if (!$usuario) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Debes iniciar sesión para realizar esta acción'
        ]);
        exit;
    }
    return $usuario;
}

/**
 * Verificar que el usuario tiene rol de administrador.
 * Si no, devuelve error 403 y termina.
 */
function requiereAdmin() {
    $usuario = requiereAutenticacion();
    if ($usuario['rol'] !== 'administrador') {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Acceso denegado: se requiere rol de administrador'
        ]);
        exit;
    }
    return $usuario;
}

// ============ CIFRADO / HASH ============

/**
 * Hash de contraseña con bcrypt
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
}

/**
 * Verificar contraseña contra hash bcrypt
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Cifrar tarjeta de crédito con AES-256-CBC
 * Retorna string base64(iv + cifrado)
 */
function encriptarTarjeta($numero_tarjeta) {
    if (empty($numero_tarjeta)) return null;
    // Limpiar espacios y guiones
    $limpia = preg_replace('/[\s\-]/', '', $numero_tarjeta);
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length(AES_METHOD));
    $cifrado = openssl_encrypt($limpia, AES_METHOD, AES_KEY, 0, $iv);
    // Guardar iv + cifrado juntos, codificados en base64
    return base64_encode($iv . '::' . $cifrado);
}

/**
 * Descifrar tarjeta de crédito
 * Retorna los últimos 4 dígitos por seguridad (enmascarada)
 */
function descifrarTarjeta($datos_cifrados) {
    if (empty($datos_cifrados)) return null;
    $partes = explode('::', base64_decode($datos_cifrados), 2);
    if (count($partes) !== 2) return null;
    list($iv, $cifrado) = $partes;
    $descifrado = openssl_decrypt($cifrado, AES_METHOD, AES_KEY, 0, $iv);
    if ($descifrado === false) return null;
    // Devolver solo los últimos 4 dígitos enmascarados
    return '**** **** **** ' . substr($descifrado, -4);
}

/**
 * Descifrar tarjeta completa (solo uso interno para procesamiento de pago)
 */
function descifrarTarjetaCompleta($datos_cifrados) {
    if (empty($datos_cifrados)) return null;
    $partes = explode('::', base64_decode($datos_cifrados), 2);
    if (count($partes) !== 2) return null;
    list($iv, $cifrado) = $partes;
    $descifrado = openssl_decrypt($cifrado, AES_METHOD, AES_KEY, 0, $iv);
    return $descifrado !== false ? $descifrado : null;
}

// ============ UTILIDADES ============

/**
 * Ejecutar consulta preparada
 */
function executeQuery($query, $params = []) {
    global $pdo;
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    return $stmt;
}

/**
 * Registrar actividad en logs_sistema
 */
function registrarLog($tipo, $id_usuario, $descripcion) {
    global $pdo;
    try {
        $stmt = $pdo->prepare('
            INSERT INTO logs_sistema (tipo_accion, id_usuario, descripcion, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $tipo,
            $id_usuario,
            $descripcion,
            $_SERVER['REMOTE_ADDR'] ?? '',
            $_SERVER['HTTP_USER_AGENT'] ?? 'N/A'
        ]);
    } catch (Exception $e) {
        // No interrumpir por errores de log
    }
}
?>

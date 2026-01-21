<?php
/**
 * API REST - Athlos Forge
 * Archivo principal que gestiona todas las peticiones
 * 
 * Endpoints disponibles:
 * - POST /api.php?action=login - Iniciar sesión
 * - POST /api.php?action=register - Crear cuenta
 * - GET /api.php?action=productos - Obtener productos
 * - POST /api.php?action=carrito - Agregar al carrito
 * - POST /api.php?action=pedido - Crear pedido
 * - GET /api.php?action=pedidos - Obtener pedidos del usuario
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Permitir peticiones OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

// Obtener la acción solicitada
$action = isset($_GET['action']) ? $_GET['action'] : null;

// Encaminar a la función correspondiente
switch ($action) {
    // ============ AUTENTICACIÓN ============
    case 'login':
        handleLogin();
        break;
    
    case 'register':
        handleRegister();
        break;
    
    case 'logout':
        handleLogout();
        break;

    // ============ PRODUCTOS ============
    case 'productos':
        getProductos();
        break;
    
    case 'producto':
        getProductoById();
        break;
    
    case 'categorias':
        getCategorias();
        break;

    // ============ CARRITO ============
    case 'carrito_agregar':
        agregarAlCarrito();
        break;
    
    case 'carrito_obtener':
        obtenerCarrito();
        break;
    
    case 'carrito_eliminar':
        eliminarDelCarrito();
        break;

    // ============ PEDIDOS ============
    case 'crear_pedido':
        crearPedido();
        break;
    
    case 'obtener_pedidos':
        obtenerPedidos();
        break;
    
    case 'obtener_pedido':
        obtenerPedidoById();
        break;

    // ============ USUARIO ============
    case 'perfil':
        obtenerPerfil();
        break;
    
    case 'actualizar_perfil':
        actualizarPerfil();
        break;

    // ============ OPINIONES ============
    case 'crear_opinion':
        crearOpinion();
        break;
    
    case 'obtener_opiniones':
        obtenerOpiniones();
        break;

    default:
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Acción no encontrada'
        ]);
        break;
}

// ========================================
// FUNCIONES DE AUTENTICACIÓN
// ========================================

function handleLogin() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['email']) || empty($input['password'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Email y contraseña son requeridos'
        ]);
        return;
    }

    try {
        $stmt = $pdo->prepare('SELECT id, nombre, apellidos, email, password, rol, estado FROM usuarios WHERE email = ?');
        $stmt->execute([$input['email']]);
        $usuario = $stmt->fetch();

        if (!$usuario || !verifyPassword($input['password'], $usuario['password'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'mensaje' => 'Credenciales inválidas'
            ]);
            return;
        }

        if ($usuario['estado'] !== 'activo') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'mensaje' => 'Usuario no activo'
            ]);
            return;
        }

        // Actualizar última sesión
        $stmt = $pdo->prepare('UPDATE usuarios SET fecha_ultima_sesion = NOW() WHERE id = ?');
        $stmt->execute([$usuario['id']]);

        // Generar token
        $token = generateToken($usuario['id']);

        // Registrar en logs
        registrarLog('LOGIN_EXITOSO', $usuario['id'], 'Usuario ' . $usuario['email'] . ' inició sesión');

        echo json_encode([
            'success' => true,
            'mensaje' => 'Inicio de sesión exitoso',
            'token' => $token,
            'usuario' => [
                'id' => $usuario['id'],
                'nombre' => $usuario['nombre'],
                'apellidos' => $usuario['apellidos'],
                'email' => $usuario['email'],
                'rol' => $usuario['rol']
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al procesar la solicitud',
            'debug' => $e->getMessage()
        ]);
    }
}

function handleRegister() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);

    // Validar datos requeridos
    $campos_requeridos = ['nombre', 'apellidos', 'email', 'password', 'genero', 'fecha_nacimiento', 'direccion', 'pais'];
    foreach ($campos_requeridos as $campo) {
        if (empty($input[$campo])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'mensaje' => "El campo '$campo' es requerido"
            ]);
            return;
        }
    }

    // Validar email
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Email inválido'
        ]);
        return;
    }

    try {
        // Verificar si el email ya existe
        $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
        $stmt->execute([$input['email']]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'mensaje' => 'El email ya está registrado'
            ]);
            return;
        }

        // Hash de contraseña
        $password_hash = hashPassword($input['password']);

        // Insertar usuario
        $stmt = $pdo->prepare('
            INSERT INTO usuarios 
            (nombre, apellidos, email, password, rol, genero, fecha_nacimiento, direccion, pais, tarjeta_credito, notificaciones, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');

        $stmt->execute([
            $input['nombre'],
            $input['apellidos'],
            $input['email'],
            $password_hash,
            'cliente',
            $input['genero'],
            $input['fecha_nacimiento'],
            $input['direccion'],
            $input['pais'],
            $input['tarjeta'] ?? null,
            $input['notificaciones'] ?? false,
            'activo'
        ]);

        $user_id = $pdo->lastInsertId();

        // Generar token
        $token = generateToken($user_id);

        // Registrar en logs
        registrarLog('REGISTRO_EXITOSO', $user_id, 'Nuevo usuario registrado: ' . $input['email']);

        echo json_encode([
            'success' => true,
            'mensaje' => 'Registro exitoso',
            'token' => $token,
            'usuario' => [
                'id' => $user_id,
                'nombre' => $input['nombre'],
                'apellidos' => $input['apellidos'],
                'email' => $input['email'],
                'rol' => 'cliente'
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al registrar',
            'debug' => $e->getMessage()
        ]);
    }
}

function handleLogout() {
    // En una aplicación real, invalidar el token aquí
    echo json_encode([
        'success' => true,
        'mensaje' => 'Sesión cerrada'
    ]);
}

// ========================================
// FUNCIONES DE PRODUCTOS
// ========================================

function getProductos() {
    global $pdo;

    $categoria = isset($_GET['categoria']) ? $_GET['categoria'] : null;
    $query = 'SELECT id, nombre, descripcion, precio, stock, id_categoria, imagen_url FROM articulos WHERE disponible = TRUE';
    $params = [];

    if ($categoria) {
        $query .= ' AND id_categoria = ?';
        $params[] = $categoria;
    }

    $query .= ' ORDER BY nombre ASC';

    try {
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $productos = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'datos' => $productos
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al obtener productos'
        ]);
    }
}

function getProductoById() {
    global $pdo;

    $id = isset($_GET['id']) ? $_GET['id'] : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'ID de producto requerido'
        ]);
        return;
    }

    try {
        $stmt = $pdo->prepare('
            SELECT a.*, c.nombre as categoria_nombre 
            FROM articulos a
            LEFT JOIN categorias c ON a.id_categoria = c.id
            WHERE a.id = ? AND a.disponible = TRUE
        ');
        $stmt->execute([$id]);
        $producto = $stmt->fetch();

        if (!$producto) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'mensaje' => 'Producto no encontrado'
            ]);
            return;
        }

        echo json_encode([
            'success' => true,
            'datos' => $producto
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al obtener producto'
        ]);
    }
}

function getCategorias() {
    global $pdo;

    try {
        $stmt = $pdo->query('SELECT id, nombre, descripcion, imagen_url FROM categorias ORDER BY nombre ASC');
        $categorias = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'datos' => $categorias
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al obtener categorías'
        ]);
    }
}

// ========================================
// FUNCIONES DE CARRITO
// ========================================

function agregarAlCarrito() {
    global $pdo;

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id_articulo']) || empty($input['id_usuario'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'ID de artículo e ID de usuario requeridos'
        ]);
        return;
    }

    try {
        // Verificar que el artículo existe y tiene stock
        $stmt = $pdo->prepare('SELECT precio, stock FROM articulos WHERE id = ?');
        $stmt->execute([$input['id_articulo']]);
        $articulo = $stmt->fetch();

        if (!$articulo) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'mensaje' => 'Artículo no encontrado'
            ]);
            return;
        }

        $cantidad = $input['cantidad'] ?? 1;

        if ($articulo['stock'] < $cantidad) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'mensaje' => 'Stock insuficiente'
            ]);
            return;
        }

        // Agregar al carrito
        $stmt = $pdo->prepare('
            INSERT INTO carrito_sesion (id_usuario, id_articulo, cantidad, precio_unitario)
            VALUES (?, ?, ?, ?)
        ');

        $stmt->execute([
            $input['id_usuario'],
            $input['id_articulo'],
            $cantidad,
            $articulo['precio']
        ]);

        echo json_encode([
            'success' => true,
            'mensaje' => 'Artículo agregado al carrito'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al agregar al carrito'
        ]);
    }
}

function obtenerCarrito() {
    global $pdo;

    $id_usuario = isset($_GET['id_usuario']) ? $_GET['id_usuario'] : null;

    if (!$id_usuario) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'ID de usuario requerido'
        ]);
        return;
    }

    try {
        $stmt = $pdo->prepare('
            SELECT 
                cs.id,
                a.id as id_articulo,
                a.nombre,
                cs.cantidad,
                cs.precio_unitario,
                (cs.cantidad * cs.precio_unitario) as subtotal
            FROM carrito_sesion cs
            JOIN articulos a ON cs.id_articulo = a.id
            WHERE cs.id_usuario = ?
            ORDER BY cs.fecha_agregado DESC
        ');
        $stmt->execute([$id_usuario]);
        $carrito = $stmt->fetchAll();

        $total = array_sum(array_column($carrito, 'subtotal'));

        echo json_encode([
            'success' => true,
            'datos' => $carrito,
            'total' => $total
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al obtener carrito'
        ]);
    }
}

function eliminarDelCarrito() {
    global $pdo;

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'ID del item requerido'
        ]);
        return;
    }

    try {
        $stmt = $pdo->prepare('DELETE FROM carrito_sesion WHERE id = ?');
        $stmt->execute([$input['id']]);

        echo json_encode([
            'success' => true,
            'mensaje' => 'Item eliminado del carrito'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al eliminar del carrito'
        ]);
    }
}

// ========================================
// FUNCIONES DE PEDIDOS
// ========================================

function crearPedido() {
    global $pdo;

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id_usuario'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'ID de usuario requerido'
        ]);
        return;
    }

    try {
        // Comenzar transacción
        $pdo->beginTransaction();

        // Obtener carrito del usuario
        $stmt = $pdo->prepare('
            SELECT id, id_articulo, cantidad, precio_unitario 
            FROM carrito_sesion 
            WHERE id_usuario = ?
        ');
        $stmt->execute([$input['id_usuario']]);
        $carrito = $stmt->fetchAll();

        if (empty($carrito)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'mensaje' => 'El carrito está vacío'
            ]);
            return;
        }

        // Calcular total
        $total = 0;
        foreach ($carrito as $item) {
            $total += $item['cantidad'] * $item['precio_unitario'];
        }

        // Crear pedido
        $numero_pedido = 'PED-' . date('YmdHis');
        $stmt = $pdo->prepare('
            INSERT INTO pedidos (id_usuario, numero_pedido, total, estado)
            VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([$input['id_usuario'], $numero_pedido, $total, 'confirmado']);
        $id_pedido = $pdo->lastInsertId();

        // Crear detalles del pedido y actualizar stock
        foreach ($carrito as $item) {
            // Insertar detalle
            $stmt = $pdo->prepare('
                INSERT INTO detalle_pedido (id_pedido, id_articulo, cantidad, precio_unitario, subtotal)
                VALUES (?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $id_pedido,
                $item['id_articulo'],
                $item['cantidad'],
                $item['precio_unitario'],
                $item['cantidad'] * $item['precio_unitario']
            ]);

            // Actualizar stock
            $stmt = $pdo->prepare('UPDATE articulos SET stock = stock - ? WHERE id = ?');
            $stmt->execute([$item['cantidad'], $item['id_articulo']]);

            // Registrar movimiento de stock
            $stmt = $pdo->prepare('
                SELECT stock FROM articulos WHERE id = ?
            ');
            $stmt->execute([$item['id_articulo']]);
            $nuevo_stock = $stmt->fetch()['stock'];

            $stmt = $pdo->prepare('
                INSERT INTO movimiento_stock (id_articulo, cantidad_nueva, tipo_movimiento, motivo)
                VALUES (?, ?, ?, ?)
            ');
            $stmt->execute([
                $item['id_articulo'],
                $nuevo_stock,
                'salida',
                'Venta - Pedido #' . $numero_pedido
            ]);
        }

        // Limpiar carrito
        $stmt = $pdo->prepare('DELETE FROM carrito_sesion WHERE id_usuario = ?');
        $stmt->execute([$input['id_usuario']]);

        // Crear notificación
        $stmt = $pdo->prepare('
            INSERT INTO notificaciones (id_usuario, tipo, asunto, contenido)
            VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([
            $input['id_usuario'],
            'pedido',
            'Pedido confirmado: ' . $numero_pedido,
            'Tu pedido #' . $numero_pedido . ' ha sido confirmado por $' . $total
        ]);

        // Confirmar transacción
        $pdo->commit();

        registrarLog('PEDIDO_CREADO', $input['id_usuario'], 'Pedido #' . $numero_pedido . ' creado por $' . $total);

        echo json_encode([
            'success' => true,
            'mensaje' => 'Pedido creado exitosamente',
            'datos' => [
                'id_pedido' => $id_pedido,
                'numero_pedido' => $numero_pedido,
                'total' => $total,
                'estado' => 'confirmado'
            ]
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al crear pedido',
            'debug' => $e->getMessage()
        ]);
    }
}

function obtenerPedidos() {
    global $pdo;

    $id_usuario = isset($_GET['id_usuario']) ? $_GET['id_usuario'] : null;

    if (!$id_usuario) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'ID de usuario requerido'
        ]);
        return;
    }

    try {
        $stmt = $pdo->prepare('
            SELECT id, numero_pedido, fecha_pedido, estado, total, fecha_entrega_estimada
            FROM pedidos
            WHERE id_usuario = ?
            ORDER BY fecha_pedido DESC
        ');
        $stmt->execute([$id_usuario]);
        $pedidos = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'datos' => $pedidos
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al obtener pedidos'
        ]);
    }
}

function obtenerPedidoById() {
    global $pdo;

    $id = isset($_GET['id']) ? $_GET['id'] : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'ID de pedido requerido'
        ]);
        return;
    }

    try {
        $stmt = $pdo->prepare('
            SELECT * FROM pedidos WHERE id = ?
        ');
        $stmt->execute([$id]);
        $pedido = $stmt->fetch();

        if (!$pedido) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'mensaje' => 'Pedido no encontrado'
            ]);
            return;
        }

        // Obtener detalles
        $stmt = $pdo->prepare('
            SELECT dp.*, a.nombre 
            FROM detalle_pedido dp
            JOIN articulos a ON dp.id_articulo = a.id
            WHERE dp.id_pedido = ?
        ');
        $stmt->execute([$id]);
        $detalles = $stmt->fetchAll();

        $pedido['detalles'] = $detalles;

        echo json_encode([
            'success' => true,
            'datos' => $pedido
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al obtener pedido'
        ]);
    }
}

// ========================================
// FUNCIONES DE USUARIO
// ========================================

function obtenerPerfil() {
    global $pdo;

    $id = isset($_GET['id']) ? $_GET['id'] : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'ID de usuario requerido'
        ]);
        return;
    }

    try {
        $stmt = $pdo->prepare('
            SELECT id, nombre, apellidos, email, rol, genero, fecha_nacimiento, 
                   direccion, pais, telefono, notificaciones, revista_digital, estado, fecha_registro
            FROM usuarios
            WHERE id = ?
        ');
        $stmt->execute([$id]);
        $usuario = $stmt->fetch();

        if (!$usuario) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'mensaje' => 'Usuario no encontrado'
            ]);
            return;
        }

        echo json_encode([
            'success' => true,
            'datos' => $usuario
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al obtener perfil'
        ]);
    }
}

function actualizarPerfil() {
    global $pdo;

    $input = json_decode(file_get_contents('php://input'), true);
    $id = isset($_GET['id']) ? $_GET['id'] : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'ID de usuario requerido'
        ]);
        return;
    }

    try {
        $campos = [];
        $valores = [];

        // Campos permitidos para actualizar
        $permitidos = ['nombre', 'apellidos', 'telefono', 'direccion', 'pais', 'notificaciones'];

        foreach ($permitidos as $campo) {
            if (isset($input[$campo])) {
                $campos[] = $campo . ' = ?';
                $valores[] = $input[$campo];
            }
        }

        if (empty($campos)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'mensaje' => 'No hay campos para actualizar'
            ]);
            return;
        }

        $valores[] = $id;
        $query = 'UPDATE usuarios SET ' . implode(', ', $campos) . ' WHERE id = ?';

        $stmt = $pdo->prepare($query);
        $stmt->execute($valores);

        registrarLog('PERFIL_ACTUALIZADO', $id, 'Usuario actualizó su perfil');

        echo json_encode([
            'success' => true,
            'mensaje' => 'Perfil actualizado exitosamente'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al actualizar perfil'
        ]);
    }
}

// ========================================
// FUNCIONES DE OPINIONES
// ========================================

function crearOpinion() {
    global $pdo;

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id_usuario']) || empty($input['id_articulo']) || empty($input['calificacion'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Faltan campos requeridos'
        ]);
        return;
    }

    if ($input['calificacion'] < 1 || $input['calificacion'] > 5) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'La calificación debe estar entre 1 y 5'
        ]);
        return;
    }

    try {
        $stmt = $pdo->prepare('
            INSERT INTO opiniones (id_usuario, id_articulo, calificacion, comentario)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                calificacion = VALUES(calificacion),
                comentario = VALUES(comentario),
                estado = "pendiente",
                fecha_resena = NOW()
        ');

        $stmt->execute([
            $input['id_usuario'],
            $input['id_articulo'],
            $input['calificacion'],
            $input['comentario'] ?? null
        ]);

        echo json_encode([
            'success' => true,
            'mensaje' => 'Opinión registrada, pendiente de aprobación'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al crear opinión'
        ]);
    }
}

function obtenerOpiniones() {
    global $pdo;

    $id_articulo = isset($_GET['id_articulo']) ? $_GET['id_articulo'] : null;

    if (!$id_articulo) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'ID de artículo requerido'
        ]);
        return;
    }

    try {
        $stmt = $pdo->prepare('
            SELECT o.calificacion, o.comentario, o.fecha_resena, u.nombre, u.apellidos
            FROM opiniones o
            JOIN usuarios u ON o.id_usuario = u.id
            WHERE o.id_articulo = ? AND o.estado = "aprobada"
            ORDER BY o.fecha_resena DESC
        ');
        $stmt->execute([$id_articulo]);
        $opiniones = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'datos' => $opiniones
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Error al obtener opiniones'
        ]);
    }
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

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
            $_SERVER['REMOTE_ADDR'],
            $_SERVER['HTTP_USER_AGENT'] ?? 'N/A'
        ]);
    } catch (Exception $e) {
        // Silenciar errores en logs
    }
}

function crearSuscripcionRevista($id_usuario) {
    global $pdo;

    try {
        $mes = date('m');
        $anno = date('Y');

        $stmt = $pdo->prepare('
            INSERT INTO revista_digital (id_usuario, numero, mes, anno, fecha_envio, abierta)
            VALUES (?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 0)
        ');

        $stmt->execute([
            $id_usuario,
            1,
            $mes,
            $anno
        ]);
    } catch (Exception $e) {
        // Silenciar errores
    }
}

?>

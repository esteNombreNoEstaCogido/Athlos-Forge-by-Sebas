<?php
/**
 * API REST - Athlos Forge
 * Gestiona todas las peticiones de la plataforma
 * 
 * Autenticación: Sesiones PHP (cookies)
 * Roles: cliente (registro, carrito, pedidos) | administrador (todo)
 * Seguridad: PDO prepared statements, bcrypt passwords, AES tarjetas
 *
 * ENDPOINTS:
 * ── Autenticación ──
 * POST ?action=login              Iniciar sesión
 * POST ?action=register           Crear cuenta (actualiza BBDD)
 * POST ?action=logout             Cerrar sesión
 * GET  ?action=sesion             Estado de la sesión actual
 *
 * ── Productos / Categorías ──
 * GET  ?action=productos          Listar productos (filtro: ?categoria=)
 * GET  ?action=producto&id=       Producto por ID
 * GET  ?action=categorias         Listar categorías
 * GET  ?action=buscar&q=          Buscar artículos
 *
 * ── Carrito (requiere sesión - cliente) ──
 * POST ?action=carrito_agregar    Agregar al carrito (valida stock, duplicados)
 * GET  ?action=carrito_obtener    Ver carrito del usuario
 * POST ?action=carrito_eliminar   Eliminar item del carrito
 * POST ?action=carrito_actualizar Actualizar cantidad de un item
 *
 * ── Pedidos (requiere sesión - cliente) ──
 * POST ?action=crear_pedido       Finalizar compra (tarjeta, email confirmación)
 * GET  ?action=obtener_pedidos    Pedidos del usuario
 * GET  ?action=obtener_pedido&id= Detalle de un pedido
 *
 * ── Usuario (requiere sesión) ──
 * GET  ?action=perfil             Ver perfil
 * POST ?action=actualizar_perfil  Actualizar perfil
 *
 * ── Opiniones ──
 * POST ?action=crear_opinion      Crear opinión (requiere sesión)
 * GET  ?action=obtener_opiniones  Ver opiniones de un artículo
 *
 * ── Admin (requiere sesión - administrador) ──
 * GET  ?action=admin_usuarios     Listar todos los usuarios
 * POST ?action=admin_eliminar_usuario  Eliminar usuario
 * POST ?action=admin_reset_password   Resetear contraseña de usuario
 * POST ?action=admin_crear_articulo   Crear artículo
 * POST ?action=admin_editar_articulo  Editar artículo
 * POST ?action=admin_eliminar_articulo Eliminar artículo
 * POST ?action=admin_actualizar_stock Actualizar stock
 * GET  ?action=admin_pedidos      Ver todos los pedidos
 * POST ?action=admin_estado_pedido Cambiar estado de pedido
 */

header('Content-Type: application/json; charset=utf-8');

// CORS dinámico: permitir localhost con cualquier esquema/puerto
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = ['http://localhost', 'http://127.0.0.1', 'http://localhost:80', 'http://127.0.0.1:80'];
$is_localhost_with_port = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/', $origin);
if (in_array($origin, $allowed_origins) || $is_localhost_with_port) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: http://localhost');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

// Evitar que warnings/notices de PHP corrompan la respuesta JSON
error_reporting(0);
ini_set('display_errors', '0');

$action = isset($_GET['action']) ? $_GET['action'] : null;

switch ($action) {
    // ── Autenticación ──
    case 'login':           handleLogin(); break;
    case 'register':        handleRegister(); break;
    case 'logout':          handleLogout(); break;
    case 'sesion':          handleSesion(); break;

    // ── Productos ──
    case 'productos':       getProductos(); break;
    case 'producto':        getProductoById(); break;
    case 'categorias':      getCategorias(); break;
    case 'buscar':          buscarArticulos(); break;

    // ── Carrito ──
    case 'carrito_agregar':     agregarAlCarrito(); break;
    case 'carrito_obtener':     obtenerCarrito(); break;
    case 'carrito_eliminar':    eliminarDelCarrito(); break;
    case 'carrito_actualizar':  actualizarCantidadCarrito(); break;

    // ── Pedidos ──
    case 'crear_pedido':    crearPedido(); break;
    case 'obtener_pedidos': obtenerPedidos(); break;
    case 'obtener_pedido':  obtenerPedidoById(); break;

    // ── Usuario ──
    case 'perfil':          obtenerPerfil(); break;
    case 'actualizar_perfil': actualizarPerfil(); break;

    // ── Opiniones ──
    case 'crear_opinion':       crearOpinion(); break;
    case 'obtener_opiniones':   obtenerOpiniones(); break;

    // ── Admin ──
    case 'admin_usuarios':          adminListarUsuarios(); break;
    case 'admin_eliminar_usuario':  adminEliminarUsuario(); break;
    case 'admin_reset_password':    adminResetPassword(); break;
    case 'admin_crear_articulo':    adminCrearArticulo(); break;
    case 'admin_editar_articulo':   adminEditarArticulo(); break;
    case 'admin_eliminar_articulo': adminEliminarArticulo(); break;
    case 'admin_actualizar_stock':  adminActualizarStock(); break;
    case 'admin_pedidos':           adminListarPedidos(); break;
    case 'admin_estado_pedido':     adminCambiarEstadoPedido(); break;

    default:
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'mensaje' => 'Acción no válida: ' . htmlspecialchars($action ?? 'ninguna')
        ]);
        break;
}

// ====================================================
// AUTENTICACIÓN
// ====================================================

function handleLogin() {
    global $pdo;

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['email']) || empty($input['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'Email y contraseña son requeridos']);
        return;
    }

    try {
        $stmt = $pdo->prepare('SELECT id, nombre, apellidos, email, password, rol, estado FROM usuarios WHERE email = ?');
        $stmt->execute([$input['email']]);
        $usuario = $stmt->fetch();

        if (!$usuario || !verifyPassword($input['password'], $usuario['password'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'mensaje' => 'Credenciales inválidas']);
            return;
        }

        if ($usuario['estado'] !== 'activo') {
            http_response_code(403);
            echo json_encode(['success' => false, 'mensaje' => 'Tu cuenta está ' . $usuario['estado']]);
            return;
        }

        // Iniciar sesión PHP
        iniciarSesion($usuario);
        registrarLog('LOGIN_EXITOSO', $usuario['id'], 'Usuario ' . $usuario['email'] . ' inició sesión');

        echo json_encode([
            'success' => true,
            'mensaje' => 'Inicio de sesión exitoso',
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
        echo json_encode(['success' => false, 'mensaje' => 'Error al procesar la solicitud']);
    }
}

function handleRegister() {
    global $pdo;

    $input = json_decode(file_get_contents('php://input'), true);

    // Validar campos obligatorios
    $campos_requeridos = ['nombre', 'email', 'password'];
    foreach ($campos_requeridos as $campo) {
        if (empty($input[$campo])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'mensaje' => "El campo '$campo' es requerido"]);
            return;
        }
    }

    // Validar email
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'Email inválido']);
        return;
    }

    // Validar contraseña fuerte
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/', $input['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'La contraseña debe tener mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo']);
        return;
    }

    try {
        // Verificar email duplicado
        $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
        $stmt->execute([$input['email']]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'mensaje' => 'El email ya está registrado']);
            return;
        }

        // Hash de contraseña (bcrypt)
        $password_hash = hashPassword($input['password']);

        // Cifrar tarjeta de crédito (AES-256-CBC) si se proporcionó
        $tarjeta_cifrada = null;
        if (!empty($input['tarjeta'])) {
            $tarjeta_cifrada = encriptarTarjeta($input['tarjeta']);
        }

        // Insertar usuario en la BBDD
        $stmt = $pdo->prepare('
            INSERT INTO usuarios 
            (nombre, apellidos, email, password, rol, genero, fecha_nacimiento, 
             direccion, pais, tarjeta_credito, telefono, notificaciones, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            htmlspecialchars($input['nombre']),
            htmlspecialchars($input['apellidos'] ?? ''),
            $input['email'],
            $password_hash,
            'cliente',
            !empty($input['genero']) ? $input['genero'] : null,
            !empty($input['fecha_nacimiento']) ? $input['fecha_nacimiento'] : (!empty($input['nacimiento']) ? $input['nacimiento'] : null),
            !empty($input['direccion']) ? htmlspecialchars($input['direccion']) : null,
            !empty($input['pais']) ? htmlspecialchars($input['pais']) : null,
            $tarjeta_cifrada,
            $input['telefono'] ?? null,
            !empty($input['notificaciones']) ? 1 : 0,
            'activo'
        ]);

        $user_id = $pdo->lastInsertId();

        // Iniciar sesión automáticamente tras registro
        $nuevo_usuario = [
            'id' => $user_id,
            'nombre' => $input['nombre'],
            'email' => $input['email'],
            'rol' => 'cliente'
        ];
        iniciarSesion($nuevo_usuario);

        registrarLog('REGISTRO_EXITOSO', $user_id, 'Nuevo usuario: ' . $input['email']);

        echo json_encode([
            'success' => true,
            'mensaje' => 'Registro exitoso. Sesión iniciada.',
            'usuario' => [
                'id' => $user_id,
                'nombre' => $input['nombre'],
                'apellidos' => $input['apellidos'] ?? '',
                'email' => $input['email'],
                'rol' => 'cliente'
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al registrar']);
    }
}

function handleLogout() {
    $usuario = getUsuarioSesion();
    if ($usuario) {
        registrarLog('LOGOUT', $usuario['id'], 'Sesión cerrada');
    }
    cerrarSesion();
    echo json_encode(['success' => true, 'mensaje' => 'Sesión cerrada correctamente']);
}

function handleSesion() {
    $usuario = getUsuarioSesion();
    if ($usuario) {
        echo json_encode(['success' => true, 'autenticado' => true, 'usuario' => $usuario]);
    } else {
        echo json_encode(['success' => true, 'autenticado' => false]);
    }
}

// ====================================================
// PRODUCTOS / CATEGORÍAS
// ====================================================

function getProductos() {
    global $pdo;

    $categoria = isset($_GET['categoria']) ? (int)$_GET['categoria'] : null;
    $query = 'SELECT id, nombre, descripcion, precio, stock, id_categoria, imagen_url, disponible FROM articulos WHERE disponible = TRUE';
    $params = [];

    if ($categoria) {
        $query .= ' AND id_categoria = ?';
        $params[] = $categoria;
    }
    $query .= ' ORDER BY nombre ASC';

    try {
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'datos' => $stmt->fetchAll()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al obtener productos']);
    }
}

function getProductoById() {
    global $pdo;
    $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'ID de producto requerido']);
        return;
    }

    try {
        $stmt = $pdo->prepare('
            SELECT a.*, c.nombre as categoria_nombre 
            FROM articulos a
            LEFT JOIN categorias c ON a.id_categoria = c.id
            WHERE a.id = ?
        ');
        $stmt->execute([$id]);
        $producto = $stmt->fetch();

        if (!$producto) {
            http_response_code(404);
            echo json_encode(['success' => false, 'mensaje' => 'Producto no encontrado. Este artículo no existe en nuestro catálogo.']);
            return;
        }

        echo json_encode(['success' => true, 'datos' => $producto]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al obtener producto']);
    }
}

function getCategorias() {
    global $pdo;
    try {
        $stmt = $pdo->query('SELECT id, nombre, descripcion, imagen_url FROM categorias ORDER BY nombre ASC');
        echo json_encode(['success' => true, 'datos' => $stmt->fetchAll()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al obtener categorías']);
    }
}

function buscarArticulos() {
    global $pdo;
    $termino = isset($_GET['q']) ? $_GET['q'] : '';

    if (strlen($termino) < 2) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'El término debe tener al menos 2 caracteres']);
        return;
    }

    try {
        $busqueda = '%' . $termino . '%';
        $stmt = $pdo->prepare('
            SELECT a.id, a.nombre, a.descripcion, a.precio, a.stock, a.id_categoria, 
                   a.imagen_url, a.disponible, c.nombre as categoria_nombre
            FROM articulos a
            LEFT JOIN categorias c ON a.id_categoria = c.id
            WHERE a.disponible = TRUE AND (a.nombre LIKE ? OR a.descripcion LIKE ?)
            ORDER BY a.nombre ASC
        ');
        $stmt->execute([$busqueda, $busqueda]);
        $resultados = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'total' => count($resultados),
            'termino' => htmlspecialchars($termino),
            'datos' => $resultados
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al buscar']);
    }
}

// ====================================================
// CARRITO DE COMPRAS (con validaciones de stock, duplicados, totales)
// ====================================================

function agregarAlCarrito() {
    global $pdo;
    $usuario = requiereAutenticacion();
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id_articulo'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'ID de artículo requerido']);
        return;
    }

    $id_articulo = (int)$input['id_articulo'];
    $cantidad = isset($input['cantidad']) ? max(1, (int)$input['cantidad']) : 1;

    try {
        // 1. Verificar que el artículo EXISTE
        $stmt = $pdo->prepare('SELECT id, nombre, precio, stock, disponible FROM articulos WHERE id = ?');
        $stmt->execute([$id_articulo]);
        $articulo = $stmt->fetch();

        if (!$articulo) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'mensaje' => 'El producto no existe. Verifica el artículo e inténtalo de nuevo.',
                'tipo_error' => 'producto_inexistente'
            ]);
            return;
        }

        // 2. Verificar que está DISPONIBLE
        if (!$articulo['disponible']) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'mensaje' => 'El producto "' . $articulo['nombre'] . '" no está disponible actualmente.',
                'tipo_error' => 'no_disponible'
            ]);
            return;
        }

        // 3. Verificar STOCK
        if ($articulo['stock'] <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'mensaje' => 'El producto "' . $articulo['nombre'] . '" está agotado (sin stock).',
                'tipo_error' => 'sin_stock'
            ]);
            return;
        }

        // 4. Verificar si ya existe en el CARRITO (duplicado)
        $stmt = $pdo->prepare('SELECT id, cantidad FROM carrito_sesion WHERE id_usuario = ? AND id_articulo = ?');
        $stmt->execute([$usuario['id'], $id_articulo]);
        $existente = $stmt->fetch();

        if ($existente) {
            // Actualizar cantidad si ya existe
            $nueva_cantidad = $existente['cantidad'] + $cantidad;

            // Verificar stock para la nueva cantidad total
            if ($nueva_cantidad > $articulo['stock']) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'mensaje' => 'Stock insuficiente para "' . $articulo['nombre'] . '". ' .
                                 'Ya tienes ' . $existente['cantidad'] . ' en el carrito. ' .
                                 'Stock disponible: ' . $articulo['stock'],
                    'tipo_error' => 'stock_insuficiente'
                ]);
                return;
            }

            $stmt = $pdo->prepare('UPDATE carrito_sesion SET cantidad = ?, precio_unitario = ? WHERE id = ?');
            $stmt->execute([$nueva_cantidad, $articulo['precio'], $existente['id']]);

            echo json_encode([
                'success' => true,
                'mensaje' => 'Cantidad actualizada para "' . $articulo['nombre'] . '" (' . $nueva_cantidad . ' uds.)',
                'duplicado' => true
            ]);
            return;
        }

        // 5. Verificar stock disponible para la cantidad solicitada
        if ($cantidad > $articulo['stock']) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'mensaje' => 'Stock insuficiente para "' . $articulo['nombre'] . '". ' .
                             'Stock disponible: ' . $articulo['stock'] . '. Solicitado: ' . $cantidad,
                'tipo_error' => 'stock_insuficiente'
            ]);
            return;
        }

        // 6. Agregar al carrito
        $stmt = $pdo->prepare('
            INSERT INTO carrito_sesion (id_usuario, id_articulo, cantidad, precio_unitario)
            VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([$usuario['id'], $id_articulo, $cantidad, $articulo['precio']]);

        echo json_encode([
            'success' => true,
            'mensaje' => '"' . $articulo['nombre'] . '" añadido al carrito correctamente'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al agregar al carrito']);
    }
}

function obtenerCarrito() {
    global $pdo;
    $usuario = requiereAutenticacion();

    try {
        $stmt = $pdo->prepare('
            SELECT 
                cs.id,
                a.id as id_articulo,
                a.nombre,
                a.descripcion,
                cs.cantidad,
                cs.precio_unitario,
                (cs.cantidad * cs.precio_unitario) as subtotal,
                a.stock,
                a.imagen_url
            FROM carrito_sesion cs
            JOIN articulos a ON cs.id_articulo = a.id
            WHERE cs.id_usuario = ?
            ORDER BY cs.fecha_agregado DESC
        ');
        $stmt->execute([$usuario['id']]);
        $carrito = $stmt->fetchAll();

        $total = 0;
        $items_sin_stock = [];
        foreach ($carrito as &$item) {
            $total += $item['subtotal'];
            // Marcar items con problemas de stock
            if ($item['cantidad'] > $item['stock']) {
                $item['aviso_stock'] = 'Solo quedan ' . $item['stock'] . ' unidades disponibles';
                $items_sin_stock[] = $item['nombre'];
            }
        }

        echo json_encode([
            'success' => true,
            'datos' => $carrito,
            'total' => round($total, 2),
            'num_items' => count($carrito),
            'avisos' => $items_sin_stock
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al obtener carrito']);
    }
}

function eliminarDelCarrito() {
    global $pdo;
    $usuario = requiereAutenticacion();
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'ID del item requerido']);
        return;
    }

    try {
        // Verificar que el item pertenece al usuario
        $stmt = $pdo->prepare('DELETE FROM carrito_sesion WHERE id = ? AND id_usuario = ?');
        $stmt->execute([(int)$input['id'], $usuario['id']]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'mensaje' => 'Item no encontrado en tu carrito']);
            return;
        }

        echo json_encode(['success' => true, 'mensaje' => 'Item eliminado del carrito']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al eliminar del carrito']);
    }
}

function actualizarCantidadCarrito() {
    global $pdo;
    $usuario = requiereAutenticacion();
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id']) || !isset($input['cantidad'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'ID del item y cantidad requeridos']);
        return;
    }

    $cantidad = max(1, (int)$input['cantidad']);

    try {
        // Obtener item y verificar stock
        $stmt = $pdo->prepare('
            SELECT cs.id, a.stock, a.nombre 
            FROM carrito_sesion cs 
            JOIN articulos a ON cs.id_articulo = a.id 
            WHERE cs.id = ? AND cs.id_usuario = ?
        ');
        $stmt->execute([(int)$input['id'], $usuario['id']]);
        $item = $stmt->fetch();

        if (!$item) {
            http_response_code(404);
            echo json_encode(['success' => false, 'mensaje' => 'Item no encontrado en tu carrito']);
            return;
        }

        if ($cantidad > $item['stock']) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'mensaje' => 'Stock insuficiente para "' . $item['nombre'] . '". Máximo disponible: ' . $item['stock'],
                'tipo_error' => 'stock_insuficiente'
            ]);
            return;
        }

        $stmt = $pdo->prepare('UPDATE carrito_sesion SET cantidad = ? WHERE id = ? AND id_usuario = ?');
        $stmt->execute([$cantidad, (int)$input['id'], $usuario['id']]);

        echo json_encode(['success' => true, 'mensaje' => 'Cantidad actualizada']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al actualizar cantidad']);
    }
}

// ====================================================
// PEDIDOS (Checkout con tarjeta + email confirmación)
// ====================================================

function crearPedido() {
    global $pdo;
    $usuario = requiereAutenticacion();
    $input = json_decode(file_get_contents('php://input'), true);

    try {
        $pdo->beginTransaction();

        // 1. Obtener carrito del usuario
        $stmt = $pdo->prepare('
            SELECT cs.id, cs.id_articulo, cs.cantidad, cs.precio_unitario, 
                   a.nombre, a.stock, a.disponible
            FROM carrito_sesion cs
            JOIN articulos a ON cs.id_articulo = a.id
            WHERE cs.id_usuario = ?
        ');
        $stmt->execute([$usuario['id']]);
        $carrito = $stmt->fetchAll();

        if (empty($carrito)) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['success' => false, 'mensaje' => 'El carrito está vacío']);
            return;
        }

        // 2. Validar stock de TODOS los items antes de procesar
        $errores_stock = [];
        $total = 0;
        foreach ($carrito as $item) {
            if (!$item['disponible']) {
                $errores_stock[] = '"' . $item['nombre'] . '" ya no está disponible';
            } elseif ($item['cantidad'] > $item['stock']) {
                $errores_stock[] = '"' . $item['nombre'] . '": stock insuficiente (quedan ' . $item['stock'] . ')';
            }
            $total += $item['cantidad'] * $item['precio_unitario'];
        }

        if (!empty($errores_stock)) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'mensaje' => 'No se puede completar el pedido. Problemas de stock:',
                'errores' => $errores_stock,
                'tipo_error' => 'stock_insuficiente'
            ]);
            return;
        }

        // 3. Verificar tarjeta de crédito
        // Primero intentar con la tarjeta proporcionada en el pedido
        $tarjeta_para_pago = null;
        if (!empty($input['tarjeta'])) {
            // Validar formato básico
            $tarjeta_limpia = preg_replace('/[\s\-]/', '', $input['tarjeta']);
            if (!preg_match('/^\d{13,19}$/', $tarjeta_limpia)) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(['success' => false, 'mensaje' => 'Número de tarjeta de crédito inválido']);
                return;
            }
            $tarjeta_para_pago = $tarjeta_limpia;

            // Guardar/actualizar tarjeta cifrada en el perfil del usuario
            $tarjeta_cifrada = encriptarTarjeta($tarjeta_limpia);
            $stmt = $pdo->prepare('UPDATE usuarios SET tarjeta_credito = ? WHERE id = ?');
            $stmt->execute([$tarjeta_cifrada, $usuario['id']]);
        } else {
            // Usar tarjeta guardada en el perfil
            $stmt = $pdo->prepare('SELECT tarjeta_credito FROM usuarios WHERE id = ?');
            $stmt->execute([$usuario['id']]);
            $user_data = $stmt->fetch();

            if (empty($user_data['tarjeta_credito'])) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'mensaje' => 'Se requiere una tarjeta de crédito para finalizar la compra. Proporciona una tarjeta o añádela en tu perfil.'
                ]);
                return;
            }
            $tarjeta_para_pago = descifrarTarjetaCompleta($user_data['tarjeta_credito']);
        }

        // 4. Crear el pedido
        $numero_pedido = 'PED-' . date('YmdHis') . '-' . $usuario['id'];
        $fecha_entrega = date('Y-m-d', strtotime('+7 days'));
        $direccion_envio = $input['direccion_envio'] ?? null;

        // Si no se proporcionó dirección de envío, usar la del perfil
        if (empty($direccion_envio)) {
            $stmt = $pdo->prepare('SELECT direccion FROM usuarios WHERE id = ?');
            $stmt->execute([$usuario['id']]);
            $perfil = $stmt->fetch();
            $direccion_envio = $perfil['direccion'];
        }

        $stmt = $pdo->prepare('
            INSERT INTO pedidos (id_usuario, numero_pedido, total, estado, direccion_envio, fecha_entrega_estimada)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$usuario['id'], $numero_pedido, $total, 'confirmado', $direccion_envio, $fecha_entrega]);
        $id_pedido = $pdo->lastInsertId();

        // 5. Crear detalles del pedido y actualizar stock
        $detalles_email = [];
        foreach ($carrito as $item) {
            $subtotal = $item['cantidad'] * $item['precio_unitario'];

            $stmt = $pdo->prepare('
                INSERT INTO detalle_pedido (id_pedido, id_articulo, cantidad, precio_unitario, subtotal)
                VALUES (?, ?, ?, ?, ?)
            ');
            $stmt->execute([$id_pedido, $item['id_articulo'], $item['cantidad'], $item['precio_unitario'], $subtotal]);

            // Actualizar stock
            $stmt = $pdo->prepare('UPDATE articulos SET stock = stock - ? WHERE id = ? AND stock >= ?');
            $stmt->execute([$item['cantidad'], $item['id_articulo'], $item['cantidad']]);

            // Registrar movimiento de stock
            $stmt = $pdo->prepare('SELECT stock FROM articulos WHERE id = ?');
            $stmt->execute([$item['id_articulo']]);
            $nuevo_stock = $stmt->fetchColumn();

            $stmt = $pdo->prepare('
                INSERT INTO movimiento_stock (id_articulo, cantidad_anterior, cantidad_nueva, tipo_movimiento, motivo, usuario_responsable)
                VALUES (?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $item['id_articulo'],
                $item['stock'],
                $nuevo_stock,
                'salida',
                'Venta - Pedido #' . $numero_pedido,
                $usuario['id']
            ]);

            $detalles_email[] = [
                'nombre' => $item['nombre'],
                'cantidad' => $item['cantidad'],
                'precio' => $item['precio_unitario'],
                'subtotal' => $subtotal
            ];
        }

        // 6. Limpiar carrito
        $stmt = $pdo->prepare('DELETE FROM carrito_sesion WHERE id_usuario = ?');
        $stmt->execute([$usuario['id']]);

        // 7. Crear notificación en BD
        $stmt = $pdo->prepare('
            INSERT INTO notificaciones (id_usuario, tipo, asunto, contenido)
            VALUES (?, ?, ?, ?)
        ');
        $contenido_notif = 'Pedido #' . $numero_pedido . ' confirmado. Total: ' . number_format($total, 2) . '€. Entrega estimada: ' . $fecha_entrega;
        $stmt->execute([$usuario['id'], 'pedido', 'Pedido confirmado: ' . $numero_pedido, $contenido_notif]);

        $pdo->commit();

        // 8. Enviar email de confirmación
        $tarjeta_enmascarada = '**** **** **** ' . substr($tarjeta_para_pago, -4);
        $email_enviado = enviarEmailConfirmacion(
            $usuario['email'],
            $usuario['nombre'],
            $numero_pedido,
            $detalles_email,
            $total,
            $fecha_entrega,
            $direccion_envio,
            $tarjeta_enmascarada
        );

        registrarLog('PEDIDO_CREADO', $usuario['id'], 'Pedido #' . $numero_pedido . ' por ' . number_format($total, 2) . '€');

        echo json_encode([
            'success' => true,
            'mensaje' => 'Pedido creado exitosamente. Se ha enviado un correo de confirmación.',
            'datos' => [
                'id_pedido' => $id_pedido,
                'numero_pedido' => $numero_pedido,
                'total' => round($total, 2),
                'estado' => 'confirmado',
                'fecha_entrega_estimada' => $fecha_entrega,
                'email_enviado' => $email_enviado,
                'tarjeta_usada' => $tarjeta_enmascarada
            ]
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al crear pedido']);
    }
}

/**
 * Enviar correo electrónico de confirmación de compra
 */
function enviarEmailConfirmacion($email, $nombre, $numero_pedido, $detalles, $total, $fecha_entrega, $direccion, $tarjeta_enmascarada) {
    $asunto = 'Athlos Forge - Confirmación de Pedido #' . $numero_pedido;

    // Construir tabla de productos
    $tabla_items = '';
    foreach ($detalles as $d) {
        $tabla_items .= '<tr>
            <td style="padding:8px;border-bottom:1px solid #ddd;">' . htmlspecialchars($d['nombre']) . '</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;text-align:center;">' . $d['cantidad'] . '</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">' . number_format($d['precio'], 2) . '€</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">' . number_format($d['subtotal'], 2) . '€</td>
        </tr>';
    }

    $cuerpo = '
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;background:#1a1a1a;color:#fff;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#2d2d2d;border-radius:10px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#D4AF37,#B8860B);padding:20px;text-align:center;">
                <h1 style="margin:0;color:#1a1a1a;">ATHLOS FORGE</h1>
                <p style="margin:5px 0 0;color:#1a1a1a;">Confirmación de Pedido</p>
            </div>
            <div style="padding:20px;">
                <p>Hola <strong>' . htmlspecialchars($nombre) . '</strong>,</p>
                <p>Tu pedido ha sido confirmado correctamente. Aquí tienes los detalles:</p>

                <div style="background:#3a3a3a;padding:15px;border-radius:5px;margin:15px 0;">
                    <p><strong>Nº Pedido:</strong> ' . $numero_pedido . '</p>
                    <p><strong>Fecha:</strong> ' . date('d/m/Y H:i') . '</p>
                    <p><strong>Tarjeta:</strong> ' . $tarjeta_enmascarada . '</p>
                </div>

                <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                    <thead>
                        <tr style="background:#D4AF37;color:#1a1a1a;">
                            <th style="padding:10px;text-align:left;">Producto</th>
                            <th style="padding:10px;text-align:center;">Cant.</th>
                            <th style="padding:10px;text-align:right;">Precio</th>
                            <th style="padding:10px;text-align:right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>' . $tabla_items . '</tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding:10px;text-align:right;font-weight:bold;color:#D4AF37;">TOTAL:</td>
                            <td style="padding:10px;text-align:right;font-weight:bold;color:#D4AF37;">' . number_format($total, 2) . '€</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="background:#3a3a3a;padding:15px;border-radius:5px;margin:15px 0;">
                    <p style="color:#D4AF37;font-weight:bold;">📦 Información de Envío</p>
                    <p><strong>Dirección:</strong> ' . htmlspecialchars($direccion) . '</p>
                    <p><strong>Fecha de entrega estimada:</strong> <span style="color:#D4AF37;font-size:1.1em;">' . date('d/m/Y', strtotime($fecha_entrega)) . '</span></p>
                </div>

                <p style="text-align:center;margin-top:20px;color:#aaa;font-size:0.9em;">
                    Gracias por confiar en Athlos Forge. ¡Nos vemos en la forja!
                </p>
            </div>
        </div>
    </body>
    </html>';

    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Athlos Forge <noreply@athlosforge.com>\r\n";

    return @mail($email, $asunto, $cuerpo, $headers);
}

function obtenerPedidos() {
    global $pdo;
    $usuario = requiereAutenticacion();

    try {
        $stmt = $pdo->prepare('
            SELECT id, numero_pedido, fecha_pedido, estado, total, fecha_entrega_estimada, direccion_envio
            FROM pedidos
            WHERE id_usuario = ?
            ORDER BY fecha_pedido DESC
        ');
        $stmt->execute([$usuario['id']]);
        echo json_encode(['success' => true, 'datos' => $stmt->fetchAll()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al obtener pedidos']);
    }
}

function obtenerPedidoById() {
    global $pdo;
    $usuario = requiereAutenticacion();
    $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'ID de pedido requerido']);
        return;
    }

    try {
        // El usuario solo puede ver sus propios pedidos (admin puede ver todos)
        $query = 'SELECT * FROM pedidos WHERE id = ?';
        $params = [$id];
        if ($usuario['rol'] !== 'administrador') {
            $query .= ' AND id_usuario = ?';
            $params[] = $usuario['id'];
        }

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $pedido = $stmt->fetch();

        if (!$pedido) {
            http_response_code(404);
            echo json_encode(['success' => false, 'mensaje' => 'Pedido no encontrado']);
            return;
        }

        // Detalles
        $stmt = $pdo->prepare('
            SELECT dp.*, a.nombre, a.imagen_url
            FROM detalle_pedido dp
            JOIN articulos a ON dp.id_articulo = a.id
            WHERE dp.id_pedido = ?
        ');
        $stmt->execute([$id]);
        $pedido['detalles'] = $stmt->fetchAll();

        echo json_encode(['success' => true, 'datos' => $pedido]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al obtener pedido']);
    }
}

// ====================================================
// USUARIO / PERFIL
// ====================================================

function obtenerPerfil() {
    global $pdo;
    $usuario = requiereAutenticacion();

    try {
        $stmt = $pdo->prepare('
            SELECT id, nombre, apellidos, email, rol, genero, fecha_nacimiento, 
                   direccion, pais, telefono, tarjeta_credito, notificaciones, estado, fecha_registro
            FROM usuarios WHERE id = ?
        ');
        $stmt->execute([$usuario['id']]);
        $perfil = $stmt->fetch();

        if (!$perfil) {
            http_response_code(404);
            echo json_encode(['success' => false, 'mensaje' => 'Usuario no encontrado']);
            return;
        }

        // Descifrar tarjeta para mostrar enmascarada
        $perfil['tarjeta_credito'] = descifrarTarjeta($perfil['tarjeta_credito']);

        echo json_encode(['success' => true, 'datos' => $perfil]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al obtener perfil']);
    }
}

function actualizarPerfil() {
    global $pdo;
    $usuario = requiereAutenticacion();
    $input = json_decode(file_get_contents('php://input'), true);

    try {
        $campos = [];
        $valores = [];

        $permitidos = ['nombre', 'apellidos', 'telefono', 'direccion', 'pais', 'notificaciones'];
        foreach ($permitidos as $campo) {
            if (isset($input[$campo])) {
                $campos[] = $campo . ' = ?';
                $valores[] = $input[$campo];
            }
        }

        // Actualizar tarjeta si se proporciona (cifrar)
        if (isset($input['tarjeta']) && !empty($input['tarjeta'])) {
            $campos[] = 'tarjeta_credito = ?';
            $valores[] = encriptarTarjeta($input['tarjeta']);
        }

        if (empty($campos)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'mensaje' => 'No hay campos para actualizar']);
            return;
        }

        $valores[] = $usuario['id'];
        $query = 'UPDATE usuarios SET ' . implode(', ', $campos) . ' WHERE id = ?';
        $pdo->prepare($query)->execute($valores);

        registrarLog('PERFIL_ACTUALIZADO', $usuario['id'], 'Perfil actualizado');
        echo json_encode(['success' => true, 'mensaje' => 'Perfil actualizado']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al actualizar perfil']);
    }
}

// ====================================================
// OPINIONES
// ====================================================

function crearOpinion() {
    global $pdo;
    $usuario = requiereAutenticacion();
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id_articulo']) || empty($input['calificacion'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'Artículo y calificación requeridos']);
        return;
    }

    $calificacion = (int)$input['calificacion'];
    if ($calificacion < 1 || $calificacion > 5) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'La calificación debe estar entre 1 y 5']);
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
        $stmt->execute([$usuario['id'], (int)$input['id_articulo'], $calificacion, $input['comentario'] ?? null]);

        echo json_encode(['success' => true, 'mensaje' => 'Opinión registrada, pendiente de aprobación']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al crear opinión']);
    }
}

function obtenerOpiniones() {
    global $pdo;
    $id_articulo = isset($_GET['id_articulo']) ? (int)$_GET['id_articulo'] : null;

    if (!$id_articulo) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'ID de artículo requerido']);
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
        echo json_encode(['success' => true, 'datos' => $stmt->fetchAll()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al obtener opiniones']);
    }
}

// ====================================================
// ADMINISTRACIÓN (requiere rol administrador)
// ====================================================

function adminListarUsuarios() {
    global $pdo;
    requiereAdmin();

    try {
        $stmt = $pdo->query('
            SELECT id, nombre, apellidos, email, rol, genero, estado, 
                   fecha_registro, fecha_ultima_sesion 
            FROM usuarios 
            ORDER BY fecha_registro DESC
        ');
        echo json_encode(['success' => true, 'datos' => $stmt->fetchAll()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al listar usuarios']);
    }
}

function adminEliminarUsuario() {
    global $pdo;
    $admin = requiereAdmin();
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'ID de usuario requerido']);
        return;
    }

    $id = (int)$input['id'];

    // No permitir que el admin se elimine a sí mismo
    if ($id === (int)$admin['id']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'No puedes eliminar tu propia cuenta']);
        return;
    }

    try {
        // Verificar que el usuario existe
        $stmt = $pdo->prepare('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        $usuario = $stmt->fetch();

        if (!$usuario) {
            http_response_code(404);
            echo json_encode(['success' => false, 'mensaje' => 'Usuario no encontrado']);
            return;
        }

        // Eliminar usuario (CASCADE borrará sesiones, carrito, etc.)
        $stmt = $pdo->prepare('DELETE FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);

        registrarLog('USUARIO_ELIMINADO', $admin['id'], 'Usuario eliminado: ' . $usuario['email'] . ' (ID: ' . $id . ')');
        echo json_encode(['success' => true, 'mensaje' => 'Usuario "' . $usuario['nombre'] . '" eliminado correctamente']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al eliminar usuario']);
    }
}

function adminResetPassword() {
    global $pdo;
    $admin = requiereAdmin();
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id']) || empty($input['nueva_password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'ID de usuario y nueva contraseña son requeridos']);
        return;
    }

    $id = (int)$input['id'];
    $nueva_password = $input['nueva_password'];

    // Validar fortaleza de contraseña
    if (strlen($nueva_password) < 8 || !preg_match('/[a-z]/', $nueva_password) || !preg_match('/[A-Z]/', $nueva_password) || !preg_match('/[0-9]/', $nueva_password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número']);
        return;
    }

    try {
        $stmt = $pdo->prepare('SELECT id, nombre, email FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        $usuario = $stmt->fetch();

        if (!$usuario) {
            http_response_code(404);
            echo json_encode(['success' => false, 'mensaje' => 'Usuario no encontrado']);
            return;
        }

        $hash = hashPassword($nueva_password);
        $stmt = $pdo->prepare('UPDATE usuarios SET password = ? WHERE id = ?');
        $stmt->execute([$hash, $id]);

        registrarLog('PASSWORD_RESET', $admin['id'], 'Contraseña reseteada para: ' . $usuario['email'] . ' (ID: ' . $id . ')');
        echo json_encode(['success' => true, 'mensaje' => 'Contraseña de "' . $usuario['nombre'] . '" actualizada correctamente']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al resetear contraseña']);
    }
}

function adminCrearArticulo() {
    global $pdo;
    $admin = requiereAdmin();
    $input = json_decode(file_get_contents('php://input'), true);

    $requeridos = ['nombre', 'precio', 'stock', 'id_categoria'];
    foreach ($requeridos as $campo) {
        if (!isset($input[$campo])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'mensaje' => "Campo '$campo' requerido"]);
            return;
        }
    }

    try {
        $stmt = $pdo->prepare('
            INSERT INTO articulos (nombre, descripcion, precio, stock, id_categoria, imagen_url, disponible)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            htmlspecialchars($input['nombre']),
            $input['descripcion'] ?? null,
            (float)$input['precio'],
            (int)$input['stock'],
            (int)$input['id_categoria'],
            $input['imagen_url'] ?? null,
            $input['disponible'] ?? true
        ]);

        registrarLog('ARTICULO_CREADO', $admin['id'], 'Artículo creado: ' . $input['nombre']);
        echo json_encode(['success' => true, 'mensaje' => 'Artículo creado', 'id' => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al crear artículo']);
    }
}

function adminEditarArticulo() {
    global $pdo;
    $admin = requiereAdmin();
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'ID de artículo requerido']);
        return;
    }

    try {
        $campos = [];
        $valores = [];
        $permitidos = ['nombre', 'descripcion', 'precio', 'stock', 'id_categoria', 'imagen_url', 'disponible'];

        foreach ($permitidos as $campo) {
            if (isset($input[$campo])) {
                $campos[] = "$campo = ?";
                $valores[] = $input[$campo];
            }
        }

        if (empty($campos)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'mensaje' => 'No hay campos para actualizar']);
            return;
        }

        $valores[] = (int)$input['id'];
        $pdo->prepare('UPDATE articulos SET ' . implode(', ', $campos) . ' WHERE id = ?')->execute($valores);

        registrarLog('ARTICULO_EDITADO', $admin['id'], 'Artículo editado ID: ' . $input['id']);
        echo json_encode(['success' => true, 'mensaje' => 'Artículo actualizado']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al editar artículo']);
    }
}

function adminEliminarArticulo() {
    global $pdo;
    $admin = requiereAdmin();
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'ID de artículo requerido']);
        return;
    }

    try {
        // Soft delete: marcar como no disponible
        $stmt = $pdo->prepare('UPDATE articulos SET disponible = FALSE WHERE id = ?');
        $stmt->execute([(int)$input['id']]);

        registrarLog('ARTICULO_ELIMINADO', $admin['id'], 'Artículo desactivado ID: ' . $input['id']);
        echo json_encode(['success' => true, 'mensaje' => 'Artículo desactivado']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al eliminar artículo']);
    }
}

function adminActualizarStock() {
    global $pdo;
    $admin = requiereAdmin();
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id_articulo']) || !isset($input['cantidad'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'ID de artículo y cantidad requeridos']);
        return;
    }

    try {
        $stmt = $pdo->prepare('SELECT stock, nombre FROM articulos WHERE id = ?');
        $stmt->execute([(int)$input['id_articulo']]);
        $articulo = $stmt->fetch();

        if (!$articulo) {
            http_response_code(404);
            echo json_encode(['success' => false, 'mensaje' => 'Artículo no encontrado']);
            return;
        }

        $nuevo_stock = (int)$input['cantidad'];
        $stmt = $pdo->prepare('UPDATE articulos SET stock = ? WHERE id = ?');
        $stmt->execute([$nuevo_stock, (int)$input['id_articulo']]);

        // Registrar movimiento
        $tipo = $nuevo_stock > $articulo['stock'] ? 'entrada' : ($nuevo_stock < $articulo['stock'] ? 'salida' : 'ajuste');
        $stmt = $pdo->prepare('
            INSERT INTO movimiento_stock (id_articulo, cantidad_anterior, cantidad_nueva, tipo_movimiento, motivo, usuario_responsable)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            (int)$input['id_articulo'],
            $articulo['stock'],
            $nuevo_stock,
            $tipo,
            $input['motivo'] ?? 'Ajuste manual de stock',
            $admin['id']
        ]);

        registrarLog('STOCK_ACTUALIZADO', $admin['id'], $articulo['nombre'] . ': ' . $articulo['stock'] . ' → ' . $nuevo_stock);
        echo json_encode(['success' => true, 'mensaje' => 'Stock actualizado: ' . $articulo['stock'] . ' → ' . $nuevo_stock]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al actualizar stock']);
    }
}

function adminListarPedidos() {
    global $pdo;
    requiereAdmin();

    try {
        $stmt = $pdo->query('
            SELECT p.*, u.nombre, u.apellidos, u.email 
            FROM pedidos p
            JOIN usuarios u ON p.id_usuario = u.id
            ORDER BY p.fecha_pedido DESC
        ');
        echo json_encode(['success' => true, 'datos' => $stmt->fetchAll()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al listar pedidos']);
    }
}

function adminCambiarEstadoPedido() {
    global $pdo;
    $admin = requiereAdmin();
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id_pedido']) || empty($input['estado'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'ID de pedido y estado requeridos']);
        return;
    }

    $estados_validos = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'];
    if (!in_array($input['estado'], $estados_validos)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'mensaje' => 'Estado no válido. Opciones: ' . implode(', ', $estados_validos)]);
        return;
    }

    try {
        $stmt = $pdo->prepare('UPDATE pedidos SET estado = ? WHERE id = ?');
        $stmt->execute([$input['estado'], (int)$input['id_pedido']]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'mensaje' => 'Pedido no encontrado']);
            return;
        }

        // Si se cancela, restaurar stock
        if ($input['estado'] === 'cancelado') {
            $stmt = $pdo->prepare('
                SELECT id_articulo, cantidad FROM detalle_pedido WHERE id_pedido = ?
            ');
            $stmt->execute([(int)$input['id_pedido']]);
            $detalles = $stmt->fetchAll();

            foreach ($detalles as $d) {
                $pdo->prepare('UPDATE articulos SET stock = stock + ? WHERE id = ?')
                    ->execute([$d['cantidad'], $d['id_articulo']]);
            }
        }

        // Si se entrega, registrar fecha real
        if ($input['estado'] === 'entregado') {
            $pdo->prepare('UPDATE pedidos SET fecha_entrega_real = NOW() WHERE id = ?')
                ->execute([(int)$input['id_pedido']]);
        }

        registrarLog('PEDIDO_ESTADO', $admin['id'], 'Pedido #' . $input['id_pedido'] . ' → ' . $input['estado']);
        echo json_encode(['success' => true, 'mensaje' => 'Estado del pedido actualizado a: ' . $input['estado']]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al cambiar estado del pedido']);
    }
}

?>

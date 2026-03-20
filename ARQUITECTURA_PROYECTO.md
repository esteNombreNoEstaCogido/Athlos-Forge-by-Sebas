# 📚 Documentación de Archivos - Athlos Forge

**Guía de referencia rápida sobre qué hace cada archivo del proyecto**

---

## 📄 Archivos HTML (Páginas Principales)

### `index.html` - Página Principal
- **Propósito:** Landing page del proyecto
- **Contenido:**
  - Navbar (navegación, carrito flotante)
  - Hero section con propuesta de valor
  - Cards de servicios destacados
  - Footer
- **Funcionalidades:**
  - Check de login automático
  - Integración con carrito

### `login.html` - Autenticación
- **Propósito:** Gestión de acceso de usuarios
- **Formularios:**
  - Registro (email, contraseña, nombre)
  - Inicio de sesión
  - Recuperación de contraseña (funcionalidad futura)
- **Validaciones:**
  - Regex de email
  - Contraseña mínima
  - Confirmación de contraseña
- **Integración:** Conecta con `php/api.php`

### `entrenamientos.html` - Catálogo de Entrenamientos
- **Propósito:** Mostrar y buscar entrenamientos disponibles
- **Características:**
  - Grid de 8 entrenamientos (4 columnas × 2 filas)
  - **Buscador local** con filtrado en tiempo real
  - Botones "Agregar al carrito"
  - Contador de resultados dinámico
- **Entrenamientos:**
  1. Entrenamiento Funcional (€50)
  2. Boxeo/Kickboxing (€60)
  3. Pilates/Movilidad (€45)
  4. Paquete Completo (€120)
  5. GAP (€55)
  6. Rehabilitación (€65)
  7. Fuerza (€70)
  8. Ciclo/Spinning (€50)

### `blog.html` - Blog/Artículos
- **Propósito:** Contenido educativo y tips de entrenamiento
- **Estructura:** Grid de artículos con descripción y enlace

### `opiniones.html` - Reseñas de Usuarios
- **Propósito:** Testimonios de clientes satisfechos
- **Datos:** Nombre, foto, texto de opinión, rating

---

## 🎨 Carpeta `css/`

### `style.css` - Estilos Globales
- **Propósito:** Hoja de estilos principal del proyecto
- **Contenido:**
  - Variables CSS (colores, fuentes)
  - Estilos de navbar
  - Estilos de grid y layout
  - Estilos de tarjetas (cards)
  - Estilos del carrito
  - Estilos del buscador
  - Responsive design (media queries)
  - Animaciones y transiciones
- **Colores principales:**
  - Dorado (#D4AF37)
  - Negro (#1a1a1a)
  - Blanco (texto)
  - Gradientes personalizados

---

## ⚙️ Carpeta `php/` - Backend

### `db.php` - Conexión a Base de Datos ⭐
**Este es el archivo crítico de conexión**

```php
// DEFINE:
- DB_HOST: localhost
- DB_USER: root
- DB_PASS: (vacío)
- DB_NAME: athlos_forge

// PROPÓSITO:
1. Crear conexión PDO a MySQL
2. Configurar seguridad contra SQL Injection
3. Validación de errores

// FUNCIONES PRINCIPALES:
- executeQuery($query, $params) 
  └─ Ejecuta consultas preparadas de forma segura
  
- hashPassword($password) 
  └─ Encripta contraseñas con BCRYPT

- verifyPassword($password, $hash) 
  └─ Verifica contraseña vs hash almacenado

- generateToken($user_id) 
  └─ Crea token sesión (simplificado)

- validateToken($token) 
  └─ Valida que token sea válido

- getAuthUser() 
  └─ Obtiene usuario autenticado de encabezado
```

**Seguridad:** Usa `PDO::ATTR_EMULATE_PREPARES = false` para evitar inyecciones SQL

---

### `api.php` - API REST Principal ⭐⭐
**Centro neurálgico del backend - Gestiona TODAS las peticiones**

```php
// ESTRUCTURA:
├── Headers CORS (permite requests desde frontend)
├── Switch de acciones: Enruta peticiones a funciones específicas
└── Funciones de manejo

// ENDPOINTS DISPONIBLES:
```

**AUTENTICACIÓN**
- `login` - POST - Inicia sesión usuario
  - Recibe: email, contraseña
  - Retorna: token, datos usuario
  - Valida: email existe, contraseña correcta

- `register` - POST - Crea nueva cuenta
  - Recibe: nombre, email, contraseña, confirmación
  - Retorna: token, usuario creado
  - Valida: email no duplicado, contraseña fuerte

- `logout` - GET - Cierra sesión
  - Limpia token en localStorage

**PRODUCTOS/ENTRENAMIENTOS**
- `productos` - GET - Obtiene lista de entrenamientos
  - Retorna: array de todos los entrenamientos con precio/descripción
  - Sin parámetros: trae todo
  - Con `?limit=X&offset=Y`: paginado

- `producto` - GET - Obtiene 1 entrenamiento por ID
  - Recibe: `?id=X`
  - Retorna: datos completos del entrenamiento

- `categorias` - GET - Obtiene categorías disponibles
  - Retorna: Funcional, Boxeo, Pilates, etc.

**CARRITO**
- `carrito_agregar` - POST - Agrega item al carrito
  - Recibe: producto_id, cantidad
  - Realiza: INSERT en tabla carrito
  - Retorna: confirmación con total

- `carrito_obtener` - GET - Obtiene items del carrito del usuario
  - Recibe: user_id (autenticado)
  - Retorna: array con todos los items

- `carrito_eliminar` - POST - Saca item del carrito
  - Recibe: carrito_item_id
  - Realiza: DELETE de la base de datos

**PEDIDOS**
- `crear_pedido` - POST - Confirma compra
  - Recibe: items carrito, datos envío
  - Realiza: INSERT en tabla pedidos
  - Retorna: número de pedido

- `obtener_pedidos` - GET - Historial de compras del usuario
  - Retorna: todos los pedidos del usuario logged

- `obtener_pedido` - GET - Obtiene 1 pedido
  - Recibe: `?id=X`
  - Retorna: detalles completos del pedido

**USUARIO**
- `perfil` - GET - Obtiene datos del perfil
  - Retorna: nombre, email, foto, historial

- `actualizar_perfil` - POST - Actualiza datos usuario
  - Recibe: nombre, foto, etc.
  - Realiza: UPDATE de perfil

**OPINIONES**
- `crear_opinion` - POST - Usuario deja reseña
  - Recibe: rating (1-5), texto, entrenamiento_id
  - Realiza: INSERT en tabla opiniones

- `obtener_opiniones` - GET - Obtiene reseñas
  - Retorna: todas las opiniones públicas

---

### `registro.php` - Procesamiento de Registro
**Estado:** Vacío (funcionalidad integrada en `api.php`)

**Nota:** La lógica de registro está centralizada en `api.php` en la función `handleRegister()`

---

## 🔧 Carpeta `js/` - JavaScript Frontend

### `autenticacion.js` - Lógica de Login/Registro
- **Propósito:** Manejo de autenticación en frontend
- **Funciones:**
  - `login(email, password)` - Envía credenciales a api.php
  - `register(datos)` - Crea nueva cuenta
  - `logout()` - Cierra sesión
  - `checkLogin()` - Verifica si usuario está autenticado
  - `guardarToken()` - Almacena token en localStorage
  - `obtenerToken()` - Recupera token guardado
- **Almacenamiento:** localStorage

### `carrito.js` - Gestión del Carrito de Compra (Sprint 2.1)
- **Propósito:** Agregar/eliminar/gestionar items del carrito
- **Funciones:**
  - `agregarAlCarrito(nombre, precio)` - Agrega item
  - `obtenerCarrito()` - Recupera todos los items
  - `actualizarCarrito()` - Recalcula totales
  - `eliminarDelCarrito(index)` - Saca un item
  - `vaciarCarrito()` - Limpia carrito completo
- **Almacenamiento:** localStorage
- **Interfaz:** Offcanvas mostrador lateral

### `buscador.js` - Búsqueda de Entrenamientos (Sprint 2.2)
- **Propósito:** Filtrado de entrenamientos en tiempo real
- **Características:**
  - Búsqueda **local** (sin servidor)
  - Case-insensitive
  - Coincidencias parciales
  - Contador dinámico
- **Ubicación:** Solo en `entrenamientos.html`
- **Performance:** Instant (no AJAX)

### `validaciones.js` - Validadores de Formularios
- **Propósito:** Validar datos antes de enviar al servidor
- **Validaciones:**
  - Email válido (regex)
  - Contraseña fuerte (min 8 caracteres)
  - Nombres no vacíos
  - Números válidos
- **Integración:** Formularios de login y registro

### `Regex.js` - Utilidades de Expresiones Regulares
- **Propósito:** Patrones reutilizables para validación
- **Patrones:**
  - EMAIL_REGEX - Emails válidos
  - PASSWORD_REGEX - Contraseñas fuertes
  - PHONE_REGEX - Teléfonos
  - NOMBRE_REGEX - Nombres sin caracteres especiales

### `api.js` - Cliente HTTP (Opcional)
- **Propósito:** Funciones auxiliares para fetch
- **Métodos:**
  - `fetchJSON(url, options)` - Wrapper de fetch
  - `handleError(response)` - Manejo de errores
  - `getHeaders()` - Headers con token de auth

---

## 📦 Carpeta `db/` - Base de Datos

### `schema.sql` - Estructura de la Base de Datos
- **Propósito:** Crear tablas e índices de MySQL
- **Tablas principales:**
  ```sql
  usuarios (id, email, password, nombre, foto, created_at)
  entrenamientos (id, nombre, descripcion, precio, categoria_id)
  carrito (id, usuario_id, entrenamiento_id, cantidad)
  pedidos (id, usuario_id, total, estado, fecha)
  opiniones (id, usuario_id, entrenamiento_id, rating, texto)
  ```
- **Índices:** usuario_id, email (único), etc.

---

## 🖼️ Carpeta `img/` - Imágenes
- **Contenido:** Assets visuales del proyecto
  - Logos
  - Fotos de entrenamientos
  - Iconos
  - Fondos

---

## 🧪 Carpeta `tests/` - Tests Automatizados

### Estructura recomendada:
```
tests/
├── sprint-2-1/
│   └── test_carrito.py        # Tests del carrito
└── sprint-2-2/
    └── test_buscador.py        # Tests de búsqueda
```

**Tech Stack:** Selenium + pytest

---

## 📋 Archivos de Documentación

### `README.md` - Inicio Rápido
- Enlaces principales (GitHub Pages, video)
- Instalación local
- Stack tecnológico
- Tests

### `RESUMEN_SPRINT_2.1.md` - Carrito de Compra
- Funcionalidades implementadas
- Estructura técnica
- localStorage

### `RESUMEN_SPRINT_2.2.md` - Buscador
- Filtrado local
- 8 entrenamientos
- Grid responsive

---

## 🔄 Flujo de Datos: Cómo Funciona Todo Junto

```
Usuario abre index.html
    ↓
JS: autenticacion.js verifica si hay token
    ↓
[SI] → Navbar muestra "Bienvenido {nombre}"
[NO] → Navbar muestra botón "Acceder"
    ↓
Usuario hace clic en "Entrenamientos"
    ↓
Se abre entrenamientos.html
    ↓
JS: buscador.js carga 8 entrenamientos en grid
    ↓
Usuario escribe en buscador
    ↓
JS: buscador.js filtra localmente (sin servidor)
    ↓
Usuario hace clic "Agregar al carrito"
    ↓
JS: carrito.js guarda en localStorage + actualiza UI
    ↓
Usuario abre carrito (offcanvas)
    ↓
JS: carrito.js muestra items y total
    ↓
Usuario finalizacompra
    ↓
AJAX a php/api.php?action=crear_pedido
    ↓
php/db.php: Inserta en tabla pedidos
    ↓
api.php: Retorna confirmación con número de pedido
    ↓
JS: Muestra éxito y limpia localStorage
```

---

## 💡 Resumen de Responsabilidades

| Archivo | Responsabilidad |
|---------|---|
| **db.php** | Conexión y seguridad BD |
| **api.php** | Router y lógica backend |
| **autenticacion.js** | Login/registro frontend |
| **carrito.js** | Gestión items compra |
| **buscador.js** | Filtrado entrenamientos |
| **validaciones.js** | Validar datos usuario |
| **style.css** | Apariencia visual |
| **schema.sql** | Estructura datos |

---

**Última actualización:** 19 de marzo de 2026  
**Estado:** ✅ Documentado Completo

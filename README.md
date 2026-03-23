# Athlos Forge by Sebas

> Plataforma de entrenamientos online con autenticación, carrito de compra, panel de administración y pruebas automatizadas con Selenium.

---

## Enlaces Principales

- **[Sitio en Vivo (GitHub Pages)](https://estenombrenoestacogido.github.io/Athlos-Forge-by-Sebas/)**
- **[Video Presentación](https://drive.google.com/file/d/1AYuFi687lVxGGldQcwQL-Dt1tFj2RAvF/view?usp=sharing)**
- **[Video Sprint 2](https://drive.google.com/file/d/1nhsY_kjFHeu8kMmzEDG5j563tqFk1KIX/view?usp=drive_link)**

---

## Características

✅ **Autenticación de Usuarios** — Registro, login, sesiones con PHP y bcrypt  
✅ **Catálogo de Entrenamientos** — 8 programas con precios, stock y categorías  
✅ **Carrito de Compra** — Sistema dual: localStorage (invitados) + API REST (logueados)  
✅ **Checkout completo** — Validación de stock, tarjeta cifrada AES-256, email de confirmación  
✅ **Panel de Administración** — Dashboard con KPIs, gestión de productos, pedidos y usuarios  
✅ **Blog** — Artículos con enlaces a recursos externos  
✅ **Opiniones** — Sistema de reseñas de usuarios  
✅ **Mis Pedidos** — Historial de compras del usuario  
✅ **Buscador** — Filtrado de entrenamientos en tiempo real  
✅ **Responsive** — Compatible con móvil, tablet y desktop  
✅ **Tests Automatizados** — Selenium + Pytest con reporte HTML  

---

## Usuarios de Ejemplo

### Administrador

| Campo       | Valor                        |
|-------------|------------------------------|
| Email       | `admin@athlosforge.com`      |
| Contraseña  | `Admin123!`                  |
| Rol         | Administrador                |
| Acceso      | Panel Admin + todas las páginas |

### Usuario de Test (Selenium)

| Campo       | Valor                        |
|-------------|------------------------------|
| Email       | `test_selenium@athlos.com`   |
| Contraseña  | `Test1234!`                  |
| Rol         | Cliente                      |
| Acceso      | Entrenamientos, carrito, pedidos |

### Registrar un usuario nuevo

1. Ir a `login.html` → Pestaña **Registro**
2. Rellenar: nombre, apellidos, email, contraseña (mín. 8 chars, 1 mayúscula, 1 número), género, fecha de nacimiento, dirección, país
3. Opcional: añadir tarjeta de crédito (necesaria para comprar)
4. Clic en **Registrarse**

> **Nota:** El usuario de test solo funciona si se ha registrado previamente en la base de datos. El admin viene precargado en `schema.sql`.

---

## Instalación

### Requisitos
- XAMPP (PHP 7.4+, MySQL 5.7+)
- Python 3.10+ (solo para tests)
- Navegador moderno (Chrome recomendado)

### Pasos

```bash
# 1. Clonar repositorio
git clone <url-repositorio>

# 2. Copiar carpeta en htdocs de XAMPP
cp -r "Athlos Forge by Sebas" /xampp/htdocs/

# 3. Iniciar XAMPP (Apache + MySQL)

# 4. Importar base de datos
#    → Abrir phpMyAdmin (http://localhost/phpmyadmin)
#    → Crear base de datos "athlos_forge"
#    → Importar db/schema.sql

# 5. Abrir en el navegador
http://localhost/Athlos%20Forge%20by%20Sebas/
```

---

## Ejecutar Tests de Selenium

```bash
# 1. Ir a la carpeta de tests
cd tests

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Ejecutar todos los tests con reporte HTML
python -m pytest test_02_login.py test_05_carrito.py -v --html=reporte.html --self-contained-html
```

### Tests disponibles

| Archivo              | Tests | Qué prueba                                           |
|----------------------|-------|------------------------------------------------------|
| `test_02_login.py`   | 9     | Formulario login, validaciones, redirección, localStorage |
| `test_05_carrito.py` | 10    | Agregar items, panel offcanvas, total, eliminar, persistencia, checkout |

**Resultado esperado:** 16 passed, 2 skipped

El reporte visual se genera en `tests/reporte.html`.

---

## Estructura del Proyecto

```
Athlos Forge by Sebas/
│
├── index.html                  # Landing page
├── entrenamientos.html         # Catálogo de entrenamientos + carrito
├── login.html                  # Login y registro
├── blog.html                   # Blog con artículos externos
├── opiniones.html              # Reseñas de usuarios
├── mis-pedidos.html            # Historial de pedidos del usuario
├── admin.html                  # Panel de administración
│
├── css/
│   └── style.css               # Estilos (tema oscuro, dorado, responsive)
│
├── js/
│   ├── autenticacion.js        # Login, registro, gestión de sesión
│   ├── carrito.js              # Carrito dual (local + API), checkout
│   └── admin.js                # Dashboard, CRUD productos/pedidos/usuarios
│
├── php/
│   ├── api.php                 # API REST (45+ endpoints)
│   └── db.php                  # Conexión PDO, sesiones, cifrado, helpers
│
├── db/
│   └── schema.sql              # Esquema completo (12 tablas, procedures, views)
│
├── img/                        # Imágenes (logo, entrenamientos, blog)
│
├── tests/
│   ├── conftest.py             # Fixtures de Pytest (driver, URL, credenciales)
│   ├── test_02_login.py        # 9 tests de login
│   ├── test_05_carrito.py      # 10 tests de carrito
│   ├── requirements.txt        # Dependencias Python
│   └── reporte.html            # Reporte de tests generado
│
└── Documentación Proyecto Final.pdf
```

---

## Stack Tecnológico

| Capa       | Tecnología                                    |
|------------|-----------------------------------------------|
| Frontend   | HTML5, CSS3, JavaScript ES6+, Bootstrap 5.3.0 |
| Backend    | PHP 7.4+, PDO con MySQL                       |
| Base de datos | MySQL 5.7+ (12 tablas, procedures, views)  |
| Seguridad  | bcrypt, AES-256-CBC, prepared statements, HttpOnly cookies |
| Testing    | Selenium 4.41, Pytest 9.0, Pytest-HTML 4.2    |
| Servidor   | XAMPP (Apache + MySQL)                         |

---

## Base de Datos

### Tablas principales

| Tabla              | Descripción                                    |
|--------------------|------------------------------------------------|
| `usuarios`         | Usuarios con roles (cliente/administrador)     |
| `sesiones`         | Sesiones activas con IP y user-agent           |
| `categorias`       | Categorías de entrenamientos (4)               |
| `articulos`        | Productos/entrenamientos (8)                   |
| `carrito_sesion`   | Carrito del usuario autenticado                |
| `pedidos`          | Pedidos realizados                             |
| `detalle_pedido`   | Items de cada pedido                           |
| `movimiento_stock` | Registro de movimientos de inventario          |
| `opiniones`        | Reseñas de usuarios sobre productos            |
| `notificaciones`   | Alertas del sistema                            |

### Entrenamientos disponibles

| Entrenamiento            | Precio  | Categoría      |
|--------------------------|---------|----------------|
| Entrenamiento Funcional  | 50 €    | Funcional      |
| Boxeo / Kickboxing       | 60 €    | Boxeo          |
| Pilates / Movilidad      | 45 €    | Pilates        |
| Paquete Completo         | 120 €   | Asesoramiento  |
| GAP                      | 55 €    | Funcional      |
| Rehabilitación           | 65 €    | Asesoramiento  |
| Fuerza                   | 70 €    | Funcional      |
| Ciclo / Spinning         | 50 €    | Funcional      |

---

## Seguridad

- **Contraseñas:** hash bcrypt con coste 10
- **Tarjetas:** cifrado AES-256-CBC con IV aleatorio
- **SQL Injection:** sentencias preparadas con PDO
- **XSS:** `htmlspecialchars()` en salidas
- **Sesiones:** cookies HttpOnly, SameSite Lax, validación servidor
- **Roles:** middleware `requiereAutenticacion()` y `requiereAdmin()`

---

## Autor

**Sebas** — Desarrollo Full Stack

---

**Última actualización:** 22 de marzo de 2026


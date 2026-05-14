# Athlos Forge by Sebas

Plataforma de entrenamientos online con autenticacion, carrito de compra, panel de administracion y pruebas automatizadas con Selenium.

---

## Enlaces

- [Sitio en Vivo (GitHub Pages)](https://estenombrenoestacogido.github.io/Athlos-Forge-by-Sebas/)
- [Video Presentacion](https://drive.google.com/file/d/1AYuFi687lVxGGldQcwQL-Dt1tFj2RAvF/view?usp=sharing)
- [Video Sprint 2](https://drive.google.com/file/d/1nhsY_kjFHeu8kMmzEDG5j563tqFk1KIX/view?usp=drive_link)

---

## Requisitos previos

Antes de ejecutar cualquier cosa, asegurate de tener instalado lo siguiente:

- XAMPP (con Apache y MySQL activos)
- Python 3.10 o superior
- Node.js 18 o superior (solo necesario para la version React)
- Google Chrome (necesario para los tests de Selenium)
- Git

---

## Como ejecutar los tests

Los tests usan Selenium y Pytest. Necesitas tener XAMPP corriendo con Apache y MySQL antes de ejecutarlos.

### Paso 1 — Posicionate en la carpeta de tests

```
cd "c:\xampp\htdocs\Athlos Forge by Sebas\tests"
```

### Paso 2 — Instala las dependencias de Python

Este comando solo lo necesitas ejecutar una vez. Instala Selenium, Pytest y las demas librerias necesarias.

```
pip install -r requirements.txt
```

### Paso 3 — Ejecuta los tests

Este comando ejecuta todos los tests y genera un reporte visual en HTML.

```
python -m pytest test_02_login.py test_05_carrito.py -v --html=reporte.html --self-contained-html
```

### Resultado esperado

```
16 passed, 2 skipped
```

El reporte visual se genera automaticamente en `tests/reporte.html`. Puedes abrirlo directamente en el navegador.

### Tests disponibles

| Archivo              | Tests | Que prueba                                              |
|----------------------|-------|---------------------------------------------------------|
| `test_02_login.py`   | 9     | Formulario login, validaciones, redireccion, localStorage |
| `test_05_carrito.py` | 10    | Agregar items, panel offcanvas, total, eliminar, persistencia, checkout |

---

## Como ver la pagina sin React (version HTML/PHP)

Esta es la rama principal del proyecto. Usa HTML, CSS, JavaScript y PHP con base de datos MySQL. Necesitas XAMPP para que funcione el backend.

### Paso 1 — Cambia a la rama principal

```
git checkout main
```

### Paso 2 — Abre XAMPP y asegurate de que Apache y MySQL esten activos

Inicia el panel de control de XAMPP y pulsa "Start" en Apache y en MySQL.

### Paso 3 — Importa la base de datos (solo la primera vez)

1. Abre el navegador y entra en `http://localhost/phpmyadmin`
2. Crea una base de datos nueva llamada `athlos_forge`
3. Selecciona esa base de datos, ve a la pestana "Importar" y sube el archivo `db/schema.sql`
4. Pulsa "Continuar"

### Paso 4 — Abre la pagina en el navegador

```
http://localhost/Athlos%20Forge%20by%20Sebas/
```

Pega esa URL directamente en la barra del navegador y pulsa Enter.

---

## Como ver la pagina con React (version Vite + React)

Esta version usa React 19 con Vite como servidor de desarrollo. El backend sigue siendo el de XAMPP (PHP + MySQL), por lo que necesitas tenerlo corriendo al mismo tiempo.

### Paso 1 — Cambia a la rama de React

```
git checkout sprint-3-react-migration
```

### Paso 2 — Asegurate de que XAMPP este corriendo

El frontend React se comunica con el backend PHP de XAMPP. Abre XAMPP y verifica que Apache y MySQL esten activos.

### Paso 3 — Instala las dependencias de Node.js

Este comando solo lo necesitas ejecutar una vez, o cuando cambies de rama a esta por primera vez.

```
cd "c:\xampp\htdocs\Athlos Forge by Sebas"
```

```
npm install
```

### Paso 4 — Arranca el servidor de desarrollo

```
npm run dev
```

Vite arrancara automaticamente y abrira el navegador en:

```
http://localhost:3000
```

Si no se abre solo, pega esa URL en el navegador.

### Para detener el servidor

Pulsa `Ctrl + C` en la terminal donde esta corriendo.

---

## Usuarios de ejemplo

### Administrador

| Campo      | Valor                   |
|------------|-------------------------|
| Email      | `admin@athlosforge.com` |
| Contrasena | `Admin123!`             |
| Rol        | Administrador           |

### Usuario de test (Selenium)

| Campo      | Valor                      |
|------------|----------------------------|
| Email      | `test_selenium@athlos.com` |
| Contrasena | `Test1234!`                |
| Rol        | Cliente                    |

> El usuario de test debe estar registrado previamente en la base de datos. El administrador viene precargado en `db/schema.sql`.

---

## Estructura del proyecto

```
Athlos Forge by Sebas/
|
|-- index.html                  # Landing page
|-- entrenamientos.html         # Catalogo de entrenamientos + carrito
|-- login.html                  # Login y registro
|-- blog.html                   # Blog con articulos externos
|-- opiniones.html              # Resenas de usuarios
|-- mis-pedidos.html            # Historial de pedidos del usuario
|-- admin.html                  # Panel de administracion
|
|-- css/
|   `-- style.css               # Estilos (tema oscuro, dorado, responsive)
|
|-- js/
|   |-- autenticacion.js        # Login, registro, gestion de sesion
|   |-- carrito.js              # Carrito dual (local + API), checkout
|   `-- admin.js                # Dashboard, CRUD productos/pedidos/usuarios
|
|-- php/
|   |-- api.php                 # API REST (45+ endpoints)
|   `-- db.php                  # Conexion PDO, sesiones, cifrado, helpers
|
|-- db/
|   `-- schema.sql              # Esquema completo (12 tablas, procedures, views)
|
|-- img/                        # Imagenes (logo, entrenamientos, blog)
|
|-- tests/
|   |-- conftest.py             # Fixtures de Pytest (driver, URL, credenciales)
|   |-- test_02_login.py        # 9 tests de login
|   |-- test_05_carrito.py      # 10 tests de carrito
|   |-- requirements.txt        # Dependencias Python
|   `-- reporte.html            # Reporte de tests generado
|
`-- Documentacion Proyecto Final.pdf
```

---

## Stack tecnologico

| Capa          | Tecnologia                                      |
|---------------|-------------------------------------------------|
| Frontend      | HTML5, CSS3, JavaScript ES6+, Bootstrap 5.3.0  |
| Frontend v2   | React 19, Vite, Axios                           |
| Backend       | PHP 7.4+, PDO con MySQL                         |
| Base de datos | MySQL 5.7+ (12 tablas, procedures, views)       |
| Seguridad     | bcrypt, AES-256-CBC, prepared statements, HttpOnly cookies |
| Testing       | Selenium 4.15, Pytest 7.4, Pytest-HTML 4.1     |
| Servidor      | XAMPP (Apache + MySQL)                          |

---

## Seguridad

- Contrasenas: hash bcrypt con coste 10
- Tarjetas: cifrado AES-256-CBC con IV aleatorio
- SQL Injection: sentencias preparadas con PDO
- XSS: htmlspecialchars() en salidas
- Sesiones: cookies HttpOnly, SameSite Lax, validacion servidor
- Roles: middleware requiereAutenticacion() y requiereAdmin()

---

## Autor

Sebas — Desarrollo Full Stack

---

**Ultima actualizacion:** 14 de mayo de 2026

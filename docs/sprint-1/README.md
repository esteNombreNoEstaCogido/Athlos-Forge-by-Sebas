# Sprint 1 — HU-01: Despliegue en entorno local con XAMPP

## Objetivo

Configurar y validar el entorno de despliegue local de la aplicación **Athlos Forge** utilizando XAMPP, asegurando que Apache, MySQL y la aplicación funcionen correctamente para pruebas internas.

---

## Pasos realizados

### 1. Instalación de XAMPP

- Se descargó e instaló XAMPP desde [https://www.apachefriends.org](https://www.apachefriends.org).
- Versión instalada: **XAMPP 8.2.x** (PHP 8.2, Apache 2.4, MariaDB 10.x).
- Instalación sin errores ni advertencias.

### 2. Verificación de conflictos de puerto

Se comprobó que el puerto 80 estuviera libre antes de iniciar Apache ejecutando:

```cmd
netstat -ano | findstr :80
```

No se detectaron conflictos con otros servicios (Apache2, IIS, etc.).

### 3. Inicio de Apache y MySQL

- Se abrió el **Panel de Control de XAMPP**.
- Se pulsó **Start** en **Apache** → estado verde en < 10 segundos.
- Se pulsó **Start** en **MySQL** → estado verde en < 10 segundos.
- No se registraron errores en los logs (`apache/logs/error.log`, `mysql/data/*.err`).

### 4. Importación de la base de datos

1. Acceder a `http://localhost/phpmyadmin`.
2. Crear base de datos: `athlos_forge` (cotejamiento `utf8mb4_unicode_ci`).
3. Seleccionar la BD → pestaña **Importar** → subir `db/schema.sql`.
4. Pulsar **Continuar**.

Resultado: 12 tablas importadas correctamente con registros de ejemplo precargados.

### 5. Configuración de variables de entorno

Las credenciales sensibles se movieron fuera del código fuente a un archivo `.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=athlos_forge
AES_KEY=<clave_secreta>
```

- El archivo `.env` está en `.gitignore` y **nunca se sube al repositorio**.
- Se incluye `.env.example` como plantilla para otros desarrolladores.
- [`php/db.php`](../../php/db.php) carga las variables al iniciar con un parser propio (sin dependencias externas).

### 6. Verificación de la conexión

- La aplicación se conectó correctamente a la BD a través de PDO.
- En caso de fallo, la API devuelve un JSON con mensaje de error claro (`500 Internal Server Error`).
- En caso de que falte el `.env`, el sistema muestra un mensaje descriptivo indicando que se debe copiar `.env.example`.

### 7. Acceso desde el navegador

URL de acceso local:

```
http://localhost/Athlos%20Forge%20by%20Sebas/
```

La página principal carga correctamente sin errores 404, 500 ni conflictos de rutas.

---

## Estructura de archivos relevantes

```
Athlos Forge by Sebas/
├── .env                  ← credenciales (NO se sube a Git)
├── .env.example          ← plantilla segura para otros desarrolladores
├── php/
│   ├── db.php            ← carga .env y gestiona conexión PDO
│   └── api.php           ← API REST (45+ endpoints)
└── db/
    └── schema.sql        ← esquema completo (12 tablas)
```

---

## Problemas encontrados y soluciones

| # | Problema | Solución aplicada |
|---|----------|-------------------|
| 1 | `AES_KEY` estaba hardcodeado directamente en `php/db.php` | Se movió a `.env` y `db.php` lo carga dinámicamente con un parser PHP sin dependencias |
| 2 | `.env` no existía en el proyecto | Se creó `.env` (gitignoreado) y `.env.example` (commiteado) como plantilla |
| 3 | El README no especificaba la versión mínima de PHP recomendada | Se actualizó la documentación para indicar PHP ≥ 8.2 |

---

## Criterios de aceptación verificados

| Criterio | Estado |
|----------|--------|
| Apache inicia sin conflictos | ✅ |
| MySQL inicia sin conflictos | ✅ |
| Puerto 80 libre (sin conflicto) | ✅ |
| BD `athlos_forge` importada correctamente (12 tablas) | ✅ |
| Archivo `.env` con credenciales configurado correctamente | ✅ |
| Conexión PDO exitosa entre app y BD | ✅ |
| Aplicación accesible desde `http://localhost/Athlos%20Forge%20by%20Sebas/` | ✅ |
| Proyecto ubicado dentro de `htdocs` | ✅ |

---

## Tecnologías utilizadas

- XAMPP 8.2 (Apache 2.4 + MariaDB 10.x)
- PHP 8.2
- MySQL / MariaDB
- phpMyAdmin
- Google Chrome
- Windows 11

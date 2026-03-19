# Athlos Forge by Sebas

> Plataforma de entrenamientos online con autenticación, carrito de compra y búsqueda de entrenamientos.

---

##  Enlaces Principales

- ** [Sitio en Vivo (GitHub Pages)](https://estenombrenoestacogido.github.io/Athlos-Forge-by-Sebas/)**
- ** [Video Presentación](https://drive.google.com/file/d/1AYuFi687lVxGGldQcwQL-Dt1tFj2RAvF/view?usp=sharing)**

---

##  Características

✅ **Autenticación de Usuarios** - Registro e inicio de sesión  
✅ **Catálogo de Entrenamientos** - 8 tipos con descripción y precio  
✅ **Buscador Local** - Filtrado en tiempo real  
✅ **Carrito de Compra** - Gestión de entrenamientos seleccionados  
✅ **Blog** - Contenido educativo  
✅ **Opiniones** - Reseñas de usuarios  
✅ **Responsive Design** - Compatible con móvil, tablet y desktop  

---

## 🚀 Inicio Rápido

### Requisitos
- XAMPP (PHP 7.4+, MySQL)
- Navegador moderno

### Instalación

```bash
# 1. Clonar repositorio
git clone <url-repositorio>

# 2. Copiar carpeta en htdocs
cp -r "Athlos Forge by Sebas" /xampp/htdocs/

# 3. Importar base de datos
# - Abrir phpMyAdmin
# - Importar db/schema.sql

# 4. Iniciar XAMPP y abrir
http://localhost/Athlos%20Forge%20by%20Sebas/
```

---

## 🧪 Ejecutar Tests

### Tests de Funcionalidad (Selenium)

```bash
# 1. Instalar dependencias
pip install selenium pytest

# 2. Ejecutar suite de tests
pytest tests/ -v

# 3. Tests específicos por sprint
pytest tests/sprint-2-1/ -v  # Carrito
pytest tests/sprint-2-2/ -v  # Buscador
```

---

## 📁 Estructura del Proyecto

```
Athlos Forge by Sebas/
├── index.html              # Página principal
├── entrenamientos.html     # Catálogo + buscador
├── login.html              # Autenticación
├── blog.html               # Blog
├── opiniones.html          # Opiniones
├── css/
│   └── style.css           # Estilos principales
├── js/
│   ├── autenticacion.js    # Lógica de login/registro
│   ├── carrito.js          # Gestión del carrito
│   ├── validaciones.js     # Validadores de formularios
│   └── Regex.js            # Utilidades regex
├── php/
│   ├── api.php             # Backend API
│   ├── db.php              # Conexión BD
│   └── registro.php        # Procesamiento registro
├── db/
│   └── schema.sql          # Estructura de BD
├── img/                    # Imágenes y recursos
└── tests/                  # Suite de tests
```

---

## 📊 Stack Tecnológico

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5.3.0

**Backend:**
- PHP 7.4+
- MySQL 5.7+

**Testing:**
- Selenium WebDriver
- pytest

---

## 🎯 Sprints Completados

### Sprint 2.1 - Carrito de Compra ✅
- Gestión de items en localStorage
- Cálculo de totales
- Interfaz offcanvas

📄 [Detalles técnicos](RESUMEN_SPRINT_2.1.md)

### Sprint 2.2 - Buscador de Entrenamientos ✅
- Filtrado local en tiempo real
- 8 entrenamientos disponibles
- Grid responsive 4×2

📄 [Detalles técnicos](RESUMEN_SPRINT_2.2.md)

---

## 👤 Autor

**Sebas** - Desarrollo Full Stack

---

**Última actualización:** 19 de marzo de 2026  


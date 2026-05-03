# Athlos Forge by Sebas - React Migration (Sprint 3)

## 🎯 Descripción del Proyecto

Migración del escaparate virtual de JavaScript Vanilla a React, manteniendo todas las funcionalidades existentes mientras se moderniza la arquitectura del frontend.

### Objetivo
Reestructurar la aplicación utilizando un enfoque basado en componentes reutilizables, mejorar la mantenibilidad del código y preparar el proyecto para su futura integración con un backend real.

## 📋 Requisitos Implementados

### 1. Escaparate de Productos
- ✅ Galería dinámica de productos
- ✅ Carga de productos mediante peticiones AJAX al API
- ✅ Visualización en grid responsive

### 2. Buscador de Productos
- ✅ Campo de búsqueda interactivo
- ✅ Filtrado por nombre y descripción
- ✅ Actualización dinámica de resultados en tiempo real

### 3. Carrito de la Compra
- ✅ Agregar productos al carrito
- ✅ Especificar cantidad
- ✅ Mostrar número de elementos en el icono del carrito
- ✅ Visualizar contenido del carrito
- ✅ Eliminar productos
- ✅ Calcular precio total automáticamente

### 4. Formulario de Registro
- ✅ Validaciones personalizadas en JavaScript/React
- ✅ Mensajes de error interactivos
- ✅ Comportamiento sin recarga de página

## 🏗️ Arquitectura del Proyecto

### Estructura de Carpetas

```
Athlos Forge by Sebas/
├── src/
│   ├── components/
│   │   ├── Header.jsx                # Barra de navegación
│   │   ├── Header.css
│   │   ├── SearchBar.jsx             # Campo de búsqueda
│   │   ├── SearchBar.css
│   │   ├── ProductGallery.jsx        # Galería de productos
│   │   ├── ProductGallery.css
│   │   ├── ProductCard.jsx           # Tarjeta individual de producto
│   │   ├── ProductCard.css
│   │   ├── Cart.jsx                  # Carrito de compras
│   │   ├── Cart.css
│   │   ├── CartItem.jsx              # Elemento del carrito
│   │   ├── CartItem.css
│   │   ├── RegisterForm.jsx          # Formulario de registro
│   │   └── RegisterForm.css
│   ├── services/
│   │   └── api.js                    # Servicio de comunicación con API
│   ├── hooks/
│   │   └── (hooks personalizados futuros)
│   ├── pages/
│   │   └── (páginas futuras)
│   ├── App.jsx                       # Componente principal
│   ├── App.css
│   ├── index.jsx                     # Entrada de la aplicación
│   └── index.css                     # Estilos globales
├── index.html                        # HTML raíz
├── vite.config.js                    # Configuración de Vite
├── package.json                      # Dependencias y scripts
└── README.md                         # Este archivo
```

## 📦 Componentes Principales

### Header
Barra de navegación con:
- Logo de la marca
- Enlaces de navegación
- Botón de registro
- Icono de carrito con contador de elementos

### SearchBar
Campo de búsqueda que filtra productos en tiempo real por:
- Nombre del producto
- Descripción del producto

### ProductGallery
Contenedor que muestra:
- Grid responsive de productos
- Carga dinámica desde el API

### ProductCard
Tarjeta individual de producto con:
- Imagen del producto
- Nombre y descripción
- Precio
- Selector de cantidad
- Botón "Agregar al carrito"

### Cart
Carrito de compras que muestra:
- Lista de artículos agregados
- Cantidad de productos
- Precio total
- Botón de checkout

### CartItem
Elemento individual en el carrito con:
- Imagen del producto
- Nombre y precio
- Controles de cantidad (aumentar/disminuir)
- Botón de eliminar

### RegisterForm
Formulario modal de registro con:
- Campo de nombre
- Campo de email
- Campo de contraseña
- Confirmación de contraseña
- Validaciones en tiempo real
- Mensajes de error personalizados

## 🎨 Gestión de Estado

Se utiliza React Hooks (`useState` y `useEffect`) para manejar:

### State Global en App.jsx
```javascript
- products              // Array de productos desde API
- filteredProducts     // Productos filtrados por búsqueda
- cart                 // Items en el carrito
- searchTerm           // Término de búsqueda actual
- showRegister         // Mostrar/ocultar formulario
- loading              // Estado de carga
- error                // Mensajes de error
```

## 🔌 Servicio de API

El servicio `api.js` proporciona métodos para:
- `getProducts()` - Obtener todos los productos
- `searchProducts(query)` - Buscar productos
- `register(userData)` - Registrar usuario
- `login(email, password)` - Iniciar sesión
- `saveCart(cartItems)` - Guardar carrito
- `createOrder(orderData)` - Crear orden

### Configuración del Proxy
El archivo `vite.config.js` incluye un proxy para redirigir peticiones a `/api` hacia el backend PHP.

## 🚀 Cómo Ejecutar el Proyecto

### Requisitos
- Node.js 14+ instalado
- npm o yarn

### Instalación

```bash
# Navegar al directorio del proyecto
cd "Athlos Forge by Sebas"

# Instalar dependencias
npm install
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo (en puerto 3000)
npm run dev
```

El navegador se abrirá automáticamente en `http://localhost:3000`

### Build para Producción

```bash
# Compilar para producción
npm run build

# Vista previa del build
npm run preview
```

## 🎨 Estilos y Diseño

### Paleta de Colores
- **Dorado primario**: `#d4af37`
- **Dorado secundario**: `#f0d060`
- **Fondo oscuro**: `#1a1a1a`
- **Texto claro**: `#e0e0e0`

### Características de Diseño
- Diseño responsive (mobile-first)
- Bootstrap Icons para iconografía
- Bootstrap 5 para utilidades base
- Efectos de transición suave
- Gradientes personalizados
- Animaciones interactivas

## 🔄 Flujo de Datos

```
App (Estado Global)
├── Header
│   └── Carrito Badge (cartCount)
├── SearchBar
│   └── onSearch → filteredProducts
├── ProductGallery
│   └── ProductCard
│       └── onAddToCart → cart
├── Cart
│   ├── CartItem (map)
│   └── onRemoveItem, onUpdateQuantity
└── RegisterForm
    └── onSubmit → API
```

## 📱 Responsividad

El proyecto es completamente responsive con breakpoints en:
- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px

## 🧪 Testing

Los tests funcionales deben cubrir:
- ✅ Carga inicial de productos desde el API
- ✅ Funcionamiento del buscador
- ✅ Adición de productos al carrito
- ✅ Eliminación de productos del carrito
- ✅ Cálculo correcto del total del carrito
- ✅ Funcionamiento del formulario de registro

Se pueden usar herramientas como:
- Selenium
- Katalon Recorder
- Cypress
- PlayWright

## 📚 Tecnologías Utilizadas

- **React 19.2.5** - Framework de UI
- **Vite 8.0.10** - Build tool y dev server
- **Axios 1.16.0** - Cliente HTTP
- **Bootstrap 5.3.0** - Framework CSS
- **Bootstrap Icons 1.11.0** - Iconografía

## 🔐 Integración con Backend

El proyecto se comunica con el API PHP mediante:
- Endpoint: `/api/api.php`
- Método: GET/POST
- Formato: JSON
- Parámetro `action` para especificar la acción

### Ejemplo de Petición
```javascript
fetch('/api/api.php?action=get_products')
  .then(res => res.json())
  .then(data => console.log(data))
```

## 📝 Notas de Desarrollo

- No se utilizan librerías avanzadas de gestión de estado (Redux, Zustand)
- El comportamiento de la aplicación mantiene compatibilidad con sprints anteriores
- El diseño visual sigue las especificaciones de todos los módulos
- Se implementa localStorage para persistencia básica del carrito (opcional)

## 🤝 Contribuciones

Este proyecto es parte de un proceso educativo. Las contribuciones deben:
1. Crear una rama desde `sprint-3-react-migration`
2. Hacer cambios específicos
3. Hacer push y crear un Pull Request
4. Solicitar review

## 📄 Licencia

ISC

## 👤 Autor

Sebas

---

**Estado**: En desarrollo (Sprint 3)
**Fecha de entrega**: Finales de mayo
**Rama principal**: `sprint-3-react-migration`

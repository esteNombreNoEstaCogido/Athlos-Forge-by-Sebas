# Próximos Pasos - Sprint 3

## 🎯 Tareas Pendientes

### Fase 1: Validación de la estructura actual (Próximo paso inmediato)

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Verificar que la aplicación abre en http://localhost:3000
```

### Fase 2: Testing Funcional

Los tests deben cubrir (como mínimo):
- ✅ Carga inicial de productos desde el API
- ✅ Funcionamiento del buscador
- ✅ Adición de productos al carrito
- ✅ Eliminación de productos del carrito
- ✅ Cálculo correcto del total del carrito
- ✅ Funcionamiento del formulario de registro

**Herramientas recomendadas**:
- Selenium WebDriver
- Katalon Recorder
- Cypress
- PlayWright

**Ubicación**: Crear carpeta `/tests/e2e/` o `/tests/functional/`

### Fase 3: Integración con Backend PHP

Puntos de integración necesarios:

1. **Obtener productos**
```javascript
GET /api/api.php?action=get_products
// Respuesta esperada: 
[
  {
    id: 1,
    nombre: "...",
    descripcion: "...",
    precio: 29.99,
    imagen: "..."
  }
]
```

2. **Registrar usuario**
```javascript
POST /api/api.php?action=register
Body: {
  nombre: "...",
  email: "...",
  contraseña: "..."
}
```

3. **Buscar productos** (opcional, si se implementa en backend)
```javascript
GET /api/api.php?action=search_products&q=term
```

### Fase 4: Mejoras Adicionales

#### LocalStorage (Carrito persistente)
```javascript
// En App.jsx, agregar:
useEffect(() => {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) setCart(JSON.parse(savedCart));
}, []);

useEffect(() => {
  localStorage.setItem('cart', JSON.stringify(cart));
}, [cart]);
```

#### Autenticación
- Implementar página de login
- Guardar token en localStorage
- Enviar token en headers de peticiones

#### Páginas Adicionales
- [x] Página de inicio (actual)
- [ ] Página de login
- [ ] Página de órdenes
- [ ] Panel de administración

### Fase 5: Publicación

#### GitHub Pages
```bash
# 1. Instalar gh-pages
npm install -D gh-pages

# 2. Agregar scripts en package.json
"deploy": "npm run build && gh-pages -d dist"

# 3. Ejecutar deploy
npm run deploy

# 4. Configurar en GitHub:
# Settings > Pages > Build and deployment > Deploy from a branch > gh-pages
```

#### Variables de Entorno
Crear archivo `.env`:
```
VITE_API_URL=http://localhost/Athlos%20Forge%20by%20Sebas/php
VITE_API_BASE_PATH=/api
```

## 📝 Estructura de Commits Recomendada

```
sprint-3-react-migration
├── feat: Agregar componentes de login
├── feat: Implementar persistencia de carrito
├── test: Agregar tests funcionales
├── feat: Integración con endpoints backend
├── deploy: Configuración GitHub Pages
└── docs: Actualizar documentación
```

## 🔍 Verificación de Calidad

- [ ] Code review completado
- [ ] Tests ejecutados exitosamente
- [ ] Responsividad verificada en móvil
- [ ] API integration funciona
- [ ] Build producción completado sin errores
- [ ] Documentación actualizada

## 📋 Checklist de Entrega Final

- [ ] Código fuente completo
- [ ] Estructura organizada de componentes
- [ ] Servicios de acceso al API funcionales
- [ ] README.md actualizado (REACT_README.md)
- [ ] Tests funcionales documentados
- [ ] Aplicación publicada en GitHub Pages
- [ ] Rama `sprint-3-react-migration` con todos los cambios

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev          # Inicia servidor dev

# Build
npm run build        # Compilar para producción
npm run preview      # Vista previa del build

# Testing
npm test             # Ejecutar tests (cuando esté configurado)

# Deploy
npm run deploy       # Publicar en GitHub Pages (si está configurado)
```

---

**Última actualización**: Sprint 3 en progreso
**Fecha de entrega**: Finales de mayo
**Rama activa**: `sprint-3-react-migration`

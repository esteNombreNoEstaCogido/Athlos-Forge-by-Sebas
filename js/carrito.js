// js/carrito.js

// 1. Inicializar el carrito desde LocalStorage o vacío
let carrito = JSON.parse(localStorage.getItem('athlosCarrito')) || [];

// Referencias al DOM (Botón flotante y panel)
const contadorCarrito = document.getElementById('cart-count');
const contenedorItems = document.getElementById('cart-items-container');
const totalPrecio = document.getElementById('cart-total');

// 2. Función para Añadir Items (Se llama desde el HTML)
window.agregarAlCarrito = function(nombre, precio) {
    const nuevoItem = {
        id: Date.now(), // ID único para poder borrarlo luego
        nombre: nombre,
        precio: parseFloat(precio)
    };

    carrito.push(nuevoItem);
    guardarYActualizar();
    
    // Feedback visual (Opcional: pequeña alerta)
    alert(`✅ ${nombre} añadido a la forja.`);
};

// 3. Función para Eliminar Items
window.eliminarDelCarrito = function(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarYActualizar();
};

// 4. Lógica central: Guardar y Pintar
function guardarYActualizar() {
    // Guardar en memoria del navegador
    localStorage.setItem('athlosCarrito', JSON.stringify(carrito));
    
    // Actualizar UI
    actualizarContador();
    renderizarItems();
    calcularTotal();
}

function actualizarContador() {
    if (contadorCarrito) {
        contadorCarrito.textContent = carrito.length;
        // Animación de rebote si cambia el número
        contadorCarrito.classList.add('animate-bounce');
        setTimeout(() => contadorCarrito.classList.remove('animate-bounce'), 300);
    }
}

function renderizarItems() {
    if (!contenedorItems) return;

    if (carrito.length === 0) {
        contenedorItems.innerHTML = '<p class="text-center text-secondary py-5">Tu cesta está vacía.</p>';
        return;
    }

    contenedorItems.innerHTML = carrito.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-3 p-2 border-bottom border-secondary animate-fade">
            <div>
                <h6 class="mb-0 small text-uppercase fw-bold text-white">${item.nombre}</h6>
                <span class="text-gold-flat small">${item.precio.toFixed(2)}€</span>
            </div>
            <button class="btn btn-sm text-danger" onclick="eliminarDelCarrito(${item.id})">
                ✕
            </button>
        </div>
    `).join('');
}

function calcularTotal() {
    if (!totalPrecio) return;
    const total = carrito.reduce((sum, item) => sum + item.precio, 0);
    totalPrecio.textContent = `${total.toFixed(2)}€`;
}

// 5. Cargar al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    guardarYActualizar();
});
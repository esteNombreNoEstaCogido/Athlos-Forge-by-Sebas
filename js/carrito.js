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

    // Limpiar contenedor
    contenedorItems.innerHTML = '';

    // Si el carrito está vacío, mostrar mensaje
    if (carrito.length === 0) {
        const mensajeVacio = document.createElement('p');
        mensajeVacio.className = 'text-center text-white py-5';
        mensajeVacio.textContent = 'Tu cesta está vacía.';
        contenedorItems.appendChild(mensajeVacio);
        return;
    }

    // Crear item del carrito para cada producto
    carrito.forEach(item => {
        // Contenedor principal del item
        const itemDiv = document.createElement('div');
        itemDiv.className = 'd-flex justify-content-between align-items-center mb-3 p-2 border-bottom border-secondary animate-fade';

        // Contenedor de información (nombre y precio)
        const infoDiv = document.createElement('div');

        // Nombre del producto
        const nombreH6 = document.createElement('h6');
        nombreH6.className = 'mb-0 small text-uppercase fw-bold text-white';
        nombreH6.textContent = item.nombre;
        infoDiv.appendChild(nombreH6);

        // Precio del producto
        const precioSpan = document.createElement('span');
        precioSpan.className = 'text-gold-flat small';
        precioSpan.textContent = `${item.precio.toFixed(2)}€`;
        infoDiv.appendChild(precioSpan);

        // Botón de eliminar
        const botonEliminar = document.createElement('button');
        botonEliminar.className = 'btn btn-sm text-danger';
        botonEliminar.textContent = '✕';
        botonEliminar.setAttribute('aria-label', `Eliminar ${item.nombre} del carrito`);
        botonEliminar.addEventListener('click', () => eliminarDelCarrito(item.id));

        // Ensamblar estructura
        itemDiv.appendChild(infoDiv);
        itemDiv.appendChild(botonEliminar);
        contenedorItems.appendChild(itemDiv);
    });
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
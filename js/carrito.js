// js/carrito.js
// Carrito de compras integrado con la API REST y base de datos
// Validaciones: stock, duplicados, totales, producto inexistente

const API_URL = 'php/api.php';

// Estado local del carrito (respaldo + UI instantánea)
let carrito = JSON.parse(localStorage.getItem('athlosCarrito')) || [];

// Referencias al DOM
const contadorCarrito = document.getElementById('cart-count');
const contenedorItems = document.getElementById('cart-items-container');
const totalPrecio = document.getElementById('cart-total');

// ============ COMPROBAR SESIÓN ============

function getUsuarioLocal() {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
}

function estaAutenticado() {
    return getUsuarioLocal() !== null;
}

// ============ AGREGAR AL CARRITO ============

window.agregarAlCarrito = async function(nombre, precio, idArticulo) {
    // Si el usuario está autenticado → agregar vía API (valida stock, duplicados en BD)
    if (estaAutenticado()) {
        try {
            const response = await fetch(`${API_URL}?action=carrito_agregar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id_articulo: idArticulo, cantidad: 1 })
            });
            const data = await response.json();

            if (data.success) {
                mostrarNotificacion(data.mensaje, 'success');
                await sincronizarCarritoDesdeAPI();
            } else {
                // Mensajes de validación del servidor (stock, inexistente, etc.)
                mostrarNotificacion(data.mensaje, 'error');
            }
        } catch (error) {
            mostrarNotificacion('Error de conexión. Guardado localmente.', 'warning');
            agregarLocal(nombre, precio, idArticulo);
        }
    } else {
        // Sin sesión → carrito local
        agregarLocal(nombre, precio, idArticulo);
        mostrarNotificacion(`${nombre} añadido a la cesta.`, 'success');
    }
};

function agregarLocal(nombre, precio, idArticulo) {
    // Verificar duplicado local
    const existente = carrito.find(item => item.id_articulo === idArticulo);
    if (existente) {
        existente.cantidad = (existente.cantidad || 1) + 1;
        existente.subtotal = existente.cantidad * existente.precio;
    } else {
        carrito.push({
            id: Date.now(),
            id_articulo: idArticulo,
            nombre: nombre,
            precio: parseFloat(precio),
            cantidad: 1,
            subtotal: parseFloat(precio)
        });
    }
    guardarYActualizar();
}

// ============ ELIMINAR DEL CARRITO ============

window.eliminarDelCarrito = async function(id, idServidor) {
    if (estaAutenticado() && idServidor) {
        try {
            const response = await fetch(`${API_URL}?action=carrito_eliminar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id: idServidor })
            });
            const data = await response.json();
            if (data.success) {
                await sincronizarCarritoDesdeAPI();
                mostrarNotificacion('Eliminado del carrito', 'success');
            }
        } catch (error) {
            carrito = carrito.filter(item => item.id !== id);
            guardarYActualizar();
        }
    } else {
        carrito = carrito.filter(item => item.id !== id);
        guardarYActualizar();
    }
};

// ============ ACTUALIZAR CANTIDAD ============

window.actualizarCantidad = async function(id, idServidor, nuevaCantidad) {
    if (nuevaCantidad < 1) return;

    if (estaAutenticado() && idServidor) {
        try {
            const response = await fetch(`${API_URL}?action=carrito_actualizar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id: idServidor, cantidad: nuevaCantidad })
            });
            const data = await response.json();
            if (data.success) {
                await sincronizarCarritoDesdeAPI();
            } else {
                mostrarNotificacion(data.mensaje, 'error');
            }
        } catch (error) {
            mostrarNotificacion('Error al actualizar cantidad', 'error');
        }
    } else {
        const item = carrito.find(i => i.id === id);
        if (item) {
            item.cantidad = nuevaCantidad;
            item.subtotal = item.precio * nuevaCantidad;
            guardarYActualizar();
        }
    }
};

// ============ SINCRONIZAR CON API ============

async function sincronizarCarritoDesdeAPI() {
    if (!estaAutenticado()) return;

    try {
        const response = await fetch(`${API_URL}?action=carrito_obtener`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            carrito = data.datos.map(item => ({
                id: item.id,
                id_servidor: item.id,
                id_articulo: item.id_articulo,
                nombre: item.nombre,
                precio: parseFloat(item.precio_unitario),
                cantidad: item.cantidad,
                subtotal: parseFloat(item.subtotal),
                stock: item.stock,
                aviso_stock: item.aviso_stock || null
            }));
            guardarYActualizar();

            // Mostrar avisos de stock si los hay
            if (data.avisos && data.avisos.length > 0) {
                mostrarNotificacion('Aviso: algunos productos tienen stock limitado', 'warning');
            }
        }
    } catch (error) {
        // Usar datos locales si falla
    }
}

// ============ FINALIZAR COMPRA ============

window.finalizarCompra = async function() {
    if (!estaAutenticado()) {
        mostrarNotificacion('Debes iniciar sesión para finalizar la compra', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    if (carrito.length === 0) {
        mostrarNotificacion('Tu carrito está vacío', 'warning');
        return;
    }

    // Obtener perfil para verificar tarjeta guardada
    let tarjetaMasked = null;
    try {
        const resPerfil = await fetch(`${API_URL}?action=perfil`, { credentials: 'include' });
        const dataPerfil = await resPerfil.json();
        if (dataPerfil.success && dataPerfil.datos.tarjeta_credito) {
            tarjetaMasked = dataPerfil.datos.tarjeta_credito;
        }
    } catch (e) { /* continuar sin datos de tarjeta */ }

    if (!tarjetaMasked) {
        mostrarNotificacion('No tienes una tarjeta de crédito registrada. Añade una en tu perfil o regístrate con tarjeta.', 'error');
        return;
    }

    // Mostrar confirmación con tarjeta guardada
    const confirmado = await confirmarCompra(tarjetaMasked);
    if (!confirmado) return;

    try {
        const response = await fetch(`${API_URL}?action=crear_pedido`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({})
        });
        const data = await response.json();

        if (data.success) {
            carrito = [];
            guardarYActualizar();
            mostrarConfirmacionPedido(data.datos);
        } else {
            if (data.errores) {
                let msg = data.mensaje + '\n' + data.errores.join('\n');
                mostrarNotificacion(msg, 'error');
            } else {
                mostrarNotificacion(data.mensaje, 'error');
            }
        }
    } catch (error) {
        mostrarNotificacion('Error de conexión al procesar el pedido', 'error');
    }
};

// ============ MODAL CONFIRMACIÓN DE COMPRA ============

function confirmarCompra(tarjetaMasked) {
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;';
        
        const modal = document.createElement('div');
        modal.style.cssText = 'background:#2d2d2d;border:1px solid #D4AF37;border-radius:10px;padding:30px;max-width:400px;width:90%;color:#fff;';
        modal.innerHTML = `
            <h4 style="color:#D4AF37;margin-bottom:15px;text-align:center;">Confirmar Compra</h4>
            <div style="background:#1a1a1a;border-radius:5px;padding:15px;margin-bottom:20px;">
                <p style="margin-bottom:10px;font-size:0.9em;">Resumen del pedido:</p>
                <p style="font-size:1.3em;font-weight:bold;color:#D4AF37;margin-bottom:15px;">${total.toFixed(2)}€</p>
                <div style="border-top:1px solid #444;padding-top:10px;">
                    <p style="font-size:0.85em;color:#aaa;margin-bottom:5px;">Método de pago:</p>
                    <p style="font-size:1em;letter-spacing:1px;">💳 ${tarjetaMasked}</p>
                </div>
            </div>
            <div style="display:flex;gap:10px;">
                <button id="btnCancelarCheckout" style="flex:1;padding:10px;background:#555;color:#fff;border:none;border-radius:5px;cursor:pointer;">Cancelar</button>
                <button id="btnConfirmarCheckout" style="flex:1;padding:10px;background:linear-gradient(135deg,#D4AF37,#B8860B);color:#1a1a1a;border:none;border-radius:5px;cursor:pointer;font-weight:bold;">Confirmar Pago</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        modal.querySelector('#btnCancelarCheckout').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(false);
        });

        modal.querySelector('#btnConfirmarCheckout').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(true);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve(false);
            }
        });
    });
}

// ============ CONFIRMACIÓN DE PEDIDO ============

function mostrarConfirmacionPedido(datos) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;';
    
    const modal = document.createElement('div');
    modal.style.cssText = 'background:#2d2d2d;border:2px solid #D4AF37;border-radius:10px;padding:30px;max-width:450px;width:90%;color:#fff;text-align:center;';
    modal.innerHTML = `
        <div style="font-size:3em;margin-bottom:10px;">✅</div>
        <h3 style="color:#D4AF37;margin-bottom:10px;">¡Pedido Confirmado!</h3>
        <p style="margin-bottom:15px;">Tu pedido ha sido procesado correctamente</p>
        <div style="background:#1a1a1a;border-radius:5px;padding:15px;text-align:left;margin-bottom:15px;">
            <p><strong style="color:#D4AF37;">Nº Pedido:</strong> ${datos.numero_pedido}</p>
            <p><strong style="color:#D4AF37;">Total:</strong> ${datos.total.toFixed(2)}€</p>
            <p><strong style="color:#D4AF37;">Estado:</strong> ${datos.estado}</p>
            <p><strong style="color:#D4AF37;">Tarjeta:</strong> ${datos.tarjeta_usada}</p>
            <p><strong style="color:#D4AF37;">Entrega estimada:</strong> ${formatearFecha(datos.fecha_entrega_estimada)}</p>
            ${datos.email_enviado ? '<p style="color:#28a745;margin-top:10px;">📧 Email de confirmación enviado</p>' : '<p style="color:#ffc107;margin-top:10px;">📧 El email de confirmación será enviado en breve</p>'}
        </div>
        <button onclick="this.closest('div[style*=fixed]').remove()" 
                style="padding:12px 30px;background:linear-gradient(135deg,#D4AF37,#B8860B);color:#1a1a1a;border:none;border-radius:5px;cursor:pointer;font-weight:bold;font-size:1em;">
            Entendido
        </button>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return 'Pendiente';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ============ NOTIFICACIONES ============

function mostrarNotificacion(mensaje, tipo) {
    const colores = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        padding: 15px 20px; border-radius: 8px; color: #fff;
        background: ${colores[tipo] || colores.info};
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        font-weight: bold; max-width: 400px; font-size: 0.9em;
        animation: slideIn 0.3s ease-out;
    `;
    notif.textContent = mensaje;
    
    // Añadir animación CSS si no existe
    if (!document.getElementById('notifStyles')) {
        const style = document.createElement('style');
        style.id = 'notifStyles';
        style.textContent = '@keyframes slideIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}';
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.3s';
        setTimeout(() => notif.remove(), 300);
    }, 3500);
}

// ============ UI: GUARDAR Y RENDERIZAR ============

function guardarYActualizar() {
    localStorage.setItem('athlosCarrito', JSON.stringify(carrito));
    actualizarContador();
    renderizarItems();
    calcularTotal();
}

function actualizarContador() {
    if (contadorCarrito) {
        const total = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
        contadorCarrito.textContent = total;
        contadorCarrito.classList.add('animate-bounce');
        setTimeout(() => contadorCarrito.classList.remove('animate-bounce'), 300);
    }
}

function renderizarItems() {
    if (!contenedorItems) return;
    contenedorItems.innerHTML = '';

    if (carrito.length === 0) {
        const mensajeVacio = document.createElement('p');
        mensajeVacio.className = 'text-center text-white py-5';
        mensajeVacio.textContent = 'Tu cesta está vacía.';
        contenedorItems.appendChild(mensajeVacio);
        return;
    }

    carrito.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'd-flex justify-content-between align-items-center mb-3 p-2 border-bottom border-secondary animate-fade';

        const infoDiv = document.createElement('div');
        infoDiv.style.flex = '1';

        const nombreH6 = document.createElement('h6');
        nombreH6.className = 'mb-0 small text-uppercase fw-bold text-white';
        nombreH6.textContent = item.nombre;
        infoDiv.appendChild(nombreH6);

        // Cantidad con controles
        const cantidadDiv = document.createElement('div');
        cantidadDiv.className = 'd-flex align-items-center gap-2 mt-1';
        
        const btnMenos = document.createElement('button');
        btnMenos.className = 'btn btn-sm btn-outline-secondary';
        btnMenos.textContent = '-';
        btnMenos.style.cssText = 'width:24px;height:24px;padding:0;line-height:1;font-size:0.8em;';
        btnMenos.addEventListener('click', () => actualizarCantidad(item.id, item.id_servidor, (item.cantidad || 1) - 1));
        
        const cantSpan = document.createElement('span');
        cantSpan.className = 'text-white small';
        cantSpan.textContent = `x${item.cantidad || 1}`;
        
        const btnMas = document.createElement('button');
        btnMas.className = 'btn btn-sm btn-outline-secondary';
        btnMas.textContent = '+';
        btnMas.style.cssText = 'width:24px;height:24px;padding:0;line-height:1;font-size:0.8em;';
        btnMas.addEventListener('click', () => actualizarCantidad(item.id, item.id_servidor, (item.cantidad || 1) + 1));
        
        cantidadDiv.appendChild(btnMenos);
        cantidadDiv.appendChild(cantSpan);
        cantidadDiv.appendChild(btnMas);
        infoDiv.appendChild(cantidadDiv);

        // Precio
        const precioSpan = document.createElement('span');
        precioSpan.className = 'text-gold-flat small';
        precioSpan.textContent = `${(item.subtotal || item.precio).toFixed(2)}€`;
        infoDiv.appendChild(precioSpan);

        // Aviso de stock
        if (item.aviso_stock) {
            const aviso = document.createElement('small');
            aviso.className = 'd-block mt-1';
            aviso.style.color = '#ffc107';
            aviso.textContent = '⚠ ' + item.aviso_stock;
            infoDiv.appendChild(aviso);
        }

        // Botón eliminar
        const botonEliminar = document.createElement('button');
        botonEliminar.className = 'btn btn-sm text-danger';
        botonEliminar.textContent = '✕';
        botonEliminar.setAttribute('aria-label', `Eliminar ${item.nombre} del carrito`);
        botonEliminar.addEventListener('click', () => eliminarDelCarrito(item.id, item.id_servidor));

        itemDiv.appendChild(infoDiv);
        itemDiv.appendChild(botonEliminar);
        contenedorItems.appendChild(itemDiv);
    });
}

function calcularTotal() {
    if (!totalPrecio) return;
    const total = carrito.reduce((sum, item) => sum + (item.subtotal || item.precio * (item.cantidad || 1)), 0);
    totalPrecio.textContent = `${total.toFixed(2)}€`;
}

// ============ INICIALIZAR ============

document.addEventListener('DOMContentLoaded', async () => {
    // Si está autenticado, sincronizar carrito con el servidor
    if (estaAutenticado()) {
        await sincronizarCarritoDesdeAPI();
    } else {
        guardarYActualizar();
    }
});
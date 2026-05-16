// js/carrito.js
// Carrito de compras integrado con la API REST y base de datos
// Validaciones: stock, duplicados, totales, producto inexistente

let API_URL = 'php/api.php';
const API_CANDIDATES = [
    '/api/api.php',
    'http://localhost/Athlos%20Forge%20by%20Sebas/php/api.php',
    'http://127.0.0.1/Athlos%20Forge%20by%20Sebas/php/api.php',
    'php/api.php',
    '/php/api.php',
    '/Athlos%20Forge%20by%20Sebas/php/api.php'
];
let apiResuelta = false;

function parseJSONSeguro(valor, fallback) {
    if (!valor) return fallback;
    try {
        return JSON.parse(valor);
    } catch (e) {
        return fallback;
    }
}

function storageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

function storageSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        // Si el storage no está disponible, continuamos sin persistencia local
    }
}

function storageRemove(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        // Si el storage no está disponible, no hacemos nada
    }
}

// Estado local del carrito (respaldo + UI instantánea)
let carrito = parseJSONSeguro(storageGet('athlosCarrito'), []);
if (!Array.isArray(carrito)) {
    carrito = [];
    storageRemove('athlosCarrito');
}

// Referencias al DOM
const contadorCarrito = document.getElementById('cart-count');
const contenedorItems = document.getElementById('cart-items-container');
const totalPrecio = document.getElementById('cart-total');

// ============ COMPROBAR SESIÓN ============

function getUsuarioLocal() {
    const u = storageGet('usuario');
    const usuario = parseJSONSeguro(u, null);
    if (usuario === null && u) {
        storageRemove('usuario');
    }
    return usuario;
}

function estaAutenticado() {
    return getUsuarioLocal() !== null;
}

async function resolverApiUrl() {
    if (apiResuelta) return;
    for (const candidata of API_CANDIDATES) {
        try {
            const res = await fetch(`${candidata}?action=sesion`, { credentials: 'include' });
            if (!res.ok) continue;
            const contentType = (res.headers.get('content-type') || '').toLowerCase();
            if (!contentType.includes('application/json')) continue;
            const data = await res.json();
            if (data && data.success === true && typeof data.autenticado === 'boolean') {
                API_URL = candidata;
                apiResuelta = true;
                return;
            }
        } catch (e) {
            // Probar siguiente candidata
        }
    }
}

async function apiRequest(action, options = {}) {
    await resolverApiUrl();
    return fetch(`${API_URL}?action=${encodeURIComponent(action)}`, {
        credentials: 'include',
        ...options
    });
}

// ============ AGREGAR AL CARRITO ============

window.agregarAlCarrito = async function(nombre, precio, idArticulo) {
    // Si el usuario está autenticado → agregar vía API (valida stock, duplicados en BD)
    if (estaAutenticado()) {
        try {
            const response = await apiRequest('carrito_agregar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_articulo: idArticulo, cantidad: 1 })
            });
            const data = await response.json();

            if (data.success) {
                mostrarNotificacion(data.mensaje, 'success');
                await sincronizarCarritoDesdeAPI();
            } else {
                // El servidor puede devolver mensajes de stock insuficiente, producto inexistente, etc.
                mostrarNotificacion(data.mensaje, 'error');
            }
        } catch (error) {
            mostrarNotificacion('Error de conexión. Guardado localmente.', 'warning');
            agregarLocal(nombre, precio, idArticulo);
        }
    } else {
        // Sin sesión activa → usar carrito local (localStorage)
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
            const response = await apiRequest('carrito_eliminar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: idServidor })
            });
            const data = await response.json();
            if (data.success) {
                await sincronizarCarritoDesdeAPI();
                mostrarNotificacion('Eliminado del carrito', 'success');
            } else {
                // El servidor devuelve el motivo del error al eliminar
                mostrarNotificacion(data.mensaje || 'No se pudo eliminar el artículo', 'error');
            }
        } catch (error) {
            // Sin conexión: eliminar localmente como fallback
            carrito = carrito.filter(item => item.id !== id);
            guardarYActualizar();
            mostrarNotificacion('Eliminado localmente (sin conexión)', 'warning');
        }
    } else {
        carrito = carrito.filter(item => item.id !== id);
        guardarYActualizar();
        mostrarNotificacion('Artículo eliminado de la cesta', 'success');
    }
};

// ============ ACTUALIZAR CANTIDAD ============

window.actualizarCantidad = async function(id, idServidor, nuevaCantidad) {
    // Si la nueva cantidad es 0 o negativa, eliminar el artículo directamente
    if (nuevaCantidad < 1) {
        await eliminarDelCarrito(id, idServidor);
        return;
    }

    if (estaAutenticado() && idServidor) {
        try {
            const response = await apiRequest('carrito_actualizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        const response = await apiRequest('carrito_obtener');
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
    const payloadPedido = {};
    try {
        const resPerfil = await apiRequest('perfil');
        const dataPerfil = await resPerfil.json();
        if (dataPerfil.success && dataPerfil.datos.tarjeta_credito) {
            tarjetaMasked = dataPerfil.datos.tarjeta_credito;
        }
    } catch (e) { /* continuar sin datos de tarjeta */ }

    if (!tarjetaMasked) {
        const tarjetaNueva = await solicitarTarjetaParaCompra();
        if (!tarjetaNueva) return;
        tarjetaMasked = tarjetaNueva.enmascarada;
        payloadPedido.tarjeta = tarjetaNueva.numero;
    }

    // Mostrar confirmación con tarjeta guardada
    const confirmado = await confirmarCompra(tarjetaMasked);
    if (!confirmado) return;

    try {
        const response = await apiRequest('crear_pedido', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadPedido)
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

function solicitarTarjetaParaCompra() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;';

        const modal = document.createElement('div');
        modal.style.cssText = 'background:#2d2d2d;border:1px solid #D4AF37;border-radius:10px;padding:24px;max-width:460px;width:92%;color:#fff;';
        modal.innerHTML = `
            <h4 style="color:#D4AF37;margin-bottom:12px;text-align:center;">Añade una tarjeta para continuar</h4>
            <p style="font-size:0.9em;color:#ddd;margin-bottom:12px;">
                No tienes una tarjeta registrada. Puedes introducirla ahora para finalizar la compra.
            </p>
            <input id="tarjetaCheckoutInput" type="text" placeholder="1234 5678 9012 3456"
                   style="width:100%;padding:10px 12px;border-radius:6px;border:1px solid #555;background:#1a1a1a;color:#fff;margin-bottom:8px;">
            <small id="tarjetaCheckoutError" style="display:none;color:#ff7b7b;">Introduce una tarjeta válida (13-19 dígitos).</small>
            <div style="display:flex;gap:10px;margin-top:14px;">
                <button id="btnCancelarTarjeta" style="flex:1;padding:10px;background:#555;color:#fff;border:none;border-radius:5px;cursor:pointer;">Cancelar</button>
                <button id="btnGuardarTarjeta" style="flex:1;padding:10px;background:linear-gradient(135deg,#D4AF37,#B8860B);color:#1a1a1a;border:none;border-radius:5px;cursor:pointer;font-weight:bold;">Guardar y continuar</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const input = modal.querySelector('#tarjetaCheckoutInput');
        const error = modal.querySelector('#tarjetaCheckoutError');
        const limpiar = () => input.value.replace(/[\s-]/g, '');

        modal.querySelector('#btnCancelarTarjeta').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(null);
        });

        modal.querySelector('#btnGuardarTarjeta').addEventListener('click', () => {
            const numero = limpiar();
            if (!/^\d{13,19}$/.test(numero)) {
                error.style.display = 'block';
                return;
            }
            const enmascarada = `**** **** **** ${numero.slice(-4)}`;
            document.body.removeChild(overlay);
            resolve({ numero, enmascarada });
        });

        input.addEventListener('input', () => {
            error.style.display = 'none';
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve(null);
            }
        });
    });
}

function confirmarCompra(tarjetaMasked) {
    const total = carrito.reduce((sum, item) => {
        const subtotal = Number(item.subtotal ?? (Number(item.precio || 0) * Number(item.cantidad || 1)));
        return sum + subtotal;
    }, 0);
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;';
        
        const modal = document.createElement('div');
        modal.style.cssText = 'background:#2d2d2d;border:1px solid #D4AF37;border-radius:10px;padding:30px;max-width:400px;width:90%;color:#fff;';
        modal.innerHTML = `
            <h4 style="color:#D4AF37;margin-bottom:15px;text-align:center;">Confirmar Compra</h4>
            <div style="background:#1a1a1a;border-radius:5px;padding:15px;margin-bottom:20px;">
                <p style="margin-bottom:10px;font-size:0.9em;">Resumen del pedido:</p>
                <p style="font-size:1.3em;font-weight:bold;color:#D4AF37;margin-bottom:15px;">${total.toFixed(2)}&euro;</p>
                <div style="border-top:1px solid #444;padding-top:10px;">
                    <p style="font-size:0.85em;color:#aaa;margin-bottom:5px;">Método de pago:</p>
                    <p style="font-size:1em;letter-spacing:1px;">&#128179; ${tarjetaMasked}</p>
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
        <div style="font-size:3em;margin-bottom:10px;">&#9989;</div>
        <h3 style="color:#D4AF37;margin-bottom:10px;">&#161;Pedido Confirmado!</h3>
        <p style="margin-bottom:15px;">Tu pedido ha sido procesado correctamente</p>
        <div style="background:#1a1a1a;border-radius:5px;padding:15px;text-align:left;margin-bottom:15px;">
            <p><strong style="color:#D4AF37;">N&ordm; Pedido:</strong> ${datos.numero_pedido}</p>
            <p><strong style="color:#D4AF37;">Total:</strong> ${datos.total.toFixed(2)}&euro;</p>
            <p><strong style="color:#D4AF37;">Estado:</strong> ${datos.estado}</p>
            <p><strong style="color:#D4AF37;">Tarjeta:</strong> ${datos.tarjeta_usada}</p>
            <p><strong style="color:#D4AF37;">Entrega estimada:</strong> ${formatearFecha(datos.fecha_entrega_estimada)}</p>
            ${datos.email_enviado ? '<p style="color:#28a745;margin-top:10px;">&#128231; Email de confirmación enviado</p>' : '<p style="color:#ffc107;margin-top:10px;">&#128231; El email de confirmación será enviado en breve</p>'}
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
    storageSet('athlosCarrito', JSON.stringify(carrito));
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
        // Al llegar a 0, el item se elimina del carrito automáticamente
        btnMenos.addEventListener('click', () => actualizarCantidad(item.id, item.id_servidor, (item.cantidad || 1) - 1));
        
        const cantSpan = document.createElement('span');
        cantSpan.className = 'text-white small';
        cantSpan.textContent = 'x' + (item.cantidad || 1);
        
        const btnMas = document.createElement('button');
        btnMas.className = 'btn btn-sm btn-outline-secondary';
        btnMas.textContent = '+';
        btnMas.style.cssText = 'width:24px;height:24px;padding:0;line-height:1;font-size:0.8em;';
        btnMas.addEventListener('click', () => actualizarCantidad(item.id, item.id_servidor, (item.cantidad || 1) + 1));
        
        cantidadDiv.appendChild(btnMenos);
        cantidadDiv.appendChild(cantSpan);
        cantidadDiv.appendChild(btnMas);
        infoDiv.appendChild(cantidadDiv);

        // Se usa unicode escape \u20AC para el símbolo del euro (€)
        const precioSpan = document.createElement('span');
        precioSpan.className = 'text-gold-flat small';
        const subtotalSeguro = Number(item.subtotal ?? (Number(item.precio || 0) * Number(item.cantidad || 1)));
        precioSpan.textContent = subtotalSeguro.toFixed(2) + '\u20AC';
        infoDiv.appendChild(precioSpan);

        // Aviso de stock
        if (item.aviso_stock) {
            const aviso = document.createElement('small');
            aviso.className = 'd-block mt-1';
            aviso.style.color = '#ffc107';
            aviso.textContent = '\u26A0 ' + item.aviso_stock;
            infoDiv.appendChild(aviso);
        }

        // Botón eliminar
        const botonEliminar = document.createElement('button');
        botonEliminar.className = 'btn btn-sm text-danger';
        botonEliminar.textContent = '\u2715';
        botonEliminar.setAttribute('aria-label', 'Eliminar ' + item.nombre + ' del carrito');
        botonEliminar.addEventListener('click', () => eliminarDelCarrito(item.id, item.id_servidor));

        itemDiv.appendChild(infoDiv);
        itemDiv.appendChild(botonEliminar);
        contenedorItems.appendChild(itemDiv);
    });
}

function calcularTotal() {
    if (!totalPrecio) return;
    const total = carrito.reduce((sum, item) => {
        const subtotal = Number(item.subtotal ?? (Number(item.precio || 0) * Number(item.cantidad || 1)));
        return sum + subtotal;
    }, 0);
    // FIX: usar unicode escape para el símbolo euro
    totalPrecio.textContent = total.toFixed(2) + '\u20AC';
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

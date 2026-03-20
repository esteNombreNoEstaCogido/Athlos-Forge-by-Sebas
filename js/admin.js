// js/admin.js
// Panel de administración - Athlos Forge

const API_URL = 'php/api.php';
let productosCache = [];
let categoriasCache = [];
let pedidosCache = [];
let usuariosCache = [];

// ============ INICIALIZACIÓN ============

document.addEventListener('DOMContentLoaded', async () => {
    const usuario = await verificarAdmin();
    if (!usuario) return;

    document.getElementById('userGreeting').textContent = 'Admin: ' + usuario.nombre;
    document.getElementById('userGreeting').style.display = 'block';

    cargarDashboard();
});

async function verificarAdmin() {
    try {
        const res = await fetch(`${API_URL}?action=sesion`, { credentials: 'include' });
        const data = await res.json();

        if (!data.success || !data.autenticado || data.usuario.rol !== 'administrador') {
            document.getElementById('adminContent').innerHTML = `
                <div class="text-center" style="padding:80px 20px;">
                    <i class="bi bi-shield-x" style="font-size:4em;color:#dc3545;"></i>
                    <h3 class="mt-3">Acceso Denegado</h3>
                    <p class="text-muted">Necesitas permisos de administrador para acceder a este panel.</p>
                    <a href="login.html" class="btn btn-gold-sm px-4 py-2 mt-2">Iniciar Sesión</a>
                </div>`;
            return null;
        }

        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        return data.usuario;
    } catch (e) {
        document.getElementById('adminContent').innerHTML = `
            <div class="text-center" style="padding:80px 20px;">
                <i class="bi bi-exclamation-triangle" style="font-size:4em;color:#ffc107;"></i>
                <h3 class="mt-3">Error de Conexión</h3>
                <p class="text-muted">No se pudo conectar con el servidor.</p>
            </div>`;
        return null;
    }
}

// ============ NAVEGACIÓN ============

function cambiarSeccion(seccion, link) {
    event.preventDefault();
    document.querySelectorAll('.admin-sidebar .nav-link').forEach(l => l.classList.remove('active'));
    if (link) link.classList.add('active');

    switch (seccion) {
        case 'dashboard': cargarDashboard(); break;
        case 'productos': cargarProductos(); break;
        case 'categorias': cargarCategorias(); break;
        case 'pedidos': cargarPedidos(); break;
        case 'usuarios': cargarUsuarios(); break;
    }
}

// ============ DASHBOARD ============

async function cargarDashboard() {
    document.getElementById('adminContent').innerHTML = `
        <div class="admin-loading"><div class="spinner-border" role="status"></div><p class="mt-2">Cargando...</p></div>`;

    try {
        const [resProd, resPed, resUsr] = await Promise.all([
            fetch(`${API_URL}?action=productos`, { credentials: 'include' }).then(r => r.json()),
            fetch(`${API_URL}?action=admin_pedidos`, { credentials: 'include' }).then(r => r.json()),
            fetch(`${API_URL}?action=admin_usuarios`, { credentials: 'include' }).then(r => r.json())
        ]);

        const productos = resProd.success ? resProd.datos : [];
        const pedidos = resPed.success ? resPed.datos : [];
        const usuarios = resUsr.success ? resUsr.datos : [];

        const totalVentas = pedidos
            .filter(p => p.estado !== 'cancelado')
            .reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

        const stockBajo = productos.filter(p => parseInt(p.stock) <= 5).length;
        const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'confirmado').length;

        const ultimosPedidos = pedidos.slice(0, 5);

        document.getElementById('adminContent').innerHTML = `
            <h4 class="text-gold-flat mb-4"><i class="bi bi-speedometer2"></i> Dashboard</h4>
            
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-number">${productos.length}</div>
                        <div class="stat-label">Productos</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-number">${pedidos.length}</div>
                        <div class="stat-label">Pedidos Totales</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-number">${usuarios.length}</div>
                        <div class="stat-label">Usuarios</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-number">${totalVentas.toFixed(2)}€</div>
                        <div class="stat-label">Ventas Totales</div>
                    </div>
                </div>
            </div>

            <div class="row g-3">
                <div class="col-md-4">
                    <div class="stat-card">
                        <div class="stat-number" style="color:${pedidosPendientes > 0 ? '#ffc107' : '#28a745'}">${pedidosPendientes}</div>
                        <div class="stat-label">Pedidos Pendientes</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card">
                        <div class="stat-number" style="color:${stockBajo > 0 ? '#dc3545' : '#28a745'}">${stockBajo}</div>
                        <div class="stat-label">Productos Stock Bajo</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card">
                        <div class="stat-number">${usuarios.filter(u => u.rol === 'cliente').length}</div>
                        <div class="stat-label">Clientes</div>
                    </div>
                </div>
            </div>

            ${ultimosPedidos.length > 0 ? `
            <h5 class="mt-4 mb-3 text-white">Últimos Pedidos</h5>
            <div class="admin-table">
                <table class="table table-dark table-hover">
                    <thead><tr>
                        <th>Nº Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th>
                    </tr></thead>
                    <tbody>
                        ${ultimosPedidos.map(p => `
                        <tr>
                            <td>${p.numero_pedido}</td>
                            <td>${p.nombre} ${p.apellidos || ''}</td>
                            <td>${parseFloat(p.total).toFixed(2)}€</td>
                            <td><span class="badge-estado badge-${p.estado}">${p.estado}</span></td>
                            <td>${formatearFecha(p.fecha_pedido)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>` : ''}
        `;
    } catch (e) {
        document.getElementById('adminContent').innerHTML = '<p class="text-danger">Error al cargar el dashboard</p>';
    }
}

// ============ PRODUCTOS ============

async function cargarProductos() {
    document.getElementById('adminContent').innerHTML = `
        <div class="admin-loading"><div class="spinner-border" role="status"></div></div>`;

    try {
        const [resProd, resCat] = await Promise.all([
            fetch(`${API_URL}?action=productos`, { credentials: 'include' }).then(r => r.json()),
            fetch(`${API_URL}?action=categorias`, { credentials: 'include' }).then(r => r.json())
        ]);

        productosCache = resProd.success ? resProd.datos : [];
        categoriasCache = resCat.success ? resCat.datos : [];

        renderProductos();
    } catch (e) {
        document.getElementById('adminContent').innerHTML = '<p class="text-danger">Error al cargar productos</p>';
    }
}

function renderProductos() {
    document.getElementById('adminContent').innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4 class="text-gold-flat m-0"><i class="bi bi-box-seam"></i> Productos (${productosCache.length})</h4>
            <button class="btn btn-gold-sm px-3 py-2" onclick="abrirModalProducto()">
                <i class="bi bi-plus-lg"></i> Nuevo Producto
            </button>
        </div>
        <div class="admin-table">
            <table class="table table-dark table-hover">
                <thead><tr>
                    <th>ID</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Categoría</th><th>Estado</th><th>Acciones</th>
                </tr></thead>
                <tbody>
                    ${productosCache.map(p => {
                        const cat = categoriasCache.find(c => c.id == p.id_categoria);
                        const stockClass = parseInt(p.stock) <= 5 ? 'text-danger fw-bold' : '';
                        return `
                        <tr>
                            <td>${p.id}</td>
                            <td>${p.nombre}</td>
                            <td>${parseFloat(p.precio).toFixed(2)}€</td>
                            <td class="${stockClass}">${p.stock}</td>
                            <td>${cat ? cat.nombre : '-'}</td>
                            <td><span class="badge-estado badge-${p.disponible == 1 ? 'activo' : 'inactivo'}">${p.disponible == 1 ? 'Activo' : 'Inactivo'}</span></td>
                            <td>
                                <button class="btn btn-gold-sm me-1" onclick="abrirModalProducto(${p.id})" title="Editar"><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${p.id}, '${p.nombre.replace(/'/g, "\\'")}')" title="Desactivar"><i class="bi bi-trash"></i></button>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function abrirModalProducto(id = null) {
    const titulo = document.getElementById('modalProductoTitulo');
    const select = document.getElementById('prodCategoria');

    // Rellenar categorías
    select.innerHTML = '<option value="">Seleccionar...</option>' +
        categoriasCache.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

    if (id) {
        const prod = productosCache.find(p => p.id == id);
        if (!prod) return;
        titulo.textContent = 'Editar Producto';
        document.getElementById('prodId').value = prod.id;
        document.getElementById('prodNombre').value = prod.nombre;
        document.getElementById('prodDescripcion').value = prod.descripcion || '';
        document.getElementById('prodPrecio').value = prod.precio;
        document.getElementById('prodStock').value = prod.stock;
        document.getElementById('prodCategoria').value = prod.id_categoria;
        document.getElementById('prodImagen').value = prod.imagen_url || '';
    } else {
        titulo.textContent = 'Nuevo Producto';
        document.getElementById('formProducto').reset();
        document.getElementById('prodId').value = '';
    }

    new bootstrap.Modal(document.getElementById('modalProducto')).show();
}

async function guardarProducto() {
    const id = document.getElementById('prodId').value;
    const datos = {
        nombre: document.getElementById('prodNombre').value.trim(),
        descripcion: document.getElementById('prodDescripcion').value.trim(),
        precio: parseFloat(document.getElementById('prodPrecio').value),
        stock: parseInt(document.getElementById('prodStock').value),
        id_categoria: parseInt(document.getElementById('prodCategoria').value),
        imagen_url: document.getElementById('prodImagen').value.trim() || null
    };

    if (!datos.nombre || !datos.precio || isNaN(datos.stock) || !datos.id_categoria) {
        alert('Completa todos los campos obligatorios');
        return;
    }

    const action = id ? 'admin_editar_articulo' : 'admin_crear_articulo';
    if (id) datos.id = parseInt(id);

    try {
        const res = await fetch(`${API_URL}?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(datos)
        });
        const data = await res.json();

        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('modalProducto')).hide();
            cargarProductos();
        } else {
            alert(data.mensaje || 'Error al guardar');
        }
    } catch (e) {
        alert('Error de conexión');
    }
}

async function eliminarProducto(id, nombre) {
    if (!confirm(`¿Desactivar el producto "${nombre}"?`)) return;

    try {
        const res = await fetch(`${API_URL}?action=admin_eliminar_articulo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) cargarProductos();
        else alert(data.mensaje);
    } catch (e) {
        alert('Error de conexión');
    }
}

// ============ CATEGORÍAS ============

async function cargarCategorias() {
    document.getElementById('adminContent').innerHTML = `
        <div class="admin-loading"><div class="spinner-border" role="status"></div></div>`;

    try {
        const res = await fetch(`${API_URL}?action=categorias`, { credentials: 'include' });
        const data = await res.json();
        categoriasCache = data.success ? data.datos : [];

        document.getElementById('adminContent').innerHTML = `
            <h4 class="text-gold-flat mb-4"><i class="bi bi-tags"></i> Categorías (${categoriasCache.length})</h4>
            <div class="admin-table">
                <table class="table table-dark table-hover">
                    <thead><tr><th>ID</th><th>Nombre</th><th>Descripción</th></tr></thead>
                    <tbody>
                        ${categoriasCache.map(c => `
                        <tr>
                            <td>${c.id}</td>
                            <td>${c.nombre}</td>
                            <td>${c.descripcion || '-'}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (e) {
        document.getElementById('adminContent').innerHTML = '<p class="text-danger">Error al cargar categorías</p>';
    }
}

// ============ PEDIDOS ============

async function cargarPedidos() {
    document.getElementById('adminContent').innerHTML = `
        <div class="admin-loading"><div class="spinner-border" role="status"></div></div>`;

    try {
        const res = await fetch(`${API_URL}?action=admin_pedidos`, { credentials: 'include' });
        const data = await res.json();
        pedidosCache = data.success ? data.datos : [];

        renderPedidos();
    } catch (e) {
        document.getElementById('adminContent').innerHTML = '<p class="text-danger">Error al cargar pedidos</p>';
    }
}

function renderPedidos() {
    const estados = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'];

    document.getElementById('adminContent').innerHTML = `
        <h4 class="text-gold-flat mb-4"><i class="bi bi-cart-check"></i> Pedidos (${pedidosCache.length})</h4>
        ${pedidosCache.length === 0 ? '<p class="text-muted">No hay pedidos registrados.</p>' : `
        <div class="admin-table">
            <table class="table table-dark table-hover">
                <thead><tr>
                    <th>Nº Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Entrega Est.</th><th>Acciones</th>
                </tr></thead>
                <tbody>
                    ${pedidosCache.map(p => `
                    <tr>
                        <td>${p.numero_pedido}</td>
                        <td>${p.nombre} ${p.apellidos || ''}<br><small class="text-muted">${p.email}</small></td>
                        <td>${parseFloat(p.total).toFixed(2)}€</td>
                        <td>
                            <select class="form-select form-select-sm" style="background:#2d2d2d;color:#fff;border-color:rgba(212,175,55,0.2);width:130px;" 
                                    onchange="cambiarEstadoPedido(${p.id}, this.value)" ${p.estado === 'cancelado' || p.estado === 'entregado' ? 'disabled' : ''}>
                                ${estados.map(e => `<option value="${e}" ${p.estado === e ? 'selected' : ''}>${e.charAt(0).toUpperCase() + e.slice(1)}</option>`).join('')}
                            </select>
                        </td>
                        <td>${formatearFecha(p.fecha_pedido)}</td>
                        <td>${p.fecha_entrega_estimada ? formatearFecha(p.fecha_entrega_estimada) : '-'}</td>
                        <td><button class="btn btn-gold-sm" onclick="verDetallePedido(${p.id})"><i class="bi bi-eye"></i></button></td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`}
    `;
}

async function cambiarEstadoPedido(idPedido, nuevoEstado) {
    try {
        const res = await fetch(`${API_URL}?action=admin_estado_pedido`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id_pedido: idPedido, estado: nuevoEstado })
        });
        const data = await res.json();
        if (data.success) {
            cargarPedidos();
        } else {
            alert(data.mensaje);
            cargarPedidos();
        }
    } catch (e) {
        alert('Error de conexión');
    }
}

async function verDetallePedido(idPedido) {
    try {
        const res = await fetch(`${API_URL}?action=obtener_pedido&id=${idPedido}`, { credentials: 'include' });
        const data = await res.json();

        if (!data.success) { alert(data.mensaje); return; }

        const p = data.datos;
        document.getElementById('modalPedidoTitulo').textContent = 'Pedido ' + p.numero_pedido;
        document.getElementById('modalPedidoBody').innerHTML = `
            <div class="row mb-3">
                <div class="col-6">
                    <p><strong class="text-gold-flat">Estado:</strong> <span class="badge-estado badge-${p.estado}">${p.estado}</span></p>
                    <p><strong class="text-gold-flat">Fecha:</strong> ${formatearFecha(p.fecha_pedido)}</p>
                    <p><strong class="text-gold-flat">Entrega estimada:</strong> ${p.fecha_entrega_estimada ? formatearFecha(p.fecha_entrega_estimada) : '-'}</p>
                </div>
                <div class="col-6">
                    <p><strong class="text-gold-flat">Total:</strong> ${parseFloat(p.total).toFixed(2)}€</p>
                    <p><strong class="text-gold-flat">Dirección:</strong> ${p.direccion_envio || '-'}</p>
                    ${p.fecha_entrega_real ? `<p><strong class="text-gold-flat">Entregado:</strong> ${formatearFecha(p.fecha_entrega_real)}</p>` : ''}
                </div>
            </div>
            <h6 class="text-gold-flat mb-2">Artículos</h6>
            <table class="table table-dark table-sm">
                <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
                <tbody>
                    ${p.detalles.map(d => `
                    <tr>
                        <td>${d.nombre}</td>
                        <td>${d.cantidad}</td>
                        <td>${parseFloat(d.precio_unitario).toFixed(2)}€</td>
                        <td>${parseFloat(d.subtotal).toFixed(2)}€</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        `;

        new bootstrap.Modal(document.getElementById('modalPedido')).show();
    } catch (e) {
        alert('Error al cargar detalle del pedido');
    }
}

// ============ USUARIOS ============

async function cargarUsuarios() {
    document.getElementById('adminContent').innerHTML = `
        <div class="admin-loading"><div class="spinner-border" role="status"></div></div>`;

    try {
        const res = await fetch(`${API_URL}?action=admin_usuarios`, { credentials: 'include' });
        const data = await res.json();
        usuariosCache = data.success ? data.datos : [];

        document.getElementById('adminContent').innerHTML = `
            <h4 class="text-gold-flat mb-4"><i class="bi bi-people"></i> Usuarios (${usuariosCache.length})</h4>
            <div class="admin-table">
                <table class="table table-dark table-hover">
                    <thead><tr>
                        <th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Registro</th><th>Última Sesión</th>
                    </tr></thead>
                    <tbody>
                        ${usuariosCache.map(u => `
                        <tr>
                            <td>${u.id}</td>
                            <td>${u.nombre} ${u.apellidos || ''}</td>
                            <td>${u.email}</td>
                            <td><span class="badge bg-${u.rol === 'administrador' ? 'warning text-dark' : 'info'}">${u.rol}</span></td>
                            <td><span class="badge-estado badge-${u.estado}">${u.estado}</span></td>
                            <td>${formatearFecha(u.fecha_registro)}</td>
                            <td>${u.fecha_ultima_sesion ? formatearFecha(u.fecha_ultima_sesion) : 'Nunca'}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (e) {
        document.getElementById('adminContent').innerHTML = '<p class="text-danger">Error al cargar usuarios</p>';
    }
}

// ============ UTILIDADES ============

function formatearFecha(fechaStr) {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function logout() {
    try {
        await fetch(`${API_URL}?action=logout`, { method: 'POST', credentials: 'include' });
    } catch (e) { }
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

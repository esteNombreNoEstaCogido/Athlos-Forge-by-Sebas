/**
 * Módulo de Búsqueda - Athlos Forge
 * Gestiona la búsqueda dinámica de artículos (entrenamientos, servicios, blog)
 * Implementa AJAX para búsqueda en tiempo real sin recargar la página
 */

// Debounce timer para evitar múltiples búsquedas mientras el usuario escribe
let debounceTimer = null;

// Inicializar eventos cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    const formBuscador = document.getElementById('formBuscador');
    const inputBuscador = document.getElementById('buscadorInput');
    const cerrarResultados = document.getElementById('cerrarResultados');

    // Evento al enviar el formulario
    if (formBuscador) {
        formBuscador.addEventListener('submit', function(e) {
            e.preventDefault();
            realizarBusqueda(inputBuscador.value.trim());
        });
    }

    // Evento para cerrar los resultados
    if (cerrarResultados) {
        cerrarResultados.addEventListener('click', function() {
            cerrarSeccionResultados();
        });
    }

    // Búsqueda en tiempo real mientras el usuario escribe (con debounce)
    if (inputBuscador) {
        inputBuscador.addEventListener('keyup', function() {
            clearTimeout(debounceTimer);
            
            const termino = this.value.trim();
            
            // Solo buscar si hay al menos 2 caracteres
            if (termino.length >= 2) {
                debounceTimer = setTimeout(function() {
                    realizarBusqueda(termino);
                }, 300); // Esperar 300ms después de que el usuario deje de escribir
            }
        });
    }
});

/**
 * Realiza la búsqueda AJAX
 * @param {string} termino - Término a buscar
 */
async function realizarBusqueda(termino) {
    if (termino.length < 2) {
        mostrarNotificacion('Escribe al menos 2 caracteres para buscar', 'warning');
        return;
    }

    try {
        // Mostrar indicador de carga
        const galeriaResultados = document.getElementById('galeriaResultados');
        if (galeriaResultados) {
            galeriaResultados.innerHTML = '<div class="col-12 text-center"><p class="text-secondary">Buscando...</p></div>';
        }
        
        // Realizar llamada AJAX
        const response = await fetch(`php/api.php?action=buscar&q=${encodeURIComponent(termino)}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const resultado = await response.json();

        if (resultado.success) {
            renderizarResultados(resultado.datos, termino, resultado.total);
        } else {
            mostrarError(resultado.mensaje || 'Error al realizar la búsqueda');
        }
    } catch (error) {
        console.error('Error en búsqueda:', error);
        mostrarError('Hubo un problema al realizar la búsqueda. Intenta nuevamente.');
    }
}

/**
 * Renderiza los resultados de búsqueda en el DOM
 * Utiliza createElement y appendChild (requisito técnico Sprint 2.1)
 * @param {array} datos - Array de artículos encontrados
 * @param {string} termino - Término buscado
 * @param {number} total - Total de resultados
 */
function renderizarResultados(datos, termino, total) {
    const seccionResultados = document.getElementById('seccionResultados');
    const galeriaResultados = document.getElementById('galeriaResultados');
    const termiBuscado = document.getElementById('termiBuscado');
    const totalResultados = document.getElementById('totalResultados');
    const sinResultados = document.getElementById('sinResultados');

    // Limpiar resultados previos
    galeriaResultados.innerHTML = '';
    
    if (datos.length === 0) {
        // Mostrar mensaje de sin resultados
        sinResultados.style.display = 'block';
        totalResultados.textContent = '0';
        termiBuscado.textContent = `"${termino}"`;
    } else {
        sinResultados.style.display = 'none';
        totalResultados.textContent = total;
        termiBuscado.textContent = `"${termino}"`;

        // Crear tarjetas de producto
        datos.forEach(articulo => {
            const card = crearTarjetaArticulo(articulo);
            galeriaResultados.appendChild(card);
        });
    }

    // Mostrar sección de resultados
    seccionResultados.style.display = 'block';
    
    // Scroll suave hacia los resultados
    setTimeout(() => {
        seccionResultados.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

/**
 * Crea una tarjeta (card) de artículo usando createElement
 * @param {object} articulo - Objeto con datos del artículo
 * @returns {HTMLElement} - Elemento div con la tarjeta
 */
function crearTarjetaArticulo(articulo) {
    // Contenedor principal de la tarjeta
    const colDiv = document.createElement('div');
    colDiv.className = 'col-md-6 col-lg-4';

    // Tarjeta
    const card = document.createElement('div');
    card.className = 'card h-100 border-secondary bg-dark text-white';
    card.style.transition = 'all 0.3s ease';

    // Imagen
    const imgContainer = document.createElement('div');
    imgContainer.className = 'position-relative overflow-hidden';
    imgContainer.style.height = '200px';
    imgContainer.style.backgroundColor = '#1a1a1a';

    const img = document.createElement('img');
    img.src = articulo.imagen_url || 'img/placeholder.png';
    img.alt = articulo.nombre;
    img.className = 'w-100 h-100 object-fit-cover';
    img.style.objectFit = 'cover';
    imgContainer.appendChild(img);

    // Body de la tarjeta
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body d-flex flex-column';

    // Categoría (pequeño badge)
    if (articulo.categoria_nombre) {
        const categoriaBadge = document.createElement('span');
        categoriaBadge.className = 'badge bg-gold-flat text-dark mb-2';
        categoriaBadge.textContent = articulo.categoria_nombre;
        cardBody.appendChild(categoriaBadge);
    }

    // Título
    const titulo = document.createElement('h5');
    titulo.className = 'card-title text-gold-flat fw-bold mb-2';
    titulo.textContent = articulo.nombre;
    cardBody.appendChild(titulo);

    // Descripción
    const descripcion = document.createElement('p');
    descripcion.className = 'card-text text-secondary small flex-grow-1';
    descripcion.textContent = articulo.descripcion.substring(0, 100) + '...';
    cardBody.appendChild(descripcion);

    // Precio
    const precio = document.createElement('p');
    precio.className = 'card-text fw-bold text-gold-flat mb-3';
    precio.innerHTML = `$ ${parseFloat(articulo.precio).toFixed(2)}`;
    cardBody.appendChild(precio);

    // Stock
    let stockClass = 'text-success';
    let stockText = 'En stock';
    
    if (articulo.stock <= 0) {
        stockClass = 'text-danger';
        stockText = 'Agotado';
    } else if (articulo.stock < 5) {
        stockClass = 'text-warning';
        stockText = `Solo ${articulo.stock} disponibles`;
    }

    const stock = document.createElement('p');
    stock.className = `small ${stockClass} mb-3`;
    stock.textContent = stockText;
    cardBody.appendChild(stock);

    // Botones de acción
    const botonesDiv = document.createElement('div');
    botonesDiv.className = 'd-flex gap-2';

    // Botón "Agregar al carrito"
    const btnAgregar = document.createElement('button');
    btnAgregar.className = 'btn btn-gold flex-grow-1 btn-sm fw-bold';
    btnAgregar.textContent = 'Agregar al carrito';
    btnAgregar.disabled = articulo.stock <= 0;
    btnAgregar.addEventListener('click', function() {
        agregarAlCarritoDesdeSearch(articulo);
    });
    botonesDiv.appendChild(btnAgregar);

    // Botón "Ver detalles"
    const btnDetalles = document.createElement('button');
    btnDetalles.className = 'btn btn-outline-gold-flat btn-sm fw-bold text-white';
    btnDetalles.textContent = 'Detalles';
    btnDetalles.addEventListener('click', function() {
        verDetallesArticulo(articulo);
    });
    botonesDiv.appendChild(btnDetalles);

    cardBody.appendChild(botonesDiv);

    // Ensamblar tarjeta
    card.appendChild(imgContainer);
    card.appendChild(cardBody);
    colDiv.appendChild(card);

    // Efecto hover
    colDiv.addEventListener('mouseenter', function() {
        card.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.3)';
        card.style.transform = 'translateY(-5px)';
    });

    colDiv.addEventListener('mouseleave', function() {
        card.style.boxShadow = 'none';
        card.style.transform = 'translateY(0)';
    });

    return colDiv;
}

/**
 * Agrega un artículo al carrito desde los resultados de búsqueda
 * @param {object} articulo - Objeto con datos del artículo
 */
function agregarAlCarritoDesdeSearch(articulo) {
    // Obtener usuario del localStorage
    const usuarioStr = localStorage.getItem('usuario');
    
    if (!usuarioStr) {
        alert('Por favor, inicia sesión para agregar artículos al carrito');
        window.location.href = 'login.html';
        return;
    }

    try {
        const usuario = JSON.parse(usuarioStr);
        const id_usuario = usuario.id;

        // Agregar al carrito del localStorage (Sprint 2.1)
        let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
        
        // Verificar si el artículo ya existe en el carrito
        const itemExistente = carrito.find(item => item.id === articulo.id);
        
        if (itemExistente) {
            itemExistente.cantidad++;
        } else {
            carrito.push({
                id: articulo.id,
                nombre: articulo.nombre,
                precio: articulo.precio,
                cantidad: 1,
                imagen_url: articulo.imagen_url
            });
        }

        localStorage.setItem('carrito', JSON.stringify(carrito));

        // Mostrar confirmación
        mostrarNotificacion('Artículo agregado al carrito correctamente', 'success');

        // Actualizar carrito si existe la función globalizada
        if (typeof actualizarVistaCarrito === 'function') {
            actualizarVistaCarrito();
        }
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        mostrarNotificacion('Error al agregar al carrito', 'error');
    }
}

/**
 * Muestra los detalles de un artículo
 * @param {object} articulo - Datos del artículo
 */
function verDetallesArticulo(articulo) {
    // Crear un modal simple o redirigir a página de detalles
    // Por ahora, mostrar en un alert simple (puede mejorarse)
    let detalles = `
${articulo.nombre}

Categoría: ${articulo.categoria_nombre || 'N/A'}
Precio: $${parseFloat(articulo.precio).toFixed(2)}
Stock: ${articulo.stock} unidades

Descripción:
${articulo.descripcion}
    `;
    
    alert(detalles);
}

/**
 * Cierra la sección de resultados
 */
function cerrarSeccionResultados() {
    const seccionResultados = document.getElementById('seccionResultados');
    const inputBuscador = document.getElementById('buscadorInput');
    
    seccionResultados.style.display = 'none';
    if (inputBuscador) {
        inputBuscador.value = '';
    }
}

/**
 * Muestra un error en la sección de resultados
 * @param {string} mensaje - Mensaje de error
 */
function mostrarError(mensaje) {
    const galeriaResultados = document.getElementById('galeriaResultados');
    const sinResultados = document.getElementById('sinResultados');
    const seccionResultados = document.getElementById('seccionResultados');

    galeriaResultados.innerHTML = '';
    sinResultados.style.display = 'block';
    sinResultados.innerHTML = `<p class="mb-0"><strong>Error:</strong> ${mensaje}</p>`;
    seccionResultados.style.display = 'block';
}

/**
 * Muestra una notificación al usuario
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - 'success', 'error', 'info', 'warning'
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear notificación de Bootstrap Toast-like
    const div = document.createElement('div');
    div.className = `alert alert-${tipo === 'success' ? 'success' : tipo === 'error' ? 'danger' : tipo === 'warning' ? 'warning' : 'info'} position-fixed top-0 start-50 translate-middle-x mt-3`;
    div.style.zIndex = '9999';
    div.style.maxWidth = '400px';
    div.textContent = mensaje;

    document.body.appendChild(div);

    // Remover después de 3 segundos
    setTimeout(() => {
        div.remove();
    }, 3000);
}

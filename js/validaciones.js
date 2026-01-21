import { regex } from './Regex.js';
import { enviarRegistro } from './api.js';

/**
 * Valida un nombre/apellido (máximo 2 palabras)
 * @param {string} valor - Nombre o apellido
 * @returns {Object} - {boolean, errMensaje}
 */
export function validarNombreApellido(valor) {
    const limpio = valor ? valor.trim() : '';
    if (!limpio) {
        return { boolean: false, errMensaje: "Campo requerido" };
    }
    const palabras = limpio.split(/\s+/).filter(Boolean).length;
    if (palabras > 2) {
        return { boolean: false, errMensaje: "Máximo 2 palabras" };
    }
    return { boolean: true, errMensaje: "" };
}

/**
 * Valida un email
 * @param {string} correo - Email a validar
 * @returns {Object} - {boolean, errMensaje}
 */
export function validarCorreo(correo) {
    const limpio = correo ? correo.trim() : '';
    if (!limpio) {
        return { boolean: false, errMensaje: "Email requerido" };
    }
    if (!regex.correo.test(limpio)) {
        return { boolean: false, errMensaje: "Email inválido" };
    }
    return { boolean: true, errMensaje: "" };
}

/**
 * Valida una contraseña (mín 8 caracteres, con al menos 1 minúscula, mayúscula, número y símbolo)
 * @param {string} passwd - Contraseña
 * @returns {Object} - {boolean, errMensaje}
 */
export function validarContrasennia(passwd) {
    const limpia = passwd ? passwd.trim() : '';
    if (!limpia) {
        return { boolean: false, errMensaje: "Contraseña requerida" };
    }
    if (!regex.password.test(limpia)) {
        return { boolean: false, errMensaje: "Mín 8 caracteres, 1 mayús, 1 minús, 1 número, 1 símbolo" };
    }
    return { boolean: true, errMensaje: "" };
}

/**
 * Compara dos contraseñas
 * @param {string} passwd1 - Primera contraseña
 * @param {string} passwd2 - Segunda contraseña
 * @returns {Object} - {boolean, errMensaje}
 */
export function validarComprobacionPassword(passwd1, passwd2) {
    if (passwd1 !== passwd2) {
        return { boolean: false, errMensaje: "Las contraseñas no coinciden" };
    }
    return { boolean: true, errMensaje: "" };
}

/**
 * Obtiene reglas de password con estado de cada criterio
 * @param {string} passwd - Contraseña
 * @returns {Object} - {length, lower, upper, number, symbol, ok}
 */
export function probarReglasPassword(passwd) {
    const pw = passwd || '';
    return {
        length: pw.length >= 8,
        lower: /[a-z]/.test(pw),
        upper: /[A-Z]/.test(pw),
        number: /[0-9]/.test(pw),
        symbol: /[@$!%*?&]/.test(pw),
        ok: regex.password.test(pw)
    };
}

// ============ OVERLAY Y FORMULARIO ============

document.addEventListener('DOMContentLoaded', function () {
    const btnAbrirRegistro = document.getElementById('abrirRegistro');
    const btnCerrarRegistro = document.getElementById('cerrarRegistro');
    const overlayRegistro = document.getElementById('overlayRegistro');
    const formularioRegistro = document.getElementById('formularioRegistro');
    const validacionesPW = document.getElementById('validacionesPW');
    
    let ultimoFocus = null;

    if (!overlayRegistro || !btnAbrirRegistro || !btnCerrarRegistro || !formularioRegistro) return;

    overlayRegistro.classList.remove('visible');
    overlayRegistro.setAttribute('aria-hidden', 'true');

    function mostrarOverlay() {
        ultimoFocus = document.activeElement;
        overlayRegistro.classList.add('visible');
        overlayRegistro.setAttribute('aria-hidden', 'false');
        // Indica que es un modal accesible y activa focus-trap
        overlayRegistro.setAttribute('aria-modal', 'true');
        const first = overlayRegistro.querySelector('input[required], input[type="text"], input[type="email"]');
        if (first) first.focus();
        // agregar listener para focus trap
        document.addEventListener('keydown', trapFocus);
    }

    function ocultarOverlay() {
        overlayRegistro.classList.remove('visible');
        overlayRegistro.setAttribute('aria-hidden', 'true');
        overlayRegistro.removeAttribute('aria-modal');
        // eliminar listener de focus trap
        document.removeEventListener('keydown', trapFocus);
        if (ultimoFocus && typeof ultimoFocus.focus === 'function') ultimoFocus.focus();
    }

    function mostrarError(input, message) {
        input.classList.add('is-invalid');
        // accesibilidad: marcar aria-invalid y aria-describedby
        try {
            input.setAttribute('aria-invalid', 'true');
        } catch (e) {}
        let next = input.nextElementSibling;
        const errId = (input.id || input.name) + '-error';
        if (!next || !next.classList.contains('invalid-feedback')) {
            next = document.createElement('div');
            next.className = 'invalid-feedback';
            next.id = errId;
            next.setAttribute('role', 'alert');
            next.setAttribute('aria-live', 'assertive');
            input.parentNode.insertBefore(next, input.nextSibling);
        }
        next.textContent = message;
        try { input.setAttribute('aria-describedby', next.id); } catch (e) {}
    }

    function limpiarError(input) {
        input.classList.remove('is-invalid');
        try { input.removeAttribute('aria-invalid'); } catch (e) {}
        try { input.removeAttribute('aria-describedby'); } catch (e) {}
        let next = input.nextElementSibling;
        if (next && next.classList.contains('invalid-feedback')) {
            next.parentNode.removeChild(next);
        }
    }

    // Focus trap para mantener el foco dentro del overlay cuando está visible
    function trapFocus(e) {
        if (!overlayRegistro.classList.contains('visible')) return;
        if (e.key !== 'Tab') return;
        const focusable = overlayRegistro.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
        const focusableList = Array.prototype.filter.call(focusable, function (el) {
            return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
        });
        if (focusableList.length === 0) return;
        const first = focusableList[0];
        const last = focusableList[focusableList.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) {
                last.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === last) {
                first.focus();
                e.preventDefault();
            }
        }
    }

    // Event listeners para overlay
    btnAbrirRegistro.addEventListener('click', e => { e.preventDefault(); mostrarOverlay(); });
    btnCerrarRegistro.addEventListener('click', e => { e.preventDefault(); ocultarOverlay(); });
    overlayRegistro.addEventListener('click', e => { if (e.target === overlayRegistro) ocultarOverlay(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') ocultarOverlay(); });

    // Campos del formulario
    const campoNombre = formularioRegistro.querySelector('input[name="nombre"]');
    const campoApellidos = formularioRegistro.querySelector('input[name="apellidos"]');
    const campoEmail = formularioRegistro.querySelector('input[name="email"]');
    const campoPassword = formularioRegistro.querySelector('input[name="password"]');
    const campoPasswordConfirm = formularioRegistro.querySelector('input[name="password_confirm"]');
    const campoTerms = formularioRegistro.querySelector('input[id="terms"]');

    // Validación realtime: nombre
    if (campoNombre) {
        campoNombre.addEventListener('input', e => {
            const res = validarNombreApellido(e.target.value);
            if (!res.boolean) mostrarError(campoNombre, res.errMensaje);
            else limpiarError(campoNombre);
        });
    }

    // Validación realtime: apellidos
    if (campoApellidos) {
        campoApellidos.addEventListener('input', e => {
            const val = e.target.value.trim();
            if (!val) { limpiarError(campoApellidos); return; }
            const res = validarNombreApellido(e.target.value);
            if (!res.boolean) mostrarError(campoApellidos, res.errMensaje);
            else limpiarError(campoApellidos);
        });
    }

    // Validación realtime: password
    if (campoPassword) {
        campoPassword.addEventListener('input', e => {
            const pw = e.target.value || '';
            const rules = probarReglasPassword(pw);
            
            // Actualizar criterios visuales
            if (validacionesPW) {
                Array.from(validacionesPW.querySelectorAll('li')).forEach(li => {
                    const key = li.getAttribute('data-crit');
                    li.classList.toggle('text-success', rules[key]);
                    li.classList.toggle('text-danger', !rules[key]);
                });
            }

            // Validar confirmación en tiempo real
            if (campoPasswordConfirm && campoPasswordConfirm.value) {
                const resConfirm = validarComprobacionPassword(pw, campoPasswordConfirm.value);
                if (!resConfirm.boolean) mostrarError(campoPasswordConfirm, resConfirm.errMensaje);
                else limpiarError(campoPasswordConfirm);
            }
        });
    }

    // Validación realtime: password confirm
    if (campoPasswordConfirm) {
        campoPasswordConfirm.addEventListener('input', e => {
            const pw = campoPassword?.value || '';
            const resConfirm = validarComprobacionPassword(pw, e.target.value);
            if (!resConfirm.boolean) mostrarError(campoPasswordConfirm, resConfirm.errMensaje);
            else limpiarError(campoPasswordConfirm);
        });
    }

    // Submit
    formularioRegistro.addEventListener('submit', e => {
        e.preventDefault();
        let valid = true;

        // Limpiar errores previos
        [campoNombre, campoApellidos, campoEmail, campoPassword, campoPasswordConfirm, campoTerms]
            .forEach(el => el && limpiarError(el));

        // Validar nombre
        if (!campoNombre || !campoNombre.value.trim()) {
            mostrarError(campoNombre, 'Nombre requerido');
            valid = false;
        } else {
            const resNombre = validarNombreApellido(campoNombre.value);
            if (!resNombre.boolean) { mostrarError(campoNombre, resNombre.errMensaje); valid = false; }
        }

        // Validar apellidos (opcional)
        if (campoApellidos && campoApellidos.value.trim()) {
            const resApellidos = validarNombreApellido(campoApellidos.value);
            if (!resApellidos.boolean) { mostrarError(campoApellidos, resApellidos.errMensaje); valid = false; }
        }

        // Validar email
        if (!campoEmail || !campoEmail.value.trim()) {
            mostrarError(campoEmail, 'Email requerido');
            valid = false;
        } else {
            const resEmail = validarCorreo(campoEmail.value);
            if (!resEmail.boolean) { mostrarError(campoEmail, resEmail.errMensaje); valid = false; }
        }

        // Validar password
        if (!campoPassword || !campoPassword.value.trim()) {
            mostrarError(campoPassword, 'Contraseña requerida');
            valid = false;
        } else {
            const resPassword = validarContrasennia(campoPassword.value);
            if (!resPassword.boolean) { mostrarError(campoPassword, resPassword.errMensaje); valid = false; }
        }

        // Validar confirmación password
        if (!campoPasswordConfirm || !campoPasswordConfirm.value.trim()) {
            mostrarError(campoPasswordConfirm, 'Confirmar contraseña');
            valid = false;
        } else {
            const resConfirm = validarComprobacionPassword(campoPassword.value, campoPasswordConfirm.value);
            if (!resConfirm.boolean) { mostrarError(campoPasswordConfirm, resConfirm.errMensaje); valid = false; }
        }

        // Validar términos
        if (!campoTerms || !campoTerms.checked) {
            mostrarError(campoTerms, 'Debes aceptar los términos');
            valid = false;
        }

        if (!valid) {
            const firstInvalid = formularioRegistro.querySelector('.is-invalid');
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        // Enviar (demo)
        const data = {
            nombre: campoNombre.value.trim(),
            apellidos: campoApellidos?.value.trim() || '',
            email: campoEmail.value.trim(),
            telefono: formularioRegistro.querySelector('input[name="telefono"]')?.value.trim() || '',
            nacimiento: formularioRegistro.querySelector('input[name="nacimiento"]')?.value || '',
            disciplinas: Array.from(formularioRegistro.querySelectorAll('input[name="disciplina"]:checked')).map(i => i.value),
            notificaciones: formularioRegistro.querySelector('input[name="notify"]')?.checked || false
        };

        // Enviar al servidor mediante la función reutilizable (api.js)
        (async () => {
            try {
                // Intentar enviar al endpoint (ajusta la URL en api.js según tu servidor DWES)
                await enviarRegistro(data);

                // Mensaje accesible de éxito
                const mensajeExito = document.createElement('div');
                mensajeExito.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
                mensajeExito.style.zIndex = '9999';
                mensajeExito.style.minWidth = '300px';
                mensajeExito.setAttribute('role', 'status');
                mensajeExito.setAttribute('aria-live', 'polite');
                mensajeExito.setAttribute('aria-atomic', 'true');
                mensajeExito.textContent = '✓ Registrado correctamente';
                document.body.appendChild(mensajeExito);
                setTimeout(() => mensajeExito.remove(), 3000);

                formularioRegistro.reset();
                ocultarOverlay();
            } catch (err) {
                // Mensaje accesible de error
                const mensajeError = document.createElement('div');
                mensajeError.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3';
                mensajeError.style.zIndex = '9999';
                mensajeError.style.minWidth = '300px';
                mensajeError.setAttribute('role', 'alert');
                mensajeError.setAttribute('aria-live', 'assertive');
                mensajeError.textContent = 'Error al registrar: ' + (err.message || 'Inténtalo más tarde');
                document.body.appendChild(mensajeError);
                setTimeout(() => mensajeError.remove(), 4000);
            }
        })();
    });
});

// js/autenticacion.js
// Gestión de autenticación con sesiones PHP (cookies)

class AutenticacionManager {
    constructor() {
        this.API_URL = 'php/api.php';
        this.initEventListeners();
        this.verificarSesion();
    }

    initEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            
            const regPassword = document.getElementById('regPassword');
            if (regPassword) regPassword.addEventListener('input', (e) => this.validarContraseña(e.target.value));
            
            const regDireccion = document.getElementById('regDireccion');
            const regPais = document.getElementById('regPais');
            if (regDireccion) regDireccion.addEventListener('change', () => this.toggleTarjetaField());
            if (regPais) regPais.addEventListener('change', () => this.toggleTarjetaField());
        }
    }

    // === VERIFICAR SESIÓN ACTIVA ===
    async verificarSesion() {
        try {
            const response = await fetch(`${this.API_URL}?action=sesion`, { credentials: 'include' });
            const data = await response.json();

            if (data.success && data.autenticado) {
                // Sincronizar localStorage con la sesión del servidor
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
            } else {
                // Si el servidor dice que no hay sesión, limpiar localStorage
                localStorage.removeItem('usuario');
            }
        } catch (error) {
            // Sin conexión: confiar en localStorage
        }
    }

    // === VALIDACIONES ===
    validarEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validarNombre(nombre) {
        const palabras = nombre.trim().split(/\s+/);
        return palabras.length <= 2 && nombre.trim().length > 0;
    }

    validarContraseña(password) {
        const criterios = {
            length: password.length >= 8,
            lower: /[a-z]/.test(password),
            upper: /[A-Z]/.test(password),
            number: /\d/.test(password),
            symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        const pwValidation = document.getElementById('pwValidation');
        if (pwValidation) {
            Object.keys(criterios).forEach(rule => {
                const item = pwValidation.querySelector(`[data-rule="${rule}"]`);
                if (item) {
                    if (criterios[rule]) {
                        item.classList.remove('text-danger');
                        item.classList.add('text-success');
                        item.innerHTML = `<i class="bi bi-check-circle"></i> ${item.textContent.substring(1)}`;
                    } else {
                        item.classList.remove('text-success');
                        item.classList.add('text-danger');
                    }
                }
            });
        }

        const strength = Object.values(criterios).filter(v => v).length;
        const strengthBar = document.getElementById('passwordStrength');
        if (strengthBar) {
            strengthBar.classList.remove('weak', 'medium', 'strong');
            if (strength <= 2) strengthBar.classList.add('weak');
            else if (strength <= 3) strengthBar.classList.add('medium');
            else strengthBar.classList.add('strong');
        }

        return Object.values(criterios).every(v => v);
    }

    validarTarjeta(tarjeta) {
        if (!tarjeta) return true;
        tarjeta = tarjeta.replace(/\s/g, '');
        return /^\d{13,19}$/.test(tarjeta);
    }

    toggleTarjetaField() {
        const direccion = document.getElementById('regDireccion').value;
        const pais = document.getElementById('regPais').value;
        const tarjetaGroup = document.getElementById('tarjetaGroup');
        if (tarjetaGroup) {
            if (direccion && pais) tarjetaGroup.classList.remove('d-none');
            else tarjetaGroup.classList.add('d-none');
        }
    }

    // === LOGIN ===
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const loginAlert = document.getElementById('loginAlert');

        if (!this.validarEmail(email)) {
            this.mostrarError(loginAlert, 'Por favor, ingresa un correo válido.');
            return;
        }
        if (password.length < 8) {
            this.mostrarError(loginAlert, 'La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        try {
            const response = await fetch(`${this.API_URL}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Enviar/recibir cookie de sesión
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Guardar datos de usuario en localStorage (para UI rápida)
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                window.location.href = 'entrenamientos.html';
            } else {
                this.mostrarError(loginAlert, data.mensaje || 'Credenciales incorrectas.');
            }
        } catch (error) {
            this.mostrarError(loginAlert, 'Error al conectar con el servidor.');
        }
    }

    // === REGISTRO ===
    async handleRegister(e) {
        e.preventDefault();

        const nombre = document.getElementById('regNombre').value;
        const apellidos = document.getElementById('regApellidos').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const passwordConfirm = document.getElementById('regPasswordConfirm').value;
        const genero = document.getElementById('regGenero').value;
        const fechaNacimiento = document.getElementById('regFechaNacimiento').value;
        const direccion = document.getElementById('regDireccion').value;
        const pais = document.getElementById('regPais').value;
        const tarjeta = document.getElementById('regTarjeta') ? document.getElementById('regTarjeta').value : '';
        const notificaciones = document.getElementById('regNotificaciones') ? document.getElementById('regNotificaciones').checked : false;
        const terminos = document.getElementById('regTerminos') ? document.getElementById('regTerminos').checked : false;
        const registerAlert = document.getElementById('registerAlert');

        // Validaciones
        if (!this.validarNombre(nombre)) { this.mostrarError(registerAlert, 'El nombre debe ser máximo dos palabras.'); return; }
        if (!this.validarNombre(apellidos)) { this.mostrarError(registerAlert, 'Los apellidos deben ser máximo dos palabras.'); return; }
        if (!this.validarEmail(email)) { this.mostrarError(registerAlert, 'Por favor, ingresa un correo válido.'); return; }
        if (!this.validarContraseña(password)) { this.mostrarError(registerAlert, 'La contraseña no cumple todos los requisitos.'); return; }
        if (password !== passwordConfirm) { this.mostrarError(registerAlert, 'Las contraseñas no coinciden.'); return; }
        if (!genero) { this.mostrarError(registerAlert, 'Por favor, selecciona tu género.'); return; }
        if (!fechaNacimiento) { this.mostrarError(registerAlert, 'Por favor, ingresa tu fecha de nacimiento.'); return; }
        if (!direccion || !pais) { this.mostrarError(registerAlert, 'Dirección y país son obligatorios.'); return; }
        if (tarjeta && !this.validarTarjeta(tarjeta)) { this.mostrarError(registerAlert, 'El número de tarjeta no es válido.'); return; }
        if (!terminos) { this.mostrarError(registerAlert, 'Debes aceptar los términos y condiciones.'); return; }

        try {
            const response = await fetch(`${this.API_URL}?action=register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    nombre, apellidos, email, password,
                    genero,
                    fecha_nacimiento: fechaNacimiento,
                    direccion, pais,
                    tarjeta: tarjeta || null,
                    notificaciones
                })
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseErr) {
                console.error('Respuesta no JSON:', text);
                this.mostrarError(registerAlert, 'Error del servidor. Revisa la consola.');
                return;
            }

            if (data.success) {
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                alert('¡Registro exitoso! Bienvenido a Athlos Forge.');
                window.location.href = 'entrenamientos.html';
            } else {
                this.mostrarError(registerAlert, data.mensaje || 'Error al registrar.');
            }
        } catch (error) {
            console.error('Error en registro:', error);
            this.mostrarError(registerAlert, 'Error al conectar con el servidor: ' + error.message);
        }
    }

    mostrarError(alertElement, mensaje) {
        if (alertElement) {
            alertElement.textContent = mensaje;
            alertElement.classList.remove('d-none');
            alertElement.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AutenticacionManager();
});

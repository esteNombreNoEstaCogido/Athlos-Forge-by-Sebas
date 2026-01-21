// js/autenticacion.js

class AutenticacionManager {
    constructor() {
        this.initEventListeners();
    }

    initEventListeners() {
        // FORMULARIO LOGIN
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // FORMULARIO REGISTRO
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            
            // Validaciones en tiempo real
            document.getElementById('regPassword').addEventListener('input', (e) => this.validarContraseña(e.target.value));
            document.getElementById('regDireccion').addEventListener('change', () => this.toggleTarjetaField());
            document.getElementById('regPais').addEventListener('change', () => this.toggleTarjetaField());
        }
    }

    // === VALIDACIONES ===
    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    validarNombre(nombre) {
        // Máximo dos palabras
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

        // Actualizar UI
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

        // Actualizar barra de fortaleza
        const strength = Object.values(criterios).filter(v => v).length;
        const strengthBar = document.getElementById('passwordStrength');
        if (strengthBar) {
            strengthBar.classList.remove('weak', 'medium', 'strong');
            if (strength <= 2) {
                strengthBar.classList.add('weak');
            } else if (strength <= 3) {
                strengthBar.classList.add('medium');
            } else {
                strengthBar.classList.add('strong');
            }
        }

        // Retornar si cumple con todos los criterios
        return Object.values(criterios).every(v => v);
    }

    validarTarjeta(tarjeta) {
        // Algoritmo de Luhn simplificado
        if (!tarjeta) return true; // Opcional
        tarjeta = tarjeta.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(tarjeta)) return false;
        
        let sum = 0;
        let isEven = false;
        for (let i = tarjeta.length - 1; i >= 0; i--) {
            let digit = parseInt(tarjeta[i]);
            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            isEven = !isEven;
        }
        return sum % 10 === 0;
    }

    toggleTarjetaField() {
        const direccion = document.getElementById('regDireccion').value;
        const pais = document.getElementById('regPais').value;
        const tarjetaGroup = document.getElementById('tarjetaGroup');
        
        if (direccion && pais) {
            tarjetaGroup.classList.remove('d-none');
        } else {
            tarjetaGroup.classList.add('d-none');
        }
    }

    // === HANDLERS ===
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const loginAlert = document.getElementById('loginAlert');

        // Validación básica
        if (!this.validarEmail(email)) {
            this.mostrarError(loginAlert, 'Por favor, ingresa un correo válido.');
            return;
        }

        if (password.length < 8) {
            this.mostrarError(loginAlert, 'La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        try {
            // Enviar a la API
            const response = await fetch('php/api.php?action=login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Guardar sesión en localStorage
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                localStorage.setItem('token', data.token);
                
                // Redireccionar
                window.location.href = 'perfil.html';
            } else {
                this.mostrarError(loginAlert, data.mensaje || 'Credenciales incorrectas.');
            }
        } catch (error) {
            this.mostrarError(loginAlert, 'Error al conectar con el servidor.');
            console.error(error);
        }
    }

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
        const tarjeta = document.getElementById('regTarjeta').value;
        const notificaciones = document.getElementById('regNotificaciones').checked;
        const terminos = document.getElementById('regTerminos').checked;
        const registerAlert = document.getElementById('registerAlert');

        // VALIDACIONES
        if (!this.validarNombre(nombre)) {
            this.mostrarError(registerAlert, 'El nombre debe ser máximo dos palabras.');
            return;
        }

        if (!this.validarNombre(apellidos)) {
            this.mostrarError(registerAlert, 'Los apellidos deben ser máximo dos palabras.');
            return;
        }

        if (!this.validarEmail(email)) {
            this.mostrarError(registerAlert, 'Por favor, ingresa un correo válido.');
            return;
        }

        if (!this.validarContraseña(password)) {
            this.mostrarError(registerAlert, 'La contraseña no cumple todos los requisitos.');
            return;
        }

        if (password !== passwordConfirm) {
            this.mostrarError(registerAlert, 'Las contraseñas no coinciden.');
            return;
        }

        if (!genero) {
            this.mostrarError(registerAlert, 'Por favor, selecciona tu género.');
            return;
        }

        if (!fechaNacimiento) {
            this.mostrarError(registerAlert, 'Por favor, ingresa tu fecha de nacimiento.');
            return;
        }

        if (!direccion || !pais) {
            this.mostrarError(registerAlert, 'Dirección y país son obligatorios.');
            return;
        }

        if (tarjeta && !this.validarTarjeta(tarjeta)) {
            this.mostrarError(registerAlert, 'El número de tarjeta no es válido.');
            return;
        }

        if (!terminos) {
            this.mostrarError(registerAlert, 'Debes aceptar los términos y condiciones.');
            return;
        }

        try {
            // Enviar a la API
            const response = await fetch('php/api.php?action=register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre,
                    apellidos,
                    email,
                    password,
                    genero,
                    fecha_nacimiento: fechaNacimiento,
                    direccion,
                    pais,
                    tarjeta: tarjeta || null,
                    notificaciones
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('¡Registro exitoso! Iniciando sesión...');
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                localStorage.setItem('token', data.token);
                window.location.href = 'perfil.html';
            } else {
                this.mostrarError(registerAlert, data.mensaje || 'Error al registrar.');
            }
        } catch (error) {
            this.mostrarError(registerAlert, 'Error al conectar con el servidor.');
            console.error(error);
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

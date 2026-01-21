export const regex = {
    nombreApellido: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{1,}$/,
    correo: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

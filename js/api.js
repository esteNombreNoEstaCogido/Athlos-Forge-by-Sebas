/**
 * Envía los datos de registro al servidor (API REST)
 * @param {Object} data - Datos del formulario de registro
 * @returns {Promise} - Respuesta del servidor
 */
export async function enviarRegistro(data) {
    try {
        const response = await fetch('php/api.php?action=register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.mensaje || `HTTP error! status: ${response.status}`);
        }

        const resultado = await response.json();

        if (resultado.success && resultado.usuario) {
            localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
        }

        return resultado;
    } catch (error) {
        console.error('Error al enviar el registro:', error);
        throw error;
    }
}

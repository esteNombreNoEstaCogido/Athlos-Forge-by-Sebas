/**
 * Envía los datos de registro al servidor
 * @param {Object} data - Datos del formulario de registro
 * @returns {Promise} - Respuesta del servidor
 */
export async function enviarRegistro(data) {
    try {
        const response = await fetch('php/registro.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const resultado = await response.json();
        return resultado;
    } catch (error) {
        console.error('Error al enviar el registro:', error);
        throw error;
    }
}

import { useState } from 'react';
import './RegisterForm.css';

export default function RegisterForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    contraseña: '',
    confirmarContraseña: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.contraseña.length < 6) {
      newErrors.contraseña = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.contraseña !== formData.confirmarContraseña) {
      newErrors.confirmarContraseña = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setFormData({
        nombre: '',
        email: '',
        contraseña: '',
        confirmarContraseña: ''
      });
    }
  };

  return (
    <div className="register-overlay">
      <div className="register-container">
        <div className="register-header">
          <h2>Crear Cuenta</h2>
          <button className="close-button" onClick={onCancel}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre Completo</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={`form-input ${errors.nombre ? 'is-invalid' : ''}`}
              placeholder="Tu nombre"
            />
            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'is-invalid' : ''}`}
              placeholder="tu@email.com"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="contraseña">Contraseña</label>
            <input
              type="password"
              id="contraseña"
              name="contraseña"
              value={formData.contraseña}
              onChange={handleChange}
              className={`form-input ${errors.contraseña ? 'is-invalid' : ''}`}
              placeholder="Mínimo 6 caracteres"
            />
            {errors.contraseña && <span className="error-message">{errors.contraseña}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmarContraseña">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmarContraseña"
              name="confirmarContraseña"
              value={formData.confirmarContraseña}
              onChange={handleChange}
              className={`form-input ${errors.confirmarContraseña ? 'is-invalid' : ''}`}
              placeholder="Repite tu contraseña"
            />
            {errors.confirmarContraseña && <span className="error-message">{errors.confirmarContraseña}</span>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              <i className="bi bi-person-check"></i> Registrarse
            </button>
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

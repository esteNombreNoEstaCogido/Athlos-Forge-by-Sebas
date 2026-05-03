import { useState } from 'react';
import './Header.css';

export default function Header({ cartCount, onShowCart, onShowRegister }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="header">
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container">
          <a className="navbar-brand" href="/">
            <span className="brand-icon">⚡</span>
            <span className="brand-text">Athlos Forge</span>
          </a>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link" href="#inicio">Inicio</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#entrenamientos">Entrenamientos</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#blog">Blog</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#opiniones">Opiniones</a>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link btn-link"
                  onClick={onShowRegister}
                >
                  <i className="bi bi-person-check"></i> Registrarse
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link cart-button" onClick={onShowCart}>
                  <i className="bi bi-cart-fill"></i>
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

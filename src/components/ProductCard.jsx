import { useState } from 'react';
import './ProductCard.css';

export default function ProductCard({ product, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);

  const handleAddClick = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) setQuantity(value);
  };

  return (
    <div className="product-card">
      <div className="product-image">
        <img
          src={product.imagen || 'https://via.placeholder.com/280x200?text=' + encodeURIComponent(product.nombre)}
          alt={product.nombre}
        />
        <div className="product-overlay">
          <span className="product-badge">Nuevo</span>
        </div>
      </div>

      <div className="product-content">
        <h3 className="product-name">{product.nombre}</h3>
        <p className="product-description">{product.descripcion}</p>

        <div className="product-price">
          ${product.precio.toFixed(2)}
        </div>

        <div className="product-actions">
          <select
            className="quantity-select"
            value={quantity}
            onChange={handleQuantityChange}
          >
            {[1, 2, 3, 4, 5, 10, 20].map(num => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>

          <button
            className="btn-add-cart"
            onClick={handleAddClick}
          >
            <i className="bi bi-cart-plus"></i> Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

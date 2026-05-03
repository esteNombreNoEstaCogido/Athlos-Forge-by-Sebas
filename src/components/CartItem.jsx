import './CartItem.css';

export default function CartItem({ item, onRemove, onUpdateQuantity }) {
  return (
    <div className="cart-item">
      <img
        src={item.imagen || 'https://via.placeholder.com/80?text=' + encodeURIComponent(item.nombre)}
        alt={item.nombre}
        className="cart-item-image"
      />

      <div className="cart-item-details">
        <h4>{item.nombre}</h4>
        <p className="cart-item-price">${item.precio.toFixed(2)}</p>
      </div>

      <div className="cart-item-quantity">
        <button onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}>
          <i className="bi bi-dash-lg"></i>
        </button>
        <input
          type="number"
          value={item.cantidad}
          onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
          className="quantity-input"
        />
        <button onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}>
          <i className="bi bi-plus-lg"></i>
        </button>
      </div>

      <div className="cart-item-subtotal">
        ${(item.precio * item.cantidad).toFixed(2)}
      </div>

      <button
        className="btn-remove"
        onClick={() => onRemove(item.id)}
        title="Eliminar"
      >
        <i className="bi bi-trash-fill"></i>
      </button>
    </div>
  );
}

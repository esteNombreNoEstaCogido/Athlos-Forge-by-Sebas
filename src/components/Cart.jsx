import CartItem from './CartItem';
import './Cart.css';

export default function Cart({ items, onRemoveItem, onUpdateQuantity }) {
  const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h3>
          <i className="bi bi-cart-fill"></i> Tu Carrito
        </h3>
        <span className="cart-count">{items.length} productos</span>
      </div>

      <div className="cart-items">
        {items.length === 0 ? (
          <p className="empty-cart">Tu carrito está vacío</p>
        ) : (
          items.map(item => (
            <CartItem
              key={item.id}
              item={item}
              onRemove={onRemoveItem}
              onUpdateQuantity={onUpdateQuantity}
            />
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="cart-footer">
          <div className="cart-total">
            <span>Total:</span>
            <span className="total-amount">${total.toFixed(2)}</span>
          </div>
          <button className="btn-checkout">
            <i className="bi bi-credit-card"></i> Proceder al pago
          </button>
        </div>
      )}
    </div>
  );
}

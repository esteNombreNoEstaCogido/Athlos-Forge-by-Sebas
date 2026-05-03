import { useState, useEffect } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ProductGallery from './components/ProductGallery';
import Cart from './components/Cart';
import RegisterForm from './components/RegisterForm';
import { useLocalStorage } from './hooks/useLocalStorage';
import { mockProducts } from './services/mockData';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useLocalStorage('cart', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Cargar productos desde el API
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtrar productos cuando cambia el término de búsqueda
  useEffect(() => {
    handleSearch(searchTerm);
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/api.php?action=get_products');
      if (!response.ok) throw new Error('Error al cargar productos');
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      // Usar datos de prueba si falla el API
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
      setError('Usando productos de prueba (API no disponible)');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    if (!term.trim()) {
      setFilteredProducts(products);
      return;
    }

    const searchLower = term.toLowerCase();
    const filtered = products.filter(product =>
      product.nombre.toLowerCase().includes(searchLower) ||
      product.descripcion.toLowerCase().includes(searchLower)
    );
    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      let newCart;
      if (existingItem) {
        newCart = prevCart.map(item =>
          item.id === product.id
            ? { ...item, cantidad: item.cantidad + quantity }
            : item
        );
      } else {
        newCart = [...prevCart, { ...product, cantidad: quantity }];
      }
      
      // Mostrar notificación
      showNotification(`${product.nombre} agregado al carrito`);
      return newCart;
    });
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, cantidad: quantity }
            : item
        )
      );
    }
  };

  const handleRegister = async (formData) => {
    try {
      const response = await fetch('/api/api.php?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert('Registro exitoso');
        setShowRegister(false);
      } else {
        alert('Error en el registro');
      }setShowCart(!showCart)}
        onShowRegister={() => setShowRegister(!showRegister)}
      />

      {notification && (
        <div className="notification">
          <i className="bi bi-check-circle"></i> {notification}
        </div>
      )}

      {showRegister ? (
        <RegisterForm onSubmit={handleRegister} onCancel={() => setShowRegister(false)} />
      ) : (
        <main className="container py-5">
          <SearchBar onSearch={handleSearch} />

          <div className="row mt-4">
            <div className="col-lg-8">
              {loading && <p className="text-center">Cargando productos...</p>}
              {error && <p className="text-center text-warning">{error}</p>}
              {!loading && filteredProducts.length > 0 && (
                <ProductGallery
                  products={filteredProducts}
                  onAddToCart={handleAddToCart}
                />
              )}
              {!loading && filteredProducts.length === 0 && (
                <p className="text-center">No se encontraron productos</p>
              )}
            </div>

            <div className="col-lg-4 d-none d-lg-block">
              <Cart
                items={cart}
                onRemoveItem={handleRemoveFromCart}
                onUpdateQuantity={handleUpdateQuantity}
              />
            </div>
          </div>
        </main>
      )}

      {showCart && (
        <div className="cart-modal-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowCart(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
            <Cart
              items={cart}
              onRemoveItem={handleRemoveFromCart}
              onUpdateQuantity={handleUpdateQuantity}
            />
          </div>
        </div)}
            </div>

            <div className="col-lg-4">
              <Cart
                items={cart}
                onRemoveItem={handleRemoveFromCart}
                onUpdateQuantity={handleUpdateQuantity}
              />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;

import ProductCard from './ProductCard';
import './ProductGallery.css';

export default function ProductGallery({ products, onAddToCart }) {
  return (
    <div className="product-gallery">
      <h2 className="gallery-title">Nuestros Entrenamientos</h2>
      <div className="products-grid">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}

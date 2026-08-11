import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiTrash2, FiShoppingBag, FiStar, FiArrowRight, FiBox } from 'react-icons/fi';
import { getWishlistItems, removeFromWishlist } from '../utils/wishlist';
import { addToCart } from '../utils/cart';
import '../styles/Wishlist.css';

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setItems(getWishlistItems());

    const handleWishlistUpdate = () => {
      setItems(getWishlistItems());
    };

    window.addEventListener('wishlist:updated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlist:updated', handleWishlistUpdate);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleRemove = (productId) => {
    const updated = removeFromWishlist(productId);
    setItems(updated);
    showToast('Item removed from your wishlist.');
  };

  const handleMoveToCart = (product) => {
    addToCart({
      id: product.id || product.productId,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl
    });
    removeFromWishlist(product.id || product.productId);
    showToast(`Moved "${product.name}" to your Cart!`);
  };

  return (
    <div className="wishlist-page page-container">
      <div className="container">
        
        <div className="wishlist-header">
          <div>
            <h1>My Saved Wishlist ❤️</h1>
            <p>Keep track of your favorite furniture pieces and move them to cart anytime.</p>
          </div>
          <span className="wishlist-count-badge">{items.length} Saved Item{items.length === 1 ? '' : 's'}</span>
        </div>

        {toastMessage && (
          <div className="floating-toast">
            {toastMessage}
          </div>
        )}

        {items.length === 0 ? (
          <div className="empty-wishlist-card">
            <div className="empty-icon"><FiHeart /></div>
            <h2>Your Wishlist is Empty</h2>
            <p>Explore our premium teak wood, sofas, and dining collections to save your favorite designs.</p>
            <Link to="/categories" className="btn btn-primary mt-3">
              Explore Collections <FiArrowRight />
            </Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {items.map(item => (
              <div key={item.id || item.productId} className="wishlist-card">
                <div className="card-img-wrapper" onClick={() => navigate(`/product/${item.id || item.productId}`)}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} />
                  ) : (
                    <div className="img-placeholder"><FiBox /></div>
                  )}
                  <button 
                    className="card-remove-btn" 
                    onClick={(e) => { e.stopPropagation(); handleRemove(item.id || item.productId); }}
                    title="Remove item"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                <div className="card-content">
                  <span className="cat-tag">{item.categoryName || 'Furniture'}</span>
                  <h3 onClick={() => navigate(`/product/${item.id || item.productId}`)}>{item.name}</h3>

                  <div className="card-rating">
                    <span className="stars"><FiStar /><FiStar /><FiStar /><FiStar /><FiStar /></span>
                    <span>(4.8)</span>
                  </div>

                  <div className="card-price-row">
                    <span className="price">₹{(item.price || 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="card-actions">
                    <button 
                      className="btn btn-primary btn-block"
                      onClick={() => handleMoveToCart(item)}
                    >
                      <FiShoppingBag /> Move to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Wishlist;

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiGrid, FiHeart, FiShoppingCart, FiUser } from 'react-icons/fi';
import { getCartCount } from '../utils/cart';
import { getWishlistItems } from '../utils/wishlist';
import '../styles/Navbar.css';

const MobileNav = () => {
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const syncCounts = () => {
      setCartCount(getCartCount());
      setWishlistCount(getWishlistItems().length);
    };

    syncCounts();

    window.addEventListener('cart:updated', syncCounts);
    window.addEventListener('wishlist:updated', syncCounts);

    return () => {
      window.removeEventListener('cart:updated', syncCounts);
      window.removeEventListener('wishlist:updated', syncCounts);
    };
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="mobile-bottom-nav">
      <Link to="/" className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}>
        <FiHome className="nav-icon" />
        <span>Home</span>
      </Link>

      <Link to="/categories" className={`mobile-nav-item ${isActive('/categories') ? 'active' : ''}`}>
        <FiGrid className="nav-icon" />
        <span>Catalog</span>
      </Link>

      <Link to="/wishlist" className={`mobile-nav-item ${isActive('/wishlist') ? 'active' : ''}`}>
        <div className="icon-wrapper">
          <FiHeart className="nav-icon" />
          {wishlistCount > 0 && <span className="nav-badge">{wishlistCount}</span>}
        </div>
        <span>Wishlist</span>
      </Link>

      <Link to="/cart" className={`mobile-nav-item ${isActive('/cart') ? 'active' : ''}`}>
        <div className="icon-wrapper">
          <FiShoppingCart className="nav-icon" />
          {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
        </div>
        <span>Cart</span>
      </Link>

      <Link to="/customer" className={`mobile-nav-item ${isActive('/customer') ? 'active' : ''}`}>
        <FiUser className="nav-icon" />
        <span>Account</span>
      </Link>
    </div>
  );
};

export default MobileNav;

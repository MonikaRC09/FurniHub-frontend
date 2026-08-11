import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiShoppingCart, FiHeart, FiMenu, FiX, FiLogOut, FiKey, FiShield, FiPackage } from 'react-icons/fi';
import { authAPI } from '../services/api';
import { getCartCount } from '../utils/cart';
import { getWishlistItems } from '../utils/wishlist';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch { setUser(null); }
      } else {
        setUser(null);
      }
    };

    syncUser();
    setCartCount(getCartCount());
    setWishlistCount(getWishlistItems().length);

    const handleStorageChange = () => {
      syncUser();
      setCartCount(getCartCount());
      setWishlistCount(getWishlistItems().length);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cart:updated', handleStorageChange);
    window.addEventListener('wishlist:updated', handleStorageChange);
    window.addEventListener('auth:updated', syncUser);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cart:updated', handleStorageChange);
      window.removeEventListener('wishlist:updated', handleStorageChange);
      window.removeEventListener('auth:updated', syncUser);
    };
  }, []);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('furnihub_cart');
    localStorage.removeItem('furnihub_wishlist');
    localStorage.removeItem('furnihub_user_orders');
    setUser(null);
    window.dispatchEvent(new Event('auth:updated'));
    window.dispatchEvent(new Event('cart:updated'));
    window.dispatchEvent(new Event('wishlist:updated'));
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <span className="brand-icon-text">FH</span>
          </div>
          <div className="brand-text">
            <span className="brand-name">FurniHub</span>
            <span className="brand-tagline">Comfortable Living Spaces</span>
          </div>
        </Link>

        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          <div className="navbar-links">
            <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/categories" className="nav-link" onClick={() => setIsOpen(false)}>Categories</Link>
            <Link to="/admin" className="nav-link" onClick={() => setIsOpen(false)}>Admin</Link>
          </div>

          <div className="navbar-actions">
            <Link to="/wishlist" className="nav-icon cart-icon" title="View Wishlist">
              <FiHeart />
              <span className="cart-badge">{wishlistCount}</span>
            </Link>

            <Link to="/cart" className="nav-icon cart-icon" title="View Shopping Cart">
              <FiShoppingCart />
              <span className="cart-badge">{cartCount}</span>
            </Link>

            {user ? (
              <div className="user-menu">
                <Link to="/customer" className="user-avatar" title="Go to My Account">
                  <FiUser />
                </Link>
                <span className="welcome-text">Welcome, {user.fullName}</span>
                <div className="user-dropdown">
                  <span className="user-name">{user.fullName}</span>
                  <Link to="/orders" className="dropdown-item">
                    <FiPackage /> My Orders
                  </Link>
                  <Link to="/customer" className="dropdown-item">
                    <FiUser /> My Account
                  </Link>
                  <Link to="/admin" className="dropdown-item">
                    <FiShield /> Admin Dashboard
                  </Link>
                  <Link to="/change-password" className="dropdown-item">
                    <FiKey /> Change Password
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item logout-btn">
                    <FiLogOut /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="nav-link btn-login">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
              </div>
            )}
          </div>
        </div>

        <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

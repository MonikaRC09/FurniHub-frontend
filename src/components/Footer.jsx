import React from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter, FiInstagram, FiLinkedin } from 'react-icons/fi';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-section">
            <div className="footer-brand">
              <div className="brand-icon">
                <span className="brand-icon-text">FH</span>
              </div>
              <h3>FurniHub</h3>
            </div>
            <p className="footer-desc">
              FurniHub creates comfortable living spaces with stylish furniture for every family.
              We bring elegance and comfort to your home.
            </p>
            <div className="social-links">
              <a href="#facebook" className="social-link"><FiFacebook /></a>
              <a href="#twitter" className="social-link"><FiTwitter /></a>
              <a href="#instagram" className="social-link"><FiInstagram /></a>
              <a href="#linkedin" className="social-link"><FiLinkedin /></a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/categories">Products & Categories</Link></li>
              <li><Link to="/orders">My Orders & Tracking</Link></li>
              <li><Link to="/cart">Cart</Link></li>
              <li><Link to="/wishlist">Wishlist</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Customer Service</h4>
            <ul className="footer-links">
              <li><Link to="/">FAQ</Link></li>
              <li><Link to="/">Shipping Policy</Link></li>
              <li><Link to="/">Return Policy</Link></li>
              <li><Link to="/">Privacy Policy</Link></li>
              <li><Link to="/">Terms of Service</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contact Us</h4>
            <ul className="contact-links">
              <li><FiMapPin /> 123 FurniHub Street, Design District, NY 10001</li>
              <li><FiPhone /> +1 (555) 123-4567</li>
              <li><FiMail /> support@furnihub.com</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} FurniHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

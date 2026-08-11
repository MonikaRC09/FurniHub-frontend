import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiArrowRight, FiStar, FiShield, FiTruck, FiRefreshCw, 
  FiX, FiHeart, FiShoppingBag, FiCheck, FiChevronRight 
} from 'react-icons/fi';
import { catalogAPI } from '../services/api';
import { addToCartItem, isUserLoggedIn } from '../utils/cart';
import { isInWishlist, toggleWishlistItem } from '../utils/wishlist';
import '../styles/Home.css';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&q=80',
    title: 'Teak Wood & Luxury Living Collections',
    subtitle: 'Crafted for timeless elegance, comfort, and interior sophistication',
    badge: 'NEW SEASON ARRIVALS'
  },
  {
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&q=80',
    title: 'Modern Ergonomic Seating & Sofas',
    subtitle: 'Up to 35% OFF on Velvet & Leatherette Living Room Sets',
    badge: 'BESTSELLER COLLECTION'
  },
  {
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de29719f?w=1600&q=80',
    title: 'Solid Oak Dining & Family Tables',
    subtitle: 'Where every meal becomes a memorable celebration',
    badge: 'IKEA INSPIRED STYLES'
  },
];

const roomCategories = [
  { name: 'Living Room', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=80', count: '14 Products' },
  { name: 'Bedroom', image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=500&q=80', count: '18 Products' },
  { name: 'Dining Room', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80', count: '10 Products' },
  { name: 'Home Office', image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&q=80', count: '12 Products' },
];

const Home = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [welcomeName, setWelcomeName] = useState(null);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [addedItemIds, setAddedItemIds] = useState([]);
  const [wishlistState, setWishlistState] = useState({});
  const observerRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const { fullName } = JSON.parse(userData);
        if (fullName && !sessionStorage.getItem('welcomeShown')) {
          setWelcomeName(fullName);
          sessionStorage.setItem('welcomeShown', 'true');
        }
      } catch (_) {}
    }

    // Load trending products
    const loadTrending = async () => {
      try {
        const res = await catalogAPI.getAllProducts();
        const prods = res.data || [];
        setTrendingProducts(prods.slice(0, 6));

        const stateMap = {};
        prods.forEach(p => {
          const id = p.productId || p.id;
          stateMap[id] = isInWishlist(id);
        });
        setWishlistState(stateMap);
      } catch (err) {
        console.warn('Failed to load trending products:', err);
      }
    };

    loadTrending();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const features = [
    { icon: FiTruck, title: 'Free Doorstep Shipping', desc: '100% Free delivery across 20,000+ pincodes in India' },
    { icon: FiShield, title: '5-Year Brand Warranty', desc: 'Comprehensive coverage against manufacturing defects' },
    { icon: FiRefreshCw, title: '30-Day Easy Returns', desc: 'Hassle-free replacement and money-back guarantee' },
    { icon: FiStar, title: 'Expert Carpenter Assembly', desc: 'Free white-glove installation at your home' },
  ];

  const handleAddToCart = async (product, e) => {
    if (e) e.stopPropagation();
    if (!isUserLoggedIn()) {
      alert('Please login or signup to add items to cart!');
      navigate('/login');
      return;
    }

    const res = await addToCartItem(product, navigate);
    if (res.success) {
      setAddedItemIds((prev) => [...prev, product.productId || product.id]);
      setTimeout(() => {
        setAddedItemIds((prev) => prev.filter((id) => id !== (product.productId || product.id)));
      }, 1800);
    }
  };

  const handleToggleWishlist = (product, e) => {
    if (e) e.stopPropagation();
    if (!isUserLoggedIn()) {
      alert('Please login or signup to save items to your wishlist!');
      navigate('/login');
      return;
    }
    const prodId = product.productId || product.id;
    toggleWishlistItem({
      id: prodId,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      categoryName: product.categoryName
    });
    setWishlistState(prev => ({ ...prev, [prodId]: !prev[prodId] }));
  };

  const dismissWelcome = () => setWelcomeName(null);

  return (
    <div className="home">
      {/* Welcome Banner */}
      {welcomeName && (
        <div className="welcome-banner">
          <div className="welcome-content">
            <span className="welcome-icon">&#128075;</span>
            <span>Welcome back, <strong>{welcomeName}</strong>! Enjoy exclusive FurniHub member offers.</span>
          </div>
          <button className="welcome-close" onClick={dismissWelcome} aria-label="Dismiss">
            <FiX />
          </button>
        </div>
      )}

      {/* Hero Slider */}
      <section className="hero-slider">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`slide ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="slide-overlay" />
            <div className="slide-content">
              <span className="slide-badge">{slide.badge}</span>
              <h1 className="slide-title">{slide.title}</h1>
              <p className="slide-subtitle">{slide.subtitle}</p>
              <div className="slide-actions">
                <Link to="/categories" className="btn btn-primary btn-lg">
                  Shop FurniHub Catalog <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>
        ))}
        <div className="slider-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* Trust & Service Highlights Banner */}
      <section className="features-section" data-animate="features">
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                <feature.icon />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by Room (IKEA Inspired Visual Categories) */}
      <section className="shop-by-room-section container py-5" data-animate="rooms">
        <div className="section-header-center">
          <span className="sub-title">INTERIOR DESIGN COLLECTIONS</span>
          <h2>Shop FurniHub By Room</h2>
          <p>Curated sets designed to bring harmony, luxury, and comfort to every corner</p>
        </div>

        <div className="room-categories-grid">
          {roomCategories.map((room, idx) => (
            <div 
              key={idx} 
              className="room-cat-card" 
              onClick={() => navigate('/categories')}
            >
              <img src={room.image} alt={room.name} />
              <div className="room-card-overlay">
                <span className="count-pill">{room.count}</span>
                <h3>{room.name}</h3>
                <span className="explore-link">Explore Room <FiChevronRight /></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending & Best Sellers Carousel Grid */}
      {trendingProducts.length > 0 && (
        <section className="trending-section container py-4" data-animate="trending">
          <div className="section-header-flex">
            <div>
              <span className="sub-title">CUSTOMER FAVORITES</span>
              <h2>Trending Furniture Pieces</h2>
            </div>
            <Link to="/categories" className="btn btn-secondary btn-sm">
              View All Products <FiArrowRight />
            </Link>
          </div>

          <div className="home-products-grid">
            {trendingProducts.map((prod) => {
              const prodId = prod.productId || prod.id;
              const isAdded = addedItemIds.includes(prodId);
              const wishlisted = wishlistState[prodId];

              return (
                <div 
                  key={prodId} 
                  className="home-product-card"
                  onClick={() => navigate(`/product/${prodId}`)}
                >
                  <div className="card-img-box">
                    <img src={prod.imageUrl} alt={prod.name} />
                    <button 
                      className={`wishlist-heart-btn ${wishlisted ? 'active' : ''}`}
                      onClick={(e) => handleToggleWishlist(prod, e)}
                    >
                      <FiHeart className={wishlisted ? 'filled' : ''} />
                    </button>
                  </div>

                  <div className="card-info">
                    <div className="stars-row">
                      <FiStar /><FiStar /><FiStar /><FiStar /><FiStar />
                      <span>(4.8)</span>
                    </div>

                    <h3>{prod.name}</h3>
                    
                    <div className="price-actions-row">
                      <span className="price">₹{(prod.price || 0).toLocaleString('en-IN')}</span>
                      <button 
                        className={`btn btn-primary btn-sm ${isAdded ? 'btn-success' : ''}`}
                        onClick={(e) => handleAddToCart(prod, e)}
                      >
                        {isAdded ? <FiCheck /> : <FiShoppingBag />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* IKEA Style CTA Banner */}
      <section className="cta-banner" data-animate="cta">
        <div className="cta-content">
          <h2>Create Your Dream Living Room Today</h2>
          <p>Join FurniHub to unlock member discounts, free technician assembly, and custom interior solutions.</p>
          <Link to="/categories" className="btn btn-primary btn-lg">
            Shop Catalog Now <FiArrowRight />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Home;

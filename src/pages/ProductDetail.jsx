import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiStar, FiShoppingBag, FiHeart, FiCheck, FiTruck, 
  FiShield, FiRotateCcw, FiMapPin, FiChevronRight, FiBox, 
  FiInfo, FiLayers
} from 'react-icons/fi';
import { catalogAPI } from '../services/api';
import { addToCart } from '../utils/cart';
import { isInWishlist, toggleWishlistItem } from '../utils/wishlist';
import '../styles/ProductDetail.css';

const defaultSpecs = {
  material: 'Premium Solid Teak Wood & High-Density Foam',
  finish: 'Natural Honey Teak Polish',
  dimensions: '78" W × 36" D × 34" H (198cm × 91cm × 86cm)',
  seatingCapacity: '3 Seater / Ergonomic Comfort',
  weight: '45 kg',
  assembly: 'Free Expert Technician Assembly at Delivery',
  warranty: '5 Years Comprehensive Brand Warranty',
  care: 'Wipe clean with soft dry cloth. Avoid direct exposure to moisture.'
};

const sampleReviews = [
  { id: 1, name: 'Vikram Sharma', rating: 5, date: '12 July 2026', comment: 'Exceptional wood finish and super comfortable cushioning! Delivered right on time and assembly took under 15 minutes.', verified: true },
  { id: 2, name: 'Ananya Roy', rating: 5, date: '28 June 2026', comment: 'Feels extremely luxurious and sturdy in my living room. Completely transformed our home decor!', verified: true },
  { id: 3, name: 'Rahul Verma', rating: 4, date: '15 May 2026', comment: 'Great product quality for the price. Packaging was solid with zero damage during transit.', verified: true }
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('400001');
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [reviewsList, setReviewsList] = useState(sampleReviews);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [activeTab, setActiveTab] = useState('specs');

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    let userName = 'Verified Customer';
    try {
      const stored = localStorage.getItem('user');
      if (stored) userName = JSON.parse(stored).fullName || userName;
    } catch (_) {}

    const rev = {
      id: Date.now(),
      name: userName,
      rating: Number(newReviewRating),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      comment: newReviewComment.trim(),
      verified: true
    };

    setReviewsList([rev, ...reviewsList]);
    setNewReviewComment('');
    setShowReviewModal(false);
    showToast('Thank you for submitting your product review!');
  };

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const [prodRes, allProdsRes] = await Promise.all([
          catalogAPI.getProductById(id),
          catalogAPI.getAllProducts()
        ]);

        const prod = prodRes.data;
        setProduct(prod);
        setSelectedImage(prod.imageUrl || '');
        setIsWishlisted(isInWishlist(prod.productId || prod.id));

        const all = allProdsRes.data || [];
        const related = all.filter(p => (p.productId || p.id) !== Number(id)).slice(0, 4);
        setRelatedProducts(related);
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
    window.scrollTo(0, 0);
  }, [id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.productId || product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl
      });
    }
    showToast(`Added ${quantity} unit(s) of "${product.name}" to your cart!`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    const updatedWishlist = toggleWishlistItem({
      id: product.productId || product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      categoryName: product.categoryName
    });
    const wishlistedNow = updatedWishlist.some(item => (item.id || item.productId) === (product.productId || product.id));
    setIsWishlisted(wishlistedNow);
    showToast(wishlistedNow ? `Saved "${product.name}" to Wishlist!` : `Removed from Wishlist.`);
  };

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode.trim())) {
      setPincodeStatus({ type: 'error', text: 'Please enter a valid 6-digit Indian Pincode.' });
      return;
    }
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 4);
    const formattedDate = deliveryDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    setPincodeStatus({
      type: 'success',
      text: `Express Delivery available to ${pincode}! Delivered by ${formattedDate} with Free Doorstep Installation.`
    });
  };

  if (loading) {
    return (
      <div className="product-detail-page page-container text-center py-5">
        <div className="spin-loader"></div>
        <p className="mt-3 text-muted">Loading FurniHub product specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page page-container text-center py-5">
        <h2>Furniture Item Not Found</h2>
        <p className="text-muted">The requested furniture item may have been moved or is out of stock.</p>
        <Link to="/categories" className="btn btn-primary mt-3">Back to Store Catalog</Link>
      </div>
    );
  }

  const thumbnails = [
    product.imageUrl,
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80'
  ].filter(Boolean);

  return (
    <div className="product-detail-page">
      <div className="container">
        
        {/* Breadcrumbs */}
        <nav className="breadcrumb-nav">
          <Link to="/">Home</Link> <FiChevronRight /> 
          <Link to="/categories">Catalog</Link> <FiChevronRight /> 
          <span className="current">{product.name}</span>
        </nav>

        {/* Notification Toast */}
        {toastMessage && (
          <div className="floating-toast">
            <FiCheck /> {toastMessage}
          </div>
        )}

        {/* Main Product Stage */}
        <div className="product-stage-grid">
          
          {/* Left: Gallery */}
          <div className="product-gallery">
            <div className="main-image-wrapper">
              {selectedImage ? (
                <img src={selectedImage} alt={product.name} className="main-img" />
              ) : (
                <div className="img-placeholder"><FiBox /></div>
              )}
              <button 
                className={`wishlist-badge-btn ${isWishlisted ? 'active' : ''}`}
                onClick={handleToggleWishlist}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <FiHeart className={isWishlisted ? 'filled' : ''} />
              </button>
            </div>

            <div className="thumbnails-row">
              {thumbnails.map((imgUrl, idx) => (
                <div 
                  key={idx} 
                  className={`thumb-box ${selectedImage === imgUrl ? 'active' : ''}`}
                  onClick={() => setSelectedImage(imgUrl)}
                >
                  <img src={imgUrl} alt={`Angle ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Buy Box & Info */}
          <div className="product-buy-box">
            <span className="product-brand-tag">FurniHub Signature Collection</span>
            <h1 className="product-title">{product.name}</h1>

            {/* Ratings Summary */}
            <div className="ratings-bar">
              <div className="rating-pill">
                <span>4.8</span> <FiStar className="star-icon" />
              </div>
              <span className="reviews-count">128 Verified Ratings & 42 Reviews</span>
            </div>

            {/* Pricing Section */}
            <div className="price-block">
              <span className="current-price">₹{(product.price || 0).toLocaleString('en-IN')}</span>
              <span className="original-price">₹{Math.round((product.price || 0) * 1.25).toLocaleString('en-IN')}</span>
              <span className="discount-tag">20% OFF</span>
              <p className="tax-inclusive-note">Inclusive of all taxes & 100% Free Shipping</p>
            </div>

            {/* Short Description */}
            <p className="short-desc">
              {product.description || 'Crafted with premium materials and ergonomic design for lasting durability, comfort, and timeless interior elegance.'}
            </p>

            {/* Stock Availability */}
            <div className="stock-status-wrapper mb-3">
              <span className={`status-pill-lg ${product.stock > 5 ? 'in-stock' : product.stock > 0 ? 'low-stock' : 'out-of-stock'}`}>
                {product.stock > 5 ? 'In Stock (Ready to Ship)' : product.stock > 0 ? `Hurry, only ${product.stock} left in stock!` : 'Out of Stock'}
              </span>
            </div>

            {/* Pincode & Delivery Checker */}
            <div className="pincode-checker-box">
              <div className="checker-header">
                <FiMapPin className="pin-icon" />
                <span>Check Delivery & Technician Assembly</span>
              </div>
              <form onSubmit={handleCheckPincode} className="pincode-form">
                <input 
                  type="text" 
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit Pincode"
                  maxLength="6"
                />
                <button type="submit" className="btn btn-secondary btn-sm">Check</button>
              </form>
              {pincodeStatus && (
                <div className={`pincode-result result-${pincodeStatus.type}`}>
                  {pincodeStatus.type === 'success' ? <FiTruck /> : <FiInfo />}
                  <span>{pincodeStatus.text}</span>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="quantity-section mt-3">
              <label>Select Quantity:</label>
              <div className="quantity-controls-lg">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="buy-actions-group">
              <button 
                className="btn btn-secondary btn-lg flex-1"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
              >
                <FiShoppingBag /> Add to Cart
              </button>
              <button 
                className="btn btn-primary btn-lg flex-1"
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
              >
                Buy Now
              </button>
            </div>

            {/* Trust Guarantee Highlights */}
            <div className="trust-highlights-grid">
              <div className="trust-item">
                <FiTruck className="icon" />
                <div>
                  <strong>Free Express Shipping</strong>
                  <span>Direct to your doorstep</span>
                </div>
              </div>
              <div className="trust-item">
                <FiShield className="icon" />
                <div>
                  <strong>5-Year Warranty</strong>
                  <span>Comprehensive coverage</span>
                </div>
              </div>
              <div className="trust-item">
                <FiRotateCcw className="icon" />
                <div>
                  <strong>30-Day Easy Returns</strong>
                  <span>Hassle-free replacement</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Detailed Tabs: Specifications, Reviews, Care */}
        <div className="product-details-tabs-section mt-5">
          <div className="details-tab-buttons">
            <button 
              className={`details-tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
              onClick={() => setActiveTab('specs')}
            >
              <FiLayers /> Product Specifications
            </button>
            <button 
              className={`details-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <FiStar /> Customer Reviews (4.8 / 5)
            </button>
            <button 
              className={`details-tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipping')}
            >
              <FiTruck /> Shipping & Installation
            </button>
          </div>

          <div className="details-tab-panel">
            {activeTab === 'specs' && (
              <div className="specs-table-wrapper">
                <table className="specs-table">
                  <tbody>
                    <tr><td>Primary Material</td><td>{defaultSpecs.material}</td></tr>
                    <tr><td>Wood Polish / Finish</td><td>{defaultSpecs.finish}</td></tr>
                    <tr><td>Dimensions (L × W × H)</td><td>{defaultSpecs.dimensions}</td></tr>
                    <tr><td>Capacity & Comfort</td><td>{defaultSpecs.seatingCapacity}</td></tr>
                    <tr><td>Weight</td><td>{defaultSpecs.weight}</td></tr>
                    <tr><td>Assembly Type</td><td>{defaultSpecs.assembly}</td></tr>
                    <tr><td>Brand Warranty</td><td>{defaultSpecs.warranty}</td></tr>
                    <tr><td>Care Instructions</td><td>{defaultSpecs.care}</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="reviews-panel">
                <div className="reviews-score-card">
                  <div className="score-main">
                    <h2>4.8</h2>
                    <div className="stars"><FiStar /><FiStar /><FiStar /><FiStar /><FiStar /></div>
                    <span>Based on {reviewsList.length + 125} verified customer experiences</span>
                  </div>
                  <button className="btn btn-secondary btn-sm ml-auto" onClick={() => setShowReviewModal(true)}>
                    ★ Write a Review
                  </button>
                </div>

                <div className="reviews-list mt-4">
                  {reviewsList.map(rev => (
                    <div key={rev.id} className="review-card">
                      <div className="review-header">
                        <div className="user-meta">
                          <strong>{rev.name}</strong>
                          {rev.verified && <span className="verified-badge"><FiCheck /> Verified Buyer</span>}
                        </div>
                        <span className="review-date">{rev.date}</span>
                      </div>
                      <div className="review-stars">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <FiStar key={i} className="star-icon" />
                        ))}
                      </div>
                      <p className="review-comment">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODAL: WRITE A REVIEW */}
            {showReviewModal && (
              <div className="admin-modal-overlay">
                <div className="admin-modal modal-sm">
                  <div className="modal-header">
                    <h3>Write a Product Review</h3>
                    <button className="close-btn" onClick={() => setShowReviewModal(false)}>✕</button>
                  </div>
                  <form onSubmit={handleAddReview} className="admin-form">
                    <div className="form-group">
                      <label>Star Rating</label>
                      <select value={newReviewRating} onChange={(e) => setNewReviewRating(e.target.value)}>
                        <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
                        <option value="4">⭐⭐⭐⭐ 4 - Very Good</option>
                        <option value="3">⭐⭐⭐ 3 - Good</option>
                        <option value="2">⭐⭐ 2 - Average</option>
                        <option value="1">⭐ 1 - Poor</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Your Feedback & Review</label>
                      <textarea 
                        rows="4" 
                        placeholder="Share details about comfort, wood quality, delivery experience..."
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        required
                      />
                    </div>

                    <div className="modal-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Submit Review</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="shipping-info-panel">
                <h3>Delivery & White-Glove Installation Guidelines</h3>
                <ul>
                  <li><strong>Free Delivery:</strong> All orders qualify for 100% free doorstep delivery across India.</li>
                  <li><strong>Expert Assembly:</strong> Our certified carpentry technician will unpack and assemble the furniture at your preferred spot free of cost upon delivery.</li>
                  <li><strong>Quality Check:</strong> Thorough inspection is carried out in front of you before handover.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="related-products-section mt-5">
            <h3 className="section-title">Similar Furniture You Might Like</h3>
            <div className="related-grid">
              {relatedProducts.map(rel => (
                <div key={rel.productId || rel.id} className="related-card" onClick={() => navigate(`/product/${rel.productId || rel.id}`)}>
                  <div className="img-wrapper">
                    {rel.imageUrl ? (
                      <img src={rel.imageUrl} alt={rel.name} />
                    ) : (
                      <div className="img-placeholder"><FiBox /></div>
                    )}
                  </div>
                  <div className="related-info">
                    <h4>{rel.name}</h4>
                    <div className="price-row">
                      <strong className="price">₹{(rel.price || 0).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetail;

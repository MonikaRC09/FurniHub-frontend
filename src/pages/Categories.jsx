import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiShoppingCart, FiCheck, FiSearch, 
  FiHeart, FiStar, FiSliders, FiBox, FiChevronRight, FiEye, FiTruck, FiShield 
} from 'react-icons/fi';
import api from '../services/api';
import { getCatalogData } from '../utils/catalog';
import { addToCartItem, isUserLoggedIn } from '../utils/cart';
import { isInWishlist, toggleWishlistItem } from '../utils/wishlist';
import '../styles/Categories.css';

const MAIN_CATEGORIES = [
  'Living room',
  'Bed room',
  'Dining',
  'Office',
  'Storage',
  'Decoration'
];

const isCategoryMatch = (prodCat, targetCat) => {
  if (!prodCat || !targetCat) return false;
  const p = prodCat.toLowerCase().trim();
  const t = targetCat.toLowerCase().trim();
  if (p === t) return true;
  if (t === 'dining' && (p === 'dinning' || p.includes('dinning') || p.includes('dining'))) return true;
  if (t === 'dinning' && (p === 'dining' || p.includes('dinning') || p.includes('dining'))) return true;
  return p.includes(t);
};

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);
  const [activeMainCategory, setActiveMainCategory] = useState('All');
  const [activeSubCategory, setActiveSubCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState(250000);
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'price-low', 'price-high', 'rating'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState([]);
  const [wishlistState, setWishlistState] = useState({});

  // Quick View Modal State
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const fetchCatalogData = async (isRetry = false) => {
    setLoading(true);
    setErrorState(false);
    try {
      const [categoriesResponse, productsResponse] = await Promise.all([
        api.get('/categories').catch(() => null),
        api.get('/products').catch(() => null),
      ]);
      const { categories: loadedCategories, products: loadedProducts } = getCatalogData(categoriesResponse, productsResponse);

      if (loadedProducts && loadedProducts.length > 0) {
        setCategories(loadedCategories);
        setProducts(loadedProducts);

        const stateMap = {};
        loadedProducts.forEach(p => {
          const id = p.id || p.productId;
          stateMap[id] = isInWishlist(id);
        });
        setWishlistState(stateMap);
        setLoading(false);
      } else {
        // If 0 products returned and hasn't retried yet, auto retry in 3.5 seconds (for Render backend cold start)
        if (!isRetry) {
          setTimeout(() => {
            fetchCatalogData(true);
          }, 3500);
        } else {
          setCategories(loadedCategories || []);
          setProducts(loadedProducts || []);
          setLoading(false);
          setErrorState(true);
        }
      }
    } catch (error) {
      console.error('Failed to load catalog', error);
      if (!isRetry) {
        setTimeout(() => {
          fetchCatalogData(true);
        }, 3500);
      } else {
        setCategories([]);
        setProducts([]);
        setLoading(false);
        setErrorState(true);
      }
    }
  };

  useEffect(() => {
    fetchCatalogData(false);

    const handleWishlistChange = () => {
      setWishlistState(prev => {
        const updated = { ...prev };
        products.forEach(p => {
          const id = p.id || p.productId;
          updated[id] = isInWishlist(id);
        });
        return updated;
      });
    };

    window.addEventListener('wishlist:updated', handleWishlistChange);
    return () => window.removeEventListener('wishlist:updated', handleWishlistChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSubcategoriesForMain = (mainCatName) => {
    if (mainCatName === 'All') {
      return categories.filter(c => c.parentId !== null);
    }
    const parent = categories.find(c => isCategoryMatch(c.name, mainCatName));
    if (!parent) {
      return categories.filter(c => c.parentName && isCategoryMatch(c.parentName, mainCatName));
    }
    return categories.filter(c => c.parentId === parent.id);
  };

  const currentSubcategories = getSubcategoriesForMain(activeMainCategory);

  const filteredProducts = products.filter(product => {
    // Search Filter
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // Main category match
    let matchesMain = true;
    if (activeMainCategory !== 'All') {
      matchesMain = (product.parentCategoryName && isCategoryMatch(product.parentCategoryName, activeMainCategory)) ||
                    (product.categoryName && isCategoryMatch(product.categoryName, activeMainCategory));
    }

    // Subcategory match
    let matchesSub = true;
    if (activeSubCategory !== 'All') {
      matchesSub = product.categoryName && isCategoryMatch(product.categoryName, activeSubCategory);
    }

    // Price Filter
    const matchesPrice = Number(product.price) <= maxPriceFilter;

    // Stock Filter
    const matchesStock = !inStockOnly || (product.stock !== undefined ? product.stock > 0 : true);

    return matchesSearch && matchesMain && matchesSub && matchesPrice && matchesStock;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
    if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
    if (sortBy === 'rating') return (b.rating || 4.8) - (a.rating || 4.8);
    return (b.id || 0) - (a.id || 0); // Featured / Default
  });

  const handleAddToCart = async (product, e) => {
    if (e) e.stopPropagation();
    if (!isUserLoggedIn()) {
      alert('Please login or signup to add items to cart!');
      navigate('/login');
      return;
    }

    const res = await addToCartItem(product, navigate);
    if (res.success) {
      setAddedItemIds((prev) => [...prev, product.id]);
      setTimeout(() => {
        setAddedItemIds((prev) => prev.filter((id) => id !== product.id));
      }, 1800);
    }
  };

  const handleToggleWishlist = (product, e) => {
    if (e) e.stopPropagation();
    const prodId = product.id || product.productId;
    toggleWishlistItem({
      id: prodId,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      categoryName: product.categoryName
    });
    setWishlistState(prev => ({ ...prev, [prodId]: !prev[prodId] }));
  };

  return (
    <div className="categories-page">
      
      {/* Header */}
      <div className="categories-header">
        <h1>Explore Premium Furniture Collections</h1>
        <p>Handcrafted solid teak wood, ergonomic seating, and modern decor for living spaces</p>
      </div>

      {/* Main Categories Tabs */}
      <div className="main-category-tabs">
        <button
          className={`main-tab ${activeMainCategory === 'All' ? 'active' : ''}`}
          onClick={() => {
            setActiveMainCategory('All');
            setActiveSubCategory('All');
          }}
        >
          All Furniture ({products.length})
        </button>
        {MAIN_CATEGORIES.map((mainCat) => {
          const count = products.filter(p => 
            (p.parentCategoryName && isCategoryMatch(p.parentCategoryName, mainCat)) ||
            (p.categoryName && isCategoryMatch(p.categoryName, mainCat))
          ).length;

          return (
            <button
              key={mainCat}
              className={`main-tab ${activeMainCategory === mainCat ? 'active' : ''}`}
              onClick={() => {
                setActiveMainCategory(mainCat);
                setActiveSubCategory('All');
              }}
            >
              {mainCat} ({count})
            </button>
          );
        })}
      </div>

      {/* Search, Filter Toolbar & Sorting */}
      <div className="catalog-filter-toolbar">
        
        {/* Instant Search Bar */}
        <div className="search-input-box">
          <FiSearch className="icon" />
          <input 
            type="text" 
            placeholder="Search sofas, dining tables, beds, office chairs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        {/* Price Slider */}
        <div className="price-slider-box">
          <label><FiSliders /> Max Price: <strong>₹{maxPriceFilter.toLocaleString('en-IN')}</strong></label>
          <input 
            type="range" 
            min="5000" 
            max="250000" 
            step="5000"
            value={maxPriceFilter}
            onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
          />
        </div>

        {/* In-Stock Filter & Sort Dropdown */}
        <div className="sort-filter-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={inStockOnly} 
              onChange={(e) => setInStockOnly(e.target.checked)} 
            />
            In Stock Only
          </label>

          <div className="sort-dropdown-box">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="featured">Sort by: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

      </div>

      {/* Subcategories Filter Pills */}
      {currentSubcategories.length > 0 && (
        <div className="subcategory-pills">
          <span className="sub-label">Subcategories:</span>
          <button
            className={`sub-pill ${activeSubCategory === 'All' ? 'active' : ''}`}
            onClick={() => setActiveSubCategory('All')}
          >
            All Subcategories
          </button>
          {currentSubcategories.map(sub => {
            const count = products.filter(p => p.categoryName && p.categoryName.toLowerCase() === sub.name.toLowerCase()).length;
            return (
              <button
                key={sub.id}
                className={`sub-pill ${activeSubCategory === sub.name ? 'active' : ''}`}
                onClick={() => setActiveSubCategory(sub.name)}
              >
                {sub.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Results Bar */}
      <div className="categories-results-bar">
        <span>Showing <strong>{filteredProducts.length}</strong> items in catalog</span>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="categories-loading-box">
          <div className="loading-spinner"></div>
          <h3>Loading FurniHub Collections...</h3>
          <p>Connecting to catalog server...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="no-products-msg">
          <FiBox className="empty-box-icon" />
          <h3>No matching furniture found</h3>
          <p>{errorState ? "Catalog server is starting up or unreachable. Please try again." : "Try adjusting your search query, price slider, or subcategory filters."}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '1rem' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => { setSearchQuery(''); setMaxPriceFilter(250000); setActiveMainCategory('All'); setActiveSubCategory('All'); }}
            >
              Reset All Filters
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => fetchCatalogData(true)}
            >
              Retry Loading
            </button>
          </div>
        </div>
      ) : (
        <div className="category-products-grid">
          {filteredProducts.map((product) => {
            const isAdded = addedItemIds.includes(product.id);
            const prodId = product.id || product.productId;
            const wishlisted = wishlistState[prodId];

            return (
              <div 
                key={prodId} 
                className="category-product-card"
                onClick={() => navigate(`/product/${prodId}`)}
              >
                <div className="category-product-image">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} />
                  ) : (
                    <div className="category-product-image-placeholder">
                      <FiBox />
                    </div>
                  )}
                  {product.categoryName && (
                    <span className="product-subcat-badge">{product.categoryName}</span>
                  )}
                  
                  {/* Quick View & Heart Wishlist Buttons */}
                  <div className="card-top-actions">
                    <button 
                      className="quick-view-btn"
                      onClick={(e) => { e.stopPropagation(); setQuickViewProduct(product); }}
                      title="Quick Preview"
                    >
                      <FiEye /> Quick View
                    </button>
                    <button 
                      className={`wishlist-heart-btn ${wishlisted ? 'active' : ''}`}
                      onClick={(e) => handleToggleWishlist(product, e)}
                      title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    >
                      <FiHeart className={wishlisted ? 'filled' : ''} />
                    </button>
                  </div>
                </div>

                <div className="category-product-details">
                  <div className="rating-row">
                    <span className="stars"><FiStar /><FiStar /><FiStar /><FiStar /><FiStar /></span>
                    <span className="score">4.8</span>
                  </div>

                  <h4>{product.name}</h4>
                  <p className="category-product-desc">
                    {product.description ? (product.description.length > 70 ? product.description.substring(0, 70) + '...' : product.description) : 'Solid teak wood craftsmanship.'}
                  </p>

                  <div className="category-product-footer">
                    <span className="category-product-price">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </span>
                    <button
                      className={`btn btn-primary btn-sm ${isAdded ? 'btn-success' : ''}`}
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      {isAdded ? (
                        <>
                          <FiCheck /> Added
                        </>
                      ) : (
                        <>
                          <FiShoppingCart /> Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK VIEW LIGHTBOX MODAL */}
      {quickViewProduct && (
        <div className="admin-modal-overlay" onClick={() => setQuickViewProduct(null)}>
          <div className="admin-modal modal-lg quick-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quick View: {quickViewProduct.name}</h3>
              <button className="close-btn" onClick={() => setQuickViewProduct(null)}>✕</button>
            </div>

            <div className="quick-view-body">
              <div className="quick-view-image">
                {quickViewProduct.imageUrl ? (
                  <img src={quickViewProduct.imageUrl} alt={quickViewProduct.name} />
                ) : (
                  <div className="img-placeholder"><FiBox /></div>
                )}
              </div>

              <div className="quick-view-info">
                <span className="cat-tag">{quickViewProduct.categoryName || 'Furniture'}</span>
                <h2>{quickViewProduct.name}</h2>
                
                <div className="rating-row my-2">
                  <span className="stars"><FiStar /><FiStar /><FiStar /><FiStar /><FiStar /></span>
                  <span className="score">4.8 (128 Reviews)</span>
                </div>

                <h3 className="quick-price">₹{Number(quickViewProduct.price || 0).toLocaleString('en-IN')}</h3>
                <p className="quick-desc">{quickViewProduct.description || 'Premium craftsmanship with durable finish for long-lasting home comfort.'}</p>

                <div className="quick-highlights">
                  <span><FiTruck /> Free Doorstep Shipping</span>
                  <span><FiShield /> 5-Year Brand Warranty</span>
                </div>

                <div className="quick-modal-actions mt-4">
                  <button 
                    className="btn btn-primary btn-block"
                    onClick={(e) => { handleAddToCart(quickViewProduct, e); setQuickViewProduct(null); }}
                  >
                    <FiShoppingCart /> Add to Cart
                  </button>
                  <button 
                    className="btn btn-secondary btn-block mt-2"
                    onClick={() => navigate(`/product/${quickViewProduct.id || quickViewProduct.productId}`)}
                  >
                    View Full Specifications <FiChevronRight />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;

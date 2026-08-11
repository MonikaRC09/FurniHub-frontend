import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiUser, FiMail, FiPhone, FiShield, FiKey, 
  FiShoppingCart, FiLogOut, FiPackage, FiTruck, 
  FiCheckCircle, FiClock, FiPrinter, FiMapPin, FiHeart 
} from 'react-icons/fi';
import { authAPI, orderAPI } from '../services/api';
import '../styles/Customer.css';

const ORDER_STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const Customer = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'profile'

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        fetchUserOrders();
      } catch {
        setUser(null);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchUserOrders = async () => {
    setLoadingOrders(true);
    let remoteOrders = [];
    try {
      const res = await orderAPI.getUserOrders();
      remoteOrders = res.data || [];
    } catch (err) {
      console.warn('Failed to load user orders from backend:', err);
    }

    // Merge with local fallback orders
    try {
      const localOrders = JSON.parse(localStorage.getItem('furnihub_user_orders') || '[]');
      const remoteIds = new Set(remoteOrders.map(o => o.orderId));
      
      const filteredLocal = localOrders.filter(l => {
        if (!l || !l.orderId) return false;
        if (remoteIds.has(l.orderId)) return false;
        
        // Deduplicate against remote orders by matching items and total amount
        const isDuplicate = remoteOrders.some(r => {
          const remoteTotal = Number(r.totalAmount || 0);
          const localTotal = Number(l.totalAmount || 0);
          if (Math.abs(remoteTotal - localTotal) > 0.01) return false;
          
          const rItems = (r.items || []).map(i => i.productName || i.name).sort().join(',');
          const lItems = (l.items || []).map(i => i.productName || i.name).sort().join(',');
          return rItems && lItems && rItems === lItems;
        });
        
        return !isDuplicate;
      });

      const combined = [...remoteOrders, ...filteredLocal];
      combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setUserOrders(combined);
      try {
        localStorage.setItem('furnihub_user_orders', JSON.stringify(filteredLocal));
      } catch (e) {}
    } catch (e) {
      setUserOrders(remoteOrders);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('furnihub_cart');
    localStorage.removeItem('furnihub_wishlist');
    localStorage.removeItem('furnihub_user_orders');
    window.dispatchEvent(new Event('auth:updated'));
    window.dispatchEvent(new Event('cart:updated'));
    window.dispatchEvent(new Event('wishlist:updated'));
    navigate('/login');
  };

  const getStepProgressIndex = (status) => {
    const st = String(status || 'PENDING').toUpperCase();
    if (st === 'CANCELLED') return -1;
    if (st === 'DELIVERED') return 3;
    if (st === 'SHIPPED') return 2;
    if (st === 'PROCESSING' || st === 'CONFIRMED' || st === 'SUCCESS') return 1;
    return 0;
  };

  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>FurniHub Invoice #${order.orderId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e67e22; padding-bottom: 15px; }
            .title { font-size: 24px; color: #1e293b; margin: 0; }
            .subtitle { color: #e67e22; font-weight: bold; }
            .info-table { width: 100%; margin-top: 20px; border-collapse: collapse; }
            .info-table td { padding: 8px 0; font-size: 14px; }
            .items-table { width: 100%; margin-top: 20px; border-collapse: collapse; }
            .items-table th, .items-table td { padding: 12px; border: 1px solid #cbd5e1; text-align: left; font-size: 14px; }
            .items-table th { background: #f8fafc; }
            .total-row { font-size: 16px; font-weight: bold; color: #e67e22; text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">FurniHub Furniture</h1>
              <p class="subtitle">Tax Invoice & Order Receipt</p>
            </div>
            <div style="text-align: right;">
              <strong>Invoice #: FH-INV-${order.orderId}</strong><br/>
              Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Recent'}
            </div>
          </div>

          <table class="info-table">
            <tr>
              <td><strong>Customer Name:</strong> ${user?.fullName || 'Customer'}</td>
              <td><strong>Payment Method:</strong> ${order.paymentMethod || 'COD'}</td>
            </tr>
            <tr>
              <td><strong>Delivery Address:</strong> ${order.deliveryAddress || 'Standard Shipping'}</td>
              <td><strong>Order Status:</strong> ${order.status || 'PROCESSING'}</td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th>Product Description</th>
                <th>Qty</th>
                <th>Price Per Unit</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map(i => `
                <tr>
                  <td>${i.productName || 'Furniture Item #' + i.productId}</td>
                  <td>${i.quantity}</td>
                  <td>₹${Number(i.pricePerUnit || 0).toLocaleString('en-IN')}</td>
                  <td>₹${Number(i.totalPrice || 0).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-row">
            Grand Total Paid: ₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="customer-page">
      <div className="customer-container">
        
        {/* Header Profile Banner */}
        <div className="customer-header">
          <div className="customer-avatar">
            <FiUser />
          </div>
          <div className="customer-title">
            <h1>Welcome back, {user.fullName}!</h1>
            <p className="customer-subtitle">Track your live furniture orders, addresses, and account preferences</p>
          </div>
          <button className="btn btn-secondary btn-sm logout-header-btn" onClick={handleLogout}>
            <FiLogOut /> Sign Out
          </button>
        </div>

        {/* Primary Dashboard Tabs */}
        <div className="customer-tabs">
          <button 
            className={`cust-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <FiPackage /> My Orders & Live Tracking ({userOrders.length})
          </button>
          <button 
            className={`cust-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser /> Account Profile & Settings
          </button>
        </div>

        {/* TAB 1: LIVE ORDERS & TRACKING */}
        {activeTab === 'orders' && (
          <div className="tab-content">
            {loadingOrders ? (
              <div className="text-center py-5">
                <div className="spin-loader"></div>
                <p className="mt-2 text-muted">Loading your order history...</p>
              </div>
            ) : userOrders.length === 0 ? (
              <div className="empty-orders-card">
                <FiPackage className="empty-icon" />
                <h3>No Orders Placed Yet</h3>
                <p>Browse our luxury sofas, dining tables, and teak wood collections to place your first order.</p>
                <Link to="/categories" className="btn btn-primary mt-3">Explore Catalog</Link>
              </div>
            ) : (
              <div className="orders-history-list">
                {userOrders.map(order => {
                  const stepIdx = getStepProgressIndex(order.status);
                  return (
                    <div key={order.orderId} className="customer-order-card">
                      
                      {/* Order Top Bar */}
                      <div className="order-top-bar">
                        <div>
                          <span className="order-id-label">ORDER ID: #{order.orderId}</span>
                          <span className="order-date-text">
                            <FiClock /> Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                          </span>
                        </div>

                        <div className="order-top-actions">
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handlePrintInvoice(order)}
                          >
                            <FiPrinter /> Print Receipt
                          </button>
                          <span className="order-total-pill">Total: ₹{(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Live Tracking Progress Bar */}
                      <div className="tracking-progress-container">
                        <div className="progress-header">
                          <span>Fulfilment Status: <strong>{order.status || 'PROCESSING'}</strong></span>
                          <span className="est-date"><FiTruck /> Estimated Delivery by {order.deliveryDate || '4-5 Days'}</span>
                        </div>

                        {order.status === 'CANCELLED' ? (
                          <div className="cancelled-notice">
                            ❌ Order Cancelled
                          </div>
                        ) : (
                          <div className="tracking-steps-grid">
                            {ORDER_STEPS.map((stepName, idx) => (
                              <div key={stepName} className={`tracking-step ${idx <= stepIdx ? 'completed' : ''} ${idx === stepIdx ? 'current' : ''}`}>
                                <div className="step-circle">
                                  {idx < stepIdx ? <FiCheckCircle /> : idx + 1}
                                </div>
                                <span className="step-label">{stepName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Address & Items */}
                      <div className="order-details-bottom">
                        <div className="delivery-address-snippet">
                          <FiMapPin className="pin-icon" />
                          <div>
                            <strong>Delivery Address:</strong>
                            <p>{order.deliveryAddress || 'Standard Home Shipping'}</p>
                          </div>
                        </div>

                        <div className="order-purchased-items">
                          {order.items && order.items.map((item, idx) => (
                            <div key={item.id || item.productId || idx} className="purchased-item-card">
                              <div className="item-thumb-box">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.productName || 'Furniture Item'} className="item-thumb-img" />
                                ) : (
                                  <div className="item-thumb-placeholder"><FiPackage /></div>
                                )}
                              </div>
                              <div className="item-info-box">
                                <span className="item-title">{item.productName || `Product #${item.productId}`}</span>
                                <div className="item-sub-row">
                                  <span className="item-qty">Qty: {item.quantity}</span>
                                  <span className="item-price">₹{(item.totalPrice || ((item.pricePerUnit || 0) * item.quantity) || 0).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROFILE & SETTINGS */}
        {activeTab === 'profile' && (
          <div className="tab-content">
            <div className="customer-grid">
              <div className="customer-card account-details-card">
                <h3>Profile & Personal Info</h3>
                <div className="detail-item">
                  <FiUser className="detail-icon" />
                  <div>
                    <label>Full Name</label>
                    <p>{user.fullName}</p>
                  </div>
                </div>
                <div className="detail-item">
                  <FiMail className="detail-icon" />
                  <div>
                    <label>Email Address</label>
                    <p>{user.email || 'Registered User'}</p>
                  </div>
                </div>
                {user.mobile && (
                  <div className="detail-item">
                    <FiPhone className="detail-icon" />
                    <div>
                      <label>Mobile Number</label>
                      <p>{user.mobile}</p>
                    </div>
                  </div>
                )}
                <div className="detail-item">
                  <FiShield className="detail-icon" />
                  <div>
                    <label>Account Role</label>
                    <p className="role-badge">{user.role || 'CUSTOMER'}</p>
                  </div>
                </div>
              </div>

              <div className="customer-card quick-actions-card">
                <h3>Quick Management Links</h3>
                <div className="actions-list">
                  <Link to="/categories" className="action-btn">
                    <FiPackage className="action-icon" />
                    <span>Browse Furniture Catalog</span>
                  </Link>
                  <Link to="/wishlist" className="action-btn">
                    <FiHeart className="action-icon" />
                    <span>Saved Wishlist Items</span>
                  </Link>
                  <Link to="/cart" className="action-btn">
                    <FiShoppingCart className="action-icon" />
                    <span>My Cart & Checkout</span>
                  </Link>
                  <Link to="/change-password" className="action-btn">
                    <FiKey className="action-icon" />
                    <span>Change Password</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Customer;

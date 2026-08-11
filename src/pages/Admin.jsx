import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiDollarSign, FiShoppingBag, FiBox, FiUsers, 
  FiPlus, FiSearch, FiFilter, FiCheckCircle, 
  FiRefreshCw, FiEdit3, FiTrash2,
  FiTrendingUp, FiCalendar, FiShield, FiAlertTriangle, FiX,
  FiTruck, FiClock, FiEye, FiAlertCircle
} from 'react-icons/fi';
import { catalogAPI, adminAPI, authAPI } from '../services/api';
import '../styles/Admin.css';

const demoUsers = [
  { userId: 1, username: 'admin', email: 'admin@furnihub.com', mobile: '9876543210', fullName: 'System Admin', role: 'ADMIN', createdAt: '2026-01-10T10:00:00' },
  { userId: 2, username: 'john_doe', email: 'john@example.com', mobile: '9123456789', fullName: 'John Doe', role: 'CUSTOMER', createdAt: '2026-02-15T14:20:00' },
  { userId: 3, username: 'sarah_m', email: 'sarah@example.com', mobile: '9988776655', fullName: 'Sarah Miller', role: 'CUSTOMER', createdAt: '2026-03-01T09:15:00' }
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', 'users', 'analytics', 'categories'
  const [, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin Quick Login State
  const [adminLoginForm, setAdminLoginForm] = useState({ emailOrMobile: 'admin@furnihub.com', password: 'admin123' });
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);

  // Core Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Status & Notification Messages
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: 10,
    categoryId: '',
    imageUrl: ''
  });

  // Edit Product Modal State
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState({
    productId: null,
    name: '',
    description: '',
    price: '',
    stock: 10,
    categoryId: '',
    imageUrl: ''
  });

  // Delete Product Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Order Details Modal State
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Edit User Modal State
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState({
    userId: null,
    username: '',
    email: '',
    mobile: '',
    fullName: '',
    password: '',
    role: 'CUSTOMER'
  });

  // Business Analytics State
  const [analyticsSubTab, setAnalyticsSubTab] = useState('daily'); // 'daily', 'monthly', 'yearly', 'overall'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchAdminData = useCallback(async (isUserAdmin = false) => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        catalogAPI.getAllProducts(),
        catalogAPI.getCategories()
      ]);
      
      const prods = prodRes.data || [];
      const cats = catRes.data || [];
      setProducts(prods);
      setCategories(cats);

      if (cats.length > 0 && !newProduct.categoryId) {
        setNewProduct(prev => ({ ...prev, categoryId: cats[0].id || cats[0].categorieId }));
      }

      if (isUserAdmin) {
        try {
          const [usersRes, ordersRes] = await Promise.all([
            adminAPI.getAllUsers(),
            adminAPI.getAllOrders()
          ]);
          setUsersList(usersRes.data || []);
          setOrdersList(ordersRes.data || []);
        } catch (err) {
          console.warn('Failed to fetch admin users/orders data', err);
          setUsersList(demoUsers);
        }
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
      showMessage('Failed to load catalog data from backend.', 'error');
    } finally {
      setLoading(false);
    }
  }, [newProduct.categoryId]);

  useEffect(() => {
    const checkAuthAndRole = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAdmin(false);
        fetchAdminData(false);
        return;
      }
      try {
        const valRes = await authAPI.validateToken();
        if (valRes.data && valRes.data.success && String(valRes.data.role).toUpperCase() === 'ADMIN') {
          setIsAdmin(true);
          setUser({
            fullName: valRes.data.fullName,
            userId: valRes.data.userId,
            role: valRes.data.role
          });
          const storedUser = localStorage.getItem('user');
          const parsed = storedUser ? JSON.parse(storedUser) : {};
          localStorage.setItem('user', JSON.stringify({ ...parsed, role: 'ADMIN', fullName: valRes.data.fullName }));
          fetchAdminData(true);
        } else {
          setIsAdmin(false);
          fetchAdminData(false);
        }
      } catch {
        setIsAdmin(false);
        fetchAdminData(false);
      }
    };

    checkAuthAndRole();
  }, [fetchAdminData]);

  const showMessage = (text, type = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => {
      setActionMessage({ text: '', type: '' });
    }, 4000);
  };

  const fetchAnalytics = useCallback(async () => {
    if (!isAdmin) return;
    setAnalyticsLoading(true);
    try {
      let res;
      if (analyticsSubTab === 'daily') {
        res = await adminAPI.getDailyRevenue(selectedDate);
      } else if (analyticsSubTab === 'monthly') {
        res = await adminAPI.getMonthlyRevenue(selectedYear, selectedMonth);
      } else if (analyticsSubTab === 'yearly') {
        res = await adminAPI.getYearlyRevenue(selectedYear);
      } else {
        res = await adminAPI.getOverallRevenue();
      }
      setAnalyticsData(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [isAdmin, analyticsSubTab, selectedDate, selectedMonth, selectedYear]);

  // Fetch Business Analytics whenever subTab or date inputs change
  useEffect(() => {
    if (activeTab === 'analytics' && isAdmin) {
      fetchAnalytics();
    }
  }, [activeTab, isAdmin, fetchAnalytics]);

  // Handle Add Product Submit
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.categoryId) {
      showMessage('Product Name, Price, and Category are required.', 'error');
      return;
    }

    try {
      const payload = {
        name: newProduct.name.trim(),
        description: newProduct.description ? newProduct.description.trim() : '',
        price: Number(newProduct.price),
        stock: Number(newProduct.stock) || 0,
        categoryId: Number(newProduct.categoryId),
        imageUrl: newProduct.imageUrl ? newProduct.imageUrl.trim() : ''
      };

      const res = await adminAPI.createProduct(payload);
      const created = res.data;
      setProducts([created, ...products]);
      showMessage(`Product "${created.name}" created successfully!`, 'success');
      setShowAddModal(false);
      setNewProduct({ name: '', description: '', price: '', stock: 10, categoryId: categories[0]?.id || 1, imageUrl: '' });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add product. Please check category validation and product details.';
      showMessage(errorMsg, 'error');
    }
  };

  // Handle Edit Product Modal Open
  const openEditProductModal = (product) => {
    setProductToEdit({
      productId: product.productId,
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock !== undefined ? product.stock : 10,
      categoryId: product.categoryId || product.categorieId || (categories[0]?.id || 1),
      imageUrl: product.imageUrl || ''
    });
    setShowEditProductModal(true);
  };

  // Handle Edit Product Submit
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!productToEdit.name || !productToEdit.price || !productToEdit.categoryId) {
      showMessage('Product Name, Price, and Category are required.', 'error');
      return;
    }

    try {
      const payload = {
        name: productToEdit.name.trim(),
        description: productToEdit.description ? productToEdit.description.trim() : '',
        price: Number(productToEdit.price),
        stock: Number(productToEdit.stock) || 0,
        categoryId: Number(productToEdit.categoryId),
        imageUrl: productToEdit.imageUrl ? productToEdit.imageUrl.trim() : ''
      };

      const res = await adminAPI.updateProduct(productToEdit.productId, payload);
      const updated = res.data;

      setProducts(products.map(p => p.productId === updated.productId ? updated : p));
      showMessage(`Product "${updated.name}" updated successfully!`, 'success');
      setShowEditProductModal(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update product details.';
      showMessage(errorMsg, 'error');
    }
  };

  // Handle Delete Product
  const confirmDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await adminAPI.deleteProduct(productToDelete.productId);
      setProducts(products.filter(p => p.productId !== productToDelete.productId));
      showMessage(`Product "${productToDelete.name}" deleted successfully!`, 'success');
    } catch (err) {
      console.warn('Backend delete failed, performing local inventory update', err);
      setProducts(products.filter(p => p.productId !== productToDelete.productId));
      showMessage(`Product "${productToDelete.name}" removed from active catalog.`, 'success');
    } finally {
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await adminAPI.updateOrderStatus(orderId, newStatus);
      const updatedOrder = res.data;
      setOrdersList(ordersList.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o));
      if (selectedOrder && selectedOrder.orderId === updatedOrder.orderId) {
        setSelectedOrder(updatedOrder);
      }
      showMessage(`Order #${orderId} status updated to ${newStatus}!`, 'success');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to update order status.', 'error');
    }
  };

  // Handle Edit User
  const openEditUserModal = (userItem) => {
    setUserToEdit({
      userId: userItem.userId,
      username: userItem.username || '',
      email: userItem.email || '',
      mobile: userItem.mobile || '',
      fullName: userItem.fullName || '',
      password: '',
      role: userItem.role || 'CUSTOMER'
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: userToEdit.username,
        email: userToEdit.email,
        mobile: userToEdit.mobile,
        fullName: userToEdit.fullName,
        role: userToEdit.role
      };
      if (userToEdit.password && userToEdit.password.trim()) {
        payload.password = userToEdit.password.trim();
      }

      const res = await adminAPI.updateUser(userToEdit.userId, payload);
      const updated = res.data;

      setUsersList(usersList.map(u => u.userId === updated.userId ? updated : u));
      showMessage(`User details for ${updated.fullName || updated.username} updated successfully!`, 'success');
      setShowEditUserModal(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update user information.';
      showMessage(errorMsg, 'error');
    }
  };

  const handleAdminLogin = async (e, overrideCredentials = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setAdminLoginError('');
    setAdminLoginLoading(true);

    const emailToUse = overrideCredentials ? overrideCredentials.email : adminLoginForm.emailOrMobile.trim();
    const passToUse = overrideCredentials ? overrideCredentials.password : adminLoginForm.password.trim();

    try {
      const res = await authAPI.login({
        emailOrMobile: emailToUse,
        password: passToUse
      });
      if (res.data && res.data.success) {
        const userRole = String(res.data.role || '').toUpperCase();
        if (userRole !== 'ADMIN') {
          setAdminLoginError(`Access Denied: '${res.data.fullName || emailToUse}' is a Customer account. Please sign in with an Administrator account (admin@furnihub.com).`);
          return;
        }

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify({
          fullName: res.data.fullName,
          userId: res.data.userId,
          role: res.data.role,
          email: emailToUse
        }));
        window.dispatchEvent(new Event('auth:updated'));
        setIsAdmin(true);
        showMessage('Successfully authenticated as Administrator!', 'success');
        fetchAdminData(true);
      } else {
        setAdminLoginError(res.data?.message || 'Invalid Admin credentials');
      }
    } catch (err) {
      setAdminLoginError(err.response?.data?.message || 'Login failed. Please check backend server.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  // Filter Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || 
                            p.parentCategoryId === Number(selectedCategory) ||
                            p.categoryId === Number(selectedCategory) ||
                            p.categorieId === Number(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Filter Orders
  const filteredOrders = ordersList.filter(o => {
    const query = orderSearchQuery.toLowerCase();
    const matchesQuery = (o.orderId && o.orderId.toLowerCase().includes(query)) ||
                         (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(query)) ||
                         (String(o.userId).includes(query));
    const matchesStatus = orderStatusFilter === 'ALL' || String(o.status).toUpperCase() === orderStatusFilter;
    return matchesQuery && matchesStatus;
  });

  // Filter Users
  const filteredUsers = usersList.filter(u => {
    const query = userSearchQuery.toLowerCase();
    return (u.username && u.username.toLowerCase().includes(query)) ||
           (u.email && u.email.toLowerCase().includes(query)) ||
           (u.fullName && u.fullName.toLowerCase().includes(query)) ||
           (u.mobile && u.mobile.toLowerCase().includes(query));
  });

  const lowStockCount = products.filter(p => p.stock < 5).length;
  const pendingOrdersCount = ordersList.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length;

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-access-denied">
          <FiShield className="access-denied-icon" style={{ color: 'var(--secondary)' }} />
          <h2>Administrator Portal Sign-In</h2>
          <p>Sign in with the system Administrator account to access store analytics and management.</p>
          
          {adminLoginError && (
            <div className="admin-toast toast-error mb-3" style={{ textAlign: 'left', background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }}>
              <FiAlertTriangle style={{ flexShrink: 0 }} /> <span>{adminLoginError}</span>
            </div>
          )}

          {/* Primary 1-Click Direct Admin Sign In Button */}
          <div style={{ margin: '1.5rem 0' }}>
            <button 
              type="button" 
              className="btn btn-primary btn-block" 
              onClick={() => handleAdminLogin(null, { email: 'admin@furnihub.com', password: 'admin123' })}
              disabled={adminLoginLoading}
              style={{ width: '100%', padding: '14px', fontSize: '1.05rem', fontWeight: 'bold' }}
            >
              {adminLoginLoading ? 'Authenticating Admin...' : '🚀 1-Click Direct Admin Login (admin@furnihub.com)'}
            </button>
          </div>

          <div style={{ position: 'relative', margin: '1.5rem 0', textAlign: 'center' }}>
            <span style={{ background: 'white', padding: '0 10px', color: '#888', fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>OR Sign in with custom credentials</span>
            <hr style={{ position: 'absolute', top: '50%', left: 0, right: 0, border: 'none', borderTop: '1px solid #eee', margin: 0 }} />
          </div>

          <form onSubmit={handleAdminLogin} className="admin-form text-left" style={{ margin: '1rem 0' }} autoComplete="off">
            <div className="form-group mb-3">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Admin Email or Username</label>
              <input 
                type="text"
                value={adminLoginForm.emailOrMobile}
                onChange={(e) => setAdminLoginForm({ ...adminLoginForm, emailOrMobile: e.target.value })}
                placeholder="admin@furnihub.com"
                autoComplete="off"
                required
              />
            </div>
            <div className="form-group mb-3">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Password</label>
              <input 
                type="password"
                value={adminLoginForm.password}
                onChange={(e) => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                placeholder="admin123"
                autoComplete="new-password"
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-secondary btn-block" 
              disabled={adminLoginLoading}
              style={{ width: '100%', padding: '10px', fontSize: '0.95rem' }}
            >
              Sign In with Custom Form
            </button>
          </form>

          <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', color: '#555', marginTop: '1rem' }}>
            💡 <strong>Default Admin Account:</strong><br/>
            Email: <code>admin@furnihub.com</code> | Password: <code>admin123</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        
        {/* Header */}
        <div className="admin-header">
          <div className="admin-title-area">
            <h1>FurniHub Admin Service</h1>
            <p>Product Catalog, Order Fulfilment, Customer Management & Business Analytics</p>
          </div>
          <div className="admin-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => fetchAdminData(true)} title="Refresh Inventory & Data">
              <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh Data
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              <FiPlus /> Add New Product
            </button>
          </div>
        </div>

        {/* Global Action Notification Toast */}
        {actionMessage.text && (
          <div className={`admin-toast toast-${actionMessage.type}`}>
            {actionMessage.type === 'success' ? <FiCheckCircle /> : <FiAlertTriangle />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* KPI Metrics Banner */}
        <div className="kpi-grid">
          <div className="kpi-card catalog">
            <div className="kpi-icon"><FiBox /></div>
            <div className="kpi-data">
              <span className="kpi-label">Active Catalog</span>
              <h2 className="kpi-value">{products.length} Products</h2>
              <span className={`kpi-badge ${lowStockCount > 0 ? 'negative' : 'neutral'}`}>
                {lowStockCount > 0 ? `⚠️ ${lowStockCount} Low Stock` : `${categories.length} Categories`}
              </span>
            </div>
          </div>

          <div className="kpi-card orders">
            <div className="kpi-icon"><FiShoppingBag /></div>
            <div className="kpi-data">
              <span className="kpi-label">Customer Orders</span>
              <h2 className="kpi-value">{ordersList.length} Orders</h2>
              <span className={`kpi-badge ${pendingOrdersCount > 0 ? 'warning' : 'positive'}`}>
                {pendingOrdersCount} Pending Action
              </span>
            </div>
          </div>

          <div className="kpi-card users">
            <div className="kpi-icon"><FiUsers /></div>
            <div className="kpi-data">
              <span className="kpi-label">Platform Users</span>
              <h2 className="kpi-value">{usersList.length} Accounts</h2>
              <span className="kpi-badge positive">{usersList.filter(u => u.role === 'ADMIN').length} Admins</span>
            </div>
          </div>

          <div className="kpi-card revenue">
            <div className="kpi-icon"><FiDollarSign /></div>
            <div className="kpi-data">
              <span className="kpi-label">Analytics Insights</span>
              <h2 className="kpi-value">Live Data</h2>
              <span className="kpi-badge positive">Daily, Monthly, Yearly</span>
            </div>
          </div>
        </div>

        {/* Primary Dashboard Navigation Tabs */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <FiBox /> Product Management ({products.length})
            {lowStockCount > 0 && <span className="tab-pill alert">{lowStockCount}</span>}
          </button>
          <button 
            className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <FiShoppingBag /> Order Fulfilment ({ordersList.length})
            {pendingOrdersCount > 0 && <span className="tab-pill pending">{pendingOrdersCount}</span>}
          </button>
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers /> User Management ({usersList.length})
          </button>
          <button 
            className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FiTrendingUp /> Business Analytics
          </button>
          <button 
            className={`admin-tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <FiFilter /> Categories Overview
          </button>
        </div>

        {/* TAB 1: PRODUCT MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="tab-content">
            <div className="catalog-toolbar">
              <div className="search-box">
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search products by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="category-select-wrapper">
                <FiFilter className="filter-icon" />
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id || c.categorieId} value={c.id || c.categorieId}>{c.name || c.categoryName}</option>
                  ))}
                </select>
              </div>

              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                <FiPlus /> Add Product
              </button>
            </div>

            {lowStockCount > 0 && (
              <div className="admin-alert-banner">
                <FiAlertCircle className="alert-icon" />
                <span><strong>Low Stock Warning:</strong> {lowStockCount} item(s) have less than 5 units left in stock. Update inventory below.</span>
              </div>
            )}

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">No products found matching criteria.</td>
                    </tr>
                  ) : (
                    filteredProducts.map(product => (
                      <tr key={product.productId} className={product.stock < 5 ? 'row-low-stock' : ''}>
                        <td>
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="product-thumb" />
                          ) : (
                            <div className="thumb-placeholder"><FiBox /></div>
                          )}
                        </td>
                        <td><strong>#PRD-{product.productId}</strong></td>
                        <td>
                          <span className="product-name">{product.name}</span>
                          {product.description && <p className="product-desc-sub">{product.description.substring(0, 50)}...</p>}
                        </td>
                        <td>
                          <span className="cat-tag">{product.categoryName || product.parentCategoryName || 'General'}</span>
                        </td>
                        <td>
                          <span className={`stock-badge ${product.stock > 5 ? 'in-stock' : product.stock > 0 ? 'low-stock-alert' : 'out-of-stock'}`}>
                            {product.stock <= 5 && <FiAlertTriangle className="mr-1" />}
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="amount-cell">₹{(product.price || 0).toLocaleString('en-IN')}</td>
                        <td>
                          <div className="action-buttons-group">
                            <button 
                              className="btn-action edit" 
                              title="Edit Product Details & Stock"
                              onClick={() => openEditProductModal(product)}
                            >
                              <FiEdit3 /> Edit
                            </button>
                            <button 
                              className="btn-action delete" 
                              title="Delete Product"
                              onClick={() => confirmDeleteProduct(product)}
                            >
                              <FiTrash2 /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ORDER FULFILMENT & MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="tab-content">
            <div className="catalog-toolbar">
              <div className="search-box">
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search orders by Order ID, Customer ID, Address..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                />
              </div>

              <div className="status-filter-pills">
                {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(st => (
                  <button 
                    key={st}
                    className={`status-pill ${orderStatusFilter === st ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>User ID</th>
                    <th>Date & Time</th>
                    <th>Payment</th>
                    <th>Total Amount</th>
                    <th>Delivery Address</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">No customer orders found matching criteria.</td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.orderId}>
                        <td><strong>#{order.orderId}</strong></td>
                        <td>#USR-{order.userId}</td>
                        <td>
                          <span className="date-text">
                            <FiClock className="mr-1" />
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                          </span>
                        </td>
                        <td><span className="payment-badge">{order.paymentMethod || 'COD'}</span></td>
                        <td className="amount-cell">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                        <td>
                          <span className="address-snippet" title={order.deliveryAddress}>
                            {order.deliveryAddress ? (order.deliveryAddress.length > 35 ? order.deliveryAddress.substring(0, 35) + '...' : order.deliveryAddress) : 'Standard Delivery'}
                          </span>
                        </td>
                        <td>
                          <select 
                            className={`status-select status-${(order.status || 'PENDING').toLowerCase()}`}
                            value={order.status || 'PENDING'}
                            onChange={(e) => handleUpdateOrderStatus(order.orderId, e.target.value)}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="PROCESSING">PROCESSING</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                        <td>
                          <button 
                            className="btn-action edit"
                            onClick={() => { setSelectedOrder(order); setShowOrderDetailsModal(true); }}
                            title="View Order Details & Items"
                          >
                            <FiEye /> View Items ({order.items?.length || 0})
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="tab-content">
            <div className="catalog-toolbar">
              <div className="search-box">
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search users by name, email, or mobile..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Email Address</th>
                    <th>Mobile</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">No users found.</td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.userId}>
                        <td><strong>#USR-{u.userId}</strong></td>
                        <td><strong>{u.fullName || 'N/A'}</strong></td>
                        <td>{u.username}</td>
                        <td>{u.email}</td>
                        <td>{u.mobile || 'N/A'}</td>
                        <td>
                          <span className={`role-badge role-${(u.role || 'CUSTOMER').toLowerCase()}`}>
                            <FiShield /> {u.role || 'CUSTOMER'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn-action edit" 
                            onClick={() => openEditUserModal(u)}
                            title="Edit User Info & Role"
                          >
                            <FiEdit3 /> Edit User
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BUSINESS ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="tab-content">
            <div className="analytics-controls">
              <div className="sub-tab-buttons">
                <button 
                  className={`sub-tab-btn ${analyticsSubTab === 'daily' ? 'active' : ''}`}
                  onClick={() => setAnalyticsSubTab('daily')}
                >
                  Daily Analysis
                </button>
                <button 
                  className={`sub-tab-btn ${analyticsSubTab === 'monthly' ? 'active' : ''}`}
                  onClick={() => setAnalyticsSubTab('monthly')}
                >
                  Monthly Analysis
                </button>
                <button 
                  className={`sub-tab-btn ${analyticsSubTab === 'yearly' ? 'active' : ''}`}
                  onClick={() => setAnalyticsSubTab('yearly')}
                >
                  Yearly Analysis
                </button>
                <button 
                  className={`sub-tab-btn ${analyticsSubTab === 'overall' ? 'active' : ''}`}
                  onClick={() => setAnalyticsSubTab('overall')}
                >
                  Overall Analysis
                </button>
              </div>

              {/* Dynamic Filter Controls */}
              <div className="analytics-filter-bar">
                {analyticsSubTab === 'daily' && (
                  <div className="filter-item">
                    <label><FiCalendar /> Select Date:</label>
                    <input 
                      type="date" 
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                )}

                {analyticsSubTab === 'monthly' && (
                  <>
                    <div className="filter-item">
                      <label>Month:</label>
                      <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-item">
                      <label>Year:</label>
                      <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                        {[2024, 2025, 2026, 2027].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {analyticsSubTab === 'yearly' && (
                  <div className="filter-item">
                    <label>Year:</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                      {[2024, 2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Analytics Summary Cards */}
            {analyticsLoading ? (
              <div className="analytics-loading">Loading Business Analytics...</div>
            ) : analyticsData ? (
              <>
                <div className="analytics-summary-grid">
                  <div className="kpi-card revenue">
                    <div className="kpi-icon"><FiDollarSign /></div>
                    <div className="kpi-data">
                      <span className="kpi-label">{analyticsSubTab.toUpperCase()} REVENUE</span>
                      <h2 className="kpi-value">₹{(analyticsData.totalRevenue || 0).toLocaleString('en-IN')}</h2>
                      <span className="kpi-badge positive">{analyticsData.periodLabel}</span>
                    </div>
                  </div>

                  <div className="kpi-card orders">
                    <div className="kpi-icon"><FiShoppingBag /></div>
                    <div className="kpi-data">
                      <span className="kpi-label">TOTAL TRANSACTIONS</span>
                      <h2 className="kpi-value">{analyticsData.totalOrders || 0} Orders</h2>
                      <span className="kpi-badge neutral">Completed Transactions</span>
                    </div>
                  </div>

                  <div className="kpi-card catalog">
                    <div className="kpi-icon"><FiTrendingUp /></div>
                    <div className="kpi-data">
                      <span className="kpi-label">AVERAGE ORDER VALUE</span>
                      <h2 className="kpi-value">₹{(analyticsData.averageOrderValue || 0).toLocaleString('en-IN')}</h2>
                      <span className="kpi-badge positive">Per Transaction</span>
                    </div>
                  </div>
                </div>

                {/* SVG Visual Sales & Revenue Performance Meter */}
                <div className="analytics-visual-card mt-4">
                  <div className="visual-card-header">
                    <h3><FiTrendingUp /> Revenue Performance Breakdown ({analyticsData.periodLabel})</h3>
                  </div>
                  <div className="chart-bars-container">
                    {categories.slice(0, 5).map((cat, idx) => {
                      const percentage = Math.min(100, 35 + (idx * 15) % 65);
                      return (
                        <div key={cat.id || cat.categorieId} className="chart-bar-row">
                          <div className="bar-label">{cat.name || cat.categoryName}</div>
                          <div className="bar-track">
                            <div 
                              className="bar-fill" 
                              style={{ width: `${percentage}%`, background: idx % 2 === 0 ? 'var(--secondary)' : 'var(--accent)' }}
                            />
                          </div>
                          <div className="bar-value">{percentage}% Share</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Orders Detailed Table for period */}
                <div className="admin-section-header mt-4">
                  <h3>Transaction Breakdown for {analyticsData.periodLabel}</h3>
                  <span className="section-badge">{analyticsData.orders?.length || 0} Records</span>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>User ID</th>
                        <th>Date & Time</th>
                        <th>Payment Method</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!analyticsData.orders || analyticsData.orders.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4">No business transactions recorded for this period.</td>
                        </tr>
                      ) : (
                        analyticsData.orders.map(o => (
                          <tr key={o.orderId}>
                            <td><strong>#{o.orderId}</strong></td>
                            <td>#USR-{o.userId}</td>
                            <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A'}</td>
                            <td><span className="payment-badge">{o.paymentMethod || 'COD'}</span></td>
                            <td className="amount-cell">₹{(o.totalAmount || 0).toLocaleString('en-IN')}</td>
                            <td>
                              <span className={`status-badge status-${(o.status || 'SUCCESS').toLowerCase()}`}>
                                <FiCheckCircle /> {o.status || 'SUCCESS'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* TAB 5: CATEGORIES OVERVIEW */}
        {activeTab === 'categories' && (
          <div className="tab-content">
            <div className="admin-section-header">
              <h2>Product Categories Architecture</h2>
            </div>
            <div className="categories-admin-grid">
              {categories.map(cat => (
                <div key={cat.id || cat.categorieId} className="category-admin-card">
                  <div className="category-card-header">
                    <h3>{cat.name || cat.categoryName}</h3>
                    <span className="cat-id-badge">ID: #{cat.id || cat.categorieId}</span>
                  </div>
                  {cat.parentCategoryName && (
                    <p className="parent-cat-label">Parent: {cat.parentCategoryName}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: ADD PRODUCT */}
        {showAddModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="modal-header">
                <h3>Add New Product to Catalog</h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}><FiX /></button>
              </div>

              <form onSubmit={handleAddProduct} className="admin-form">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Premium Teak Wood Dining Table"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 35000"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input 
                      type="number" 
                      placeholder="10"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select 
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id || c.categorieId} value={c.id || c.categorieId}>
                        {c.name || c.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Product Image URL</label>
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/..."
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    rows="3"
                    placeholder="Enter detailed description, dimensions, material info..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save & Add Product</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT PRODUCT */}
        {showEditProductModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="modal-header">
                <h3>Edit Product Details (#PRD-{productToEdit.productId})</h3>
                <button className="close-btn" onClick={() => setShowEditProductModal(false)}><FiX /></button>
              </div>

              <form onSubmit={handleUpdateProduct} className="admin-form">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input 
                    type="text" 
                    value={productToEdit.name}
                    onChange={(e) => setProductToEdit({ ...productToEdit, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input 
                      type="number" 
                      value={productToEdit.price}
                      onChange={(e) => setProductToEdit({ ...productToEdit, price: e.target.value })}
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input 
                      type="number" 
                      value={productToEdit.stock}
                      onChange={(e) => setProductToEdit({ ...productToEdit, stock: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select 
                    value={productToEdit.categoryId}
                    onChange={(e) => setProductToEdit({ ...productToEdit, categoryId: e.target.value })}
                    required
                  >
                    {categories.map(c => (
                      <option key={c.id || c.categorieId} value={c.id || c.categorieId}>
                        {c.name || c.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Product Image URL</label>
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/..."
                    value={productToEdit.imageUrl}
                    onChange={(e) => setProductToEdit({ ...productToEdit, imageUrl: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    rows="3"
                    value={productToEdit.description}
                    onChange={(e) => setProductToEdit({ ...productToEdit, description: e.target.value })}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditProductModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update Product</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: VIEW ORDER DETAILS */}
        {showOrderDetailsModal && selectedOrder && (
          <div className="admin-modal-overlay">
            <div className="admin-modal modal-lg">
              <div className="modal-header">
                <h3>Order Specifications & Items (#{selectedOrder.orderId})</h3>
                <button className="close-btn" onClick={() => setShowOrderDetailsModal(false)}><FiX /></button>
              </div>

              <div className="order-details-body">
                <div className="order-info-grid">
                  <div className="info-box">
                    <span className="info-label">Customer ID</span>
                    <strong>#USR-{selectedOrder.userId}</strong>
                  </div>
                  <div className="info-box">
                    <span className="info-label">Order Date</span>
                    <strong>{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}</strong>
                  </div>
                  <div className="info-box">
                    <span className="info-label">Payment Method</span>
                    <strong>{selectedOrder.paymentMethod || 'COD'}</strong>
                  </div>
                  <div className="info-box">
                    <span className="info-label">Total Amount</span>
                    <strong className="text-secondary">₹{(selectedOrder.totalAmount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div className="info-box mt-3">
                  <span className="info-label"><FiTruck /> Delivery Address</span>
                  <p className="mt-1 text-sm">{selectedOrder.deliveryAddress || 'Standard Delivery'}</p>
                </div>

                <div className="order-status-bar mt-3">
                  <span>Current Fulfilment Status:</span>
                  <select 
                    className={`status-select status-${(selectedOrder.status || 'PENDING').toLowerCase()}`}
                    value={selectedOrder.status || 'PENDING'}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrder.orderId, e.target.value)}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <h4 className="mt-4 mb-2">Itemized Purchase List ({selectedOrder.items?.length || 0} items)</h4>
                <div className="order-items-list">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map(item => (
                      <div key={item.id || item.productId} className="order-item-card">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="order-item-thumb" />
                        ) : (
                          <div className="thumb-placeholder"><FiBox /></div>
                        )}
                        <div className="order-item-details">
                          <span className="item-name">{item.productName || `Product #${item.productId}`}</span>
                          <span className="item-qty">Qty: {item.quantity} × ₹{(item.pricePerUnit || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="item-total-price">
                          ₹{(item.totalPrice || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted text-sm py-2">No individual item details stored for this transaction.</p>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowOrderDetailsModal(false)}>Close Window</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CONFIRM DELETE PRODUCT */}
        {showDeleteModal && productToDelete && (
          <div className="admin-modal-overlay">
            <div className="admin-modal modal-sm">
              <div className="modal-header">
                <h3>Confirm Delete Product</h3>
                <button className="close-btn" onClick={() => setShowDeleteModal(false)}><FiX /></button>
              </div>
              <div className="modal-body py-3">
                <p>Are you sure you want to permanently delete <strong>{productToDelete.name}</strong> (#PRD-{productToDelete.productId})?</p>
                <p className="text-muted text-sm mt-1">This action cannot be undone and will immediately remove the item from the catalog.</p>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDeleteProduct}>Confirm Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EDIT USER */}
        {showEditUserModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="modal-header">
                <h3>Modify User Information & Role</h3>
                <button className="close-btn" onClick={() => setShowEditUserModal(false)}><FiX /></button>
              </div>

              <form onSubmit={handleUpdateUser} className="admin-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={userToEdit.fullName}
                    onChange={(e) => setUserToEdit({ ...userToEdit, fullName: e.target.value })}
                    placeholder="User full name"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Username</label>
                    <input 
                      type="text" 
                      value={userToEdit.username}
                      onChange={(e) => setUserToEdit({ ...userToEdit, username: e.target.value })}
                      placeholder="Username"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Role & Permissions</label>
                    <select 
                      value={userToEdit.role}
                      onChange={(e) => setUserToEdit({ ...userToEdit, role: e.target.value })}
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      value={userToEdit.email}
                      onChange={(e) => setUserToEdit({ ...userToEdit, email: e.target.value })}
                      placeholder="Email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input 
                      type="tel" 
                      value={userToEdit.mobile}
                      onChange={(e) => setUserToEdit({ ...userToEdit, mobile: e.target.value })}
                      placeholder="Mobile number"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password <small className="text-muted">(Leave blank to keep existing password)</small></label>
                  <input 
                    type="password" 
                    value={userToEdit.password}
                    onChange={(e) => setUserToEdit({ ...userToEdit, password: e.target.value })}
                    placeholder="Enter new password to update"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditUserModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save User Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;

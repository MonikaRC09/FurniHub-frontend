import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('furnihub_cart');
      localStorage.removeItem('furnihub_wishlist');
      localStorage.removeItem('furnihub_user_orders');
      window.dispatchEvent(new Event('auth:updated'));
      window.dispatchEvent(new Event('cart:updated'));
      window.dispatchEvent(new Event('wishlist:updated'));
      if (window.location.pathname !== '/admin') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
  validateToken: () => api.get('/auth/validate'),
};

export const catalogAPI = {
  getAllProducts: () => api.get('/products'),
  getProductById: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/categories'),
  getProductsByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),
  createProduct: (data) => api.post('/products', data),
};

export const productAPI = catalogAPI;

export const paymentAPI = {
  createOrder: (data) => api.post('/payment/create-order', data),
  verifyPayment: (data) => api.post('/payment/verify-payment', data),
  getKey: () => api.get('/payment/key'),
};

export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart/add', data),
  updateQuantity: (id, quantity) => api.put(`/cart/update/${id}?quantity=${quantity}`),
  removeFromCart: (id) => api.delete(`/cart/remove/${id}`),
  clearCart: () => api.delete('/cart/clear'),
};

export const orderAPI = {
  createOrder: (data) => api.post('/orders', data),
  getUserOrders: () => api.get('/orders'),
};

export const adminAPI = {
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  getAllOrders: () => api.get('/admin/orders'),
  updateOrderStatus: (orderId, status) => api.put(`/admin/orders/${orderId}/status`, { status }),
  getAllUsers: () => api.get('/admin/users'),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getDailyRevenue: (date) => api.get(`/admin/analytics/daily${date ? `?date=${date}` : ''}`),
  getMonthlyRevenue: (year, month) => api.get(`/admin/analytics/monthly?year=${year}&month=${month}`),
  getYearlyRevenue: (year) => api.get(`/admin/analytics/yearly?year=${year}`),
  getOverallRevenue: () => api.get('/admin/analytics/overall'),
};

export default api;


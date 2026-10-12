import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('brocode_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for uniform error formatting
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    const errors = error.response?.data?.errors;
    return Promise.reject({ message, errors, status: error.response?.status });
  }
);

// API Service functions
export const apiService = {
  // Health
  getHealth: () => api.get('/health'),

  // Store Settings
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),

  // Products
  getProducts: (params) => api.get('/products', { params }),
  getFeaturedProducts: (params) => api.get('/products/featured', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  uploadProductImage: (fileOrFormData, onUploadProgress) => {
    let formData = fileOrFormData;
    if (fileOrFormData instanceof File || fileOrFormData instanceof Blob) {
      formData = new FormData();
      formData.append('image', fileOrFormData);
    }
    return api.post('/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.patch(`/products/${id}`, data),
  updateStock: (id, data) => api.patch(`/products/${id}/stock`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getInventoryStats: () => api.get('/products/admin/stats'),

  // Orders
  createOrder: (data) => api.post('/orders', data),
  trackOrder: (query) => api.get('/orders/track', { params: { query } }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  getAllOrders: (params) => api.get('/orders/admin/all', { params }),
  updateOrderStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  getDashboardAnalytics: () => api.get('/orders/admin/analytics'),

  // Auth
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  checkAdminExists: () => api.get('/auth/status'),
  bootstrapAdmin: (data) => api.post('/auth/setup', data),
};

export default api;

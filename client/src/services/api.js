import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const cleanBaseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
export const apiBaseUrl = cleanBaseUrl.endsWith('/api/v1')
  ? cleanBaseUrl
  : `${cleanBaseUrl}/api/v1`;

export const UPLOAD_TIMEOUT_MS =
  parseInt(import.meta.env.VITE_UPLOAD_TIMEOUT_MS, 10) || 90000; // 90 seconds for file transfers

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
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
    const isTimeout =
      error.code === 'ECONNABORTED' ||
      (typeof error.message === 'string' && error.message.toLowerCase().includes('timeout'));
    const isNetworkError = !error.response && Boolean(error.request);

    let message;
    if (isTimeout) {
      message = 'Upload timed out. The network or server took too long. Please click Retry or try a smaller image.';
    } else if (isNetworkError) {
      message = 'Network disconnected. Please check your internet connection and try again.';
    } else {
      message =
        error.response?.data?.message ||
        error.message ||
        'An unexpected network error occurred';
    }

    const errors = error.response?.data?.errors;
    return Promise.reject({
      message,
      errors,
      status: error.response?.status || (isTimeout ? 408 : 0),
      isTimeout,
      isNetworkError,
    });
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
  uploadProductImage: (fileOrFormData, onUploadProgress, options = {}) => {
    let formData = fileOrFormData;
    if (fileOrFormData instanceof File || fileOrFormData instanceof Blob) {
      formData = new FormData();
      formData.append('image', fileOrFormData);
    }
    const timeout = options.timeout || UPLOAD_TIMEOUT_MS;
    return api.post('/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout,
      onUploadProgress,
      ...options,
    });
  },
  uploadProductImages: (filesOrFormData, onUploadProgress, options = {}) => {
    let formData = filesOrFormData;
    if (Array.isArray(filesOrFormData) || filesOrFormData instanceof FileList) {
      formData = new FormData();
      Array.from(filesOrFormData).forEach((file) => {
        formData.append('images', file);
      });
    } else if (filesOrFormData instanceof File || filesOrFormData instanceof Blob) {
      formData = new FormData();
      formData.append('images', filesOrFormData);
    }
    const timeout = options.timeout || UPLOAD_TIMEOUT_MS;
    return api.post('/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout,
      onUploadProgress,
      ...options,
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
  updatePaymentStatus: (id, data) => api.patch(`/orders/${id}/payment-status`, data),
  getDashboardAnalytics: () => api.get('/orders/admin/analytics'),

  // Auth
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  checkAdminExists: () => api.get('/auth/status'),
};

export default api;

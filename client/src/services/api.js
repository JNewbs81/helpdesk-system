// client/src/services/api.js - API Service Layer
import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.azurewebsites.net/api'
  : '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens (when implemented)
api.interceptors.request.use(
  (config) => {
    // Add auth token when authentication is implemented
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Ticket API methods
export const ticketAPI = {
  // Get all tickets with filtering
  getTickets: (params = {}) => {
    return api.get('/tickets', { params });
  },

  // Get specific ticket by ID
  getTicket: (id) => {
    return api.get(`/tickets/${id}`);
  },

  // Create new ticket
  createTicket: (ticketData) => {
    return api.post('/tickets', ticketData);
  },

  // Update ticket
  updateTicket: (id, updateData) => {
    return api.put(`/tickets/${id}`, updateData);
  },

  // Add comment to ticket
  addComment: (ticketId, commentData) => {
    return api.post(`/tickets/${ticketId}/comments`, commentData);
  },
};

// Customer API methods
export const customerAPI = {
  // Get all customers
  getCustomers: (params = {}) => {
    return api.get('/customers', { params });
  },

  // Get specific customer
  getCustomer: (id) => {
    return api.get(`/customers/${id}`);
  },

  // Create new customer
  createCustomer: (customerData) => {
    return api.post('/customers', customerData);
  },

  // Update customer
  updateCustomer: (id, updateData) => {
    return api.put(`/customers/${id}`, updateData);
  },

  // Delete customer
  deleteCustomer: (id) => {
    return api.delete(`/customers/${id}`);
  },

  // Get customer ticket statistics
  getCustomerStats: (id) => {
    return api.get(`/customers/${id}/tickets/stats`);
  },
};

// Technician API methods
export const technicianAPI = {
  // Get all technicians
  getTechnicians: (params = {}) => {
    return api.get('/technicians', { params });
  },

  // Get specific technician
  getTechnician: (id) => {
    return api.get(`/technicians/${id}`);
  },

  // Create new technician
  createTechnician: (technicianData) => {
    return api.post('/technicians', technicianData);
  },

  // Update technician
  updateTechnician: (id, updateData) => {
    return api.put(`/technicians/${id}`, updateData);
  },

  // Deactivate technician
  deactivateTechnician: (id) => {
    return api.delete(`/technicians/${id}`);
  },

  // Get technician workload
  getTechnicianWorkload: (id) => {
    return api.get(`/technicians/${id}/workload`);
  },

  // Get workload summary for all technicians
  getWorkloadSummary: () => {
    return api.get('/technicians/workload/summary');
  },
};

// Category API methods
export const categoryAPI = {
  // Get all categories
  getCategories: (params = {}) => {
    return api.get('/categories', { params });
  },

  // Get specific category
  getCategory: (id) => {
    return api.get(`/categories/${id}`);
  },

  // Create new category
  createCategory: (categoryData) => {
    return api.post('/categories', categoryData);
  },

  // Update category
  updateCategory: (id, updateData) => {
    return api.put(`/categories/${id}`, updateData);
  },

  // Delete category
  deleteCategory: (id) => {
    return api.delete(`/categories/${id}`);
  },

  // Get category statistics overview
  getCategoryStats: () => {
    return api.get('/categories/stats/overview');
  },
};

// Utility functions
export const formatError = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getPriorityColor = (priority) => {
  const colors = {
    'Critical': 'text-red-600 bg-red-50',
    'High': 'text-orange-600 bg-orange-50',
    'Medium': 'text-yellow-600 bg-yellow-50',
    'Low': 'text-green-600 bg-green-50',
  };
  return colors[priority] || 'text-gray-600 bg-gray-50';
};

export const getStatusColor = (status) => {
  const colors = {
    'New': 'text-blue-600 bg-blue-50',
    'In Progress': 'text-purple-600 bg-purple-50',
    'Waiting for Customer': 'text-yellow-600 bg-yellow-50',
    'Resolved': 'text-green-600 bg-green-50',
    'Closed': 'text-gray-600 bg-gray-50',
  };
  return colors[status] || 'text-gray-600 bg-gray-50';
};

export default api;
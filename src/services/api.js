import axios from 'axios';

const API_BASE_URL = '/api/api.php';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const apiService = {
  // Productos
  getProducts: async () => {
    try {
      const response = await api.get('', { params: { action: 'get_products' } });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  searchProducts: async (query) => {
    try {
      const response = await api.get('', { 
        params: { 
          action: 'search_products',
          q: query 
        } 
      });
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  // Autenticación
  register: async (userData) => {
    try {
      const response = await api.post('', userData, {
        params: { action: 'register' }
      });
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post('', { email, password }, {
        params: { action: 'login' }
      });
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Carrito (si se necesita persistencia en backend)
  saveCart: async (cartItems) => {
    try {
      const response = await api.post('', { items: cartItems }, {
        params: { action: 'save_cart' }
      });
      return response.data;
    } catch (error) {
      console.error('Error saving cart:', error);
      throw error;
    }
  },

  // Órdenes
  createOrder: async (orderData) => {
    try {
      const response = await api.post('', orderData, {
        params: { action: 'create_order' }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
};

export default api;

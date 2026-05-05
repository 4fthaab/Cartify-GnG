import api from './api';

export const adminService = {
  //  AUTH 
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/admin/login', { email, password });
      return response.data;
    } catch (error: any) {
      return error.response?.data || { status: 'error', message: 'Network error' };
    }
  },

  //  DASHBOARD 
  getDashboardSummary: async () => (await api.get('/admin/dashboard/summary')).data,

  //  ITEMS & DATABASE 
  getItems: async () => (await api.get('/admin/items')).data,
  createItem: async (data: any) => (await api.post('/admin/items/create', data)).data,
  updateItem: async (id: string, data: any) => (await api.put(`/admin/items/update/${id}`, data)).data,
  deleteItem: async (id: string) => (await api.delete(`/admin/items/delete/${id}`)).data,

  getOffers: async () => (await api.get('/admin/offers/all')).data,
  createOffer: async (data: any) => (await api.post('/admin/offers/create', data)).data,
  updateOffer: async (id: string, data: any) => (await api.put(`/admin/offers/update/${id}`, data)).data,
  toggleOffer: async (id: string) => (await api.patch(`/admin/offers/toggle/${id}`)).data,
  deleteOffer: async (id: string) => (await api.delete(`/admin/offers/delete/${id}`)).data,

  //  REVIEWS & RATINGS 
  getStoreRatings: async () => (await api.get('/admin/ratings/store')).data, // Hits get_store_ratings[cite: 11, 16]

  //  COMPLAINTS & ISSUES 
  getIssues: async () => (await api.get('/admin/issues')).data, // Hits get_all_issues[cite: 6, 15]
  getIssueDetails: async (id: string) => (await api.get(`/admin/issues/${id}`)).data,
  updateIssue: async (id: string, payload: any) => (await api.put(`/admin/issues/${id}`, payload)).data, // Hits update_issue[cite: 6, 15]

  //  MAP & LAYOUT 
  getLayout: async () => (await api.get('/admin/layout')).data,
  saveLayout: async (layoutData: any) => (await api.post('/admin/layout/save', layoutData)).data,
  
  //  ORDERS 
  getOrders: async () => (await api.get('/admin/orders')).data,
};
import api from './axios';

export const getAdminStats = () => api.get('/admin/stats');
export const getAdminOrders = () => api.get('/orders');
export const getAdminDrivers = () => api.get('/admin/drivers');
export const getAdminSlots = () => api.get('/admin/slots');
export const updateSlot = (id, data) => api.patch(`/admin/slots/${id}`, data);
export const updateOrderStatus = (id, data) => api.patch(`/orders/${id}/status`, data);
export const getDriverOrders = () => api.get('/orders/driver/mine');
export const createDriver = (data) => api.post('/admin/drivers', data);
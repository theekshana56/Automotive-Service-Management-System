import api from './api'; // your Axios instance

export const fetchNotifications = async (params = {}) => {
  const { data } = await api.get('/api/notifications', { params });
  return data.items || [];
};

export const markNotificationRead = async (id) => {
  const { data } = await api.patch(`/api/notifications/${id}/read`);
  return data;
};

export const markAllRead = async () => {
  const { data } = await api.post('/api/notifications/read-all');
  return data;
};

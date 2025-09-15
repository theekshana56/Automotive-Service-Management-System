import api from './api';

export const fetchAuditLogs = async (params = {}) => {
  const { data } = await api.get('/api/audit', { params });
  return data;
};

export const fetchAuditLogById = async (id) => {
  const { data } = await api.get(`/api/audit/${id}`);
  return data;
};

export const fetchAuditSummary = async (params = {}) => {
  const { data } = await api.get('/api/audit/summary/stats', { params });
  return data;
};

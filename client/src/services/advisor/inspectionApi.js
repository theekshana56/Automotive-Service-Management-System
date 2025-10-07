import { apiClient } from '../inventoty/api.js';

export const inspectionApi = {
  // Get pending jobs for advisor
  getPendingJobs: async () => {
    const response = await apiClient.get('/api/advisor/pending-jobs');
    return response.data;
  },

  // Create new inspection
  createInspection: async (inspectionData) => {
    const response = await apiClient.post('/api/advisor/inspections', inspectionData);
    return response.data;
  },

  // Update inspection
  updateInspection: async (id, updateData) => {
    const response = await apiClient.put(`/api/advisor/inspections/${id}`, updateData);
    return response.data;
  },

  // Complete inspection
  completeInspection: async (id, completionData) => {
    const response = await apiClient.patch(`/api/advisor/inspections/${id}/complete`, completionData);
    return response.data;
  },

  // Get inspection by ID
  getInspection: async (id) => {
    const response = await apiClient.get(`/api/advisor/inspections/${id}`);
    return response.data;
  },

  // Get advisor inspections
  getAdvisorInspections: async (params = {}) => {
    const response = await apiClient.get('/api/advisor/inspections', { params });
    return response.data;
  }
};

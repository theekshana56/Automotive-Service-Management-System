import { apiClient } from '../inventoty/api.js';

export const jobHistoryApi = {
  // Get advisor job history
  getAdvisorJobHistory: async (params = {}) => {
    const response = await apiClient.get('/api/advisor/history', { params });
    return response.data;
  },

  // Get job statistics for advisor
  getJobStatistics: async (params = {}) => {
    const response = await apiClient.get('/api/advisor/statistics', { params });
    return response.data;
  },

  // Get booking history
  getBookingHistory: async (bookingId) => {
    const response = await apiClient.get(`/api/advisor/booking/${bookingId}/history`);
    return response.data;
  },

  // Get job timeline
  getJobTimeline: async (bookingId) => {
    const response = await apiClient.get(`/api/advisor/booking/${bookingId}/timeline`);
    return response.data;
  },

  // Update job status manually
  updateJobStatus: async (bookingId, statusData) => {
    const response = await apiClient.patch(`/api/advisor/booking/${bookingId}/status`, statusData);
    return response.data;
  },

  // Delete booking
  deleteBooking: async (bookingId) => {
    const response = await apiClient.delete(`/api/advisor/booking/${bookingId}`);
    return response.data;
  },

  // Generate Job History PDF
  generateJobHistoryPDF: async (params = {}) => {
    const response = await apiClient.get('/api/advisor/pdf/job-history', { 
      params,
      responseType: 'blob'
    });
    return response;
  },

  // Generate Cost Estimation PDF
  generateCostEstimationPDF: async (data) => {
    const response = await apiClient.post('/api/advisor/pdf/cost-estimation', data, {
      responseType: 'blob'
    });
    return response;
  }
};

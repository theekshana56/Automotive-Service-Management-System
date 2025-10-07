import apiClient from '../../api/client';

export const advisorApi = {
  getOverview: async () => {
    const { data } = await apiClient.get('/api/advisor/overview');
    return data;
  },
};



import axios from 'axios';

export const exportFile = async (endpoint, filename) => {
  const response = await axios.get(endpoint, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
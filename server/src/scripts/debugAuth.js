import mongoose from 'mongoose';
import axios from 'axios';

const debugAuth = async () => {
  try {
    console.log('Testing authentication flow...');
    
    // Login as finance manager
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'finance@example.com',
      password: 'password123'
    });
    
    console.log('Login response:', loginResponse.data);
    const token = loginResponse.data.token;
    console.log('Token:', token);
    
    // Test a simple authenticated endpoint first
    try {
      const userResponse = await axios.get('http://localhost:5000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('User profile response:', userResponse.data);
    } catch (error) {
      console.log('User profile error:', error.response?.data || error.message);
    }
    
    // Test the customer payment API
    try {
      const customerPaymentResponse = await axios.get('http://localhost:5000/api/finance/customer-payments/service-costs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Customer payment response:', customerPaymentResponse.data);
    } catch (error) {
      console.log('Customer payment error:', error.response?.data || error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
};

debugAuth();


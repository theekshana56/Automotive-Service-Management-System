import mongoose from 'mongoose';
import axios from 'axios';

const testCustomerPaymentAPI = async () => {
  try {
    // First, let's test the API without authentication to see what error we get
    console.log('Testing API without authentication...');
    try {
      const response = await axios.get('http://localhost:5000/api/finance/customer-payments/service-costs');
      console.log('API Response:', response.data);
    } catch (error) {
      console.log('API Error (expected):', error.response?.data || error.message);
    }

    // Now let's test with authentication
    console.log('\nTesting API with authentication...');
    
    // Login as finance manager
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'finance@example.com',
      password: 'password123'
    });
    
    console.log('Login successful:', loginResponse.data);
    const token = loginResponse.data.token;
    
    // Test the API with authentication
    const apiResponse = await axios.get('http://localhost:5000/api/finance/customer-payments/service-costs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('API Response with auth:', JSON.stringify(apiResponse.data, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
    process.exit(1);
  }
};

testCustomerPaymentAPI();


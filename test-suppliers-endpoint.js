// Test script to verify suppliers endpoint returns correct data format for parts form
const axios = require('axios');

async function testSuppliersEndpoint() {
  try {
    console.log('🔍 Testing suppliers endpoint...');
    const response = await axios.get('http://localhost:5000/api/suppliers/public');
    
    console.log('✅ Response status:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    
    const suppliers = response.data.suppliers || response.data.items || [];
    console.log(`📋 Found ${suppliers.length} suppliers`);
    
    if (suppliers.length > 0) {
      const firstSupplier = suppliers[0];
      console.log('🔍 First supplier structure:');
      console.log('- _id:', firstSupplier._id);
      console.log('- name:', firstSupplier.name);
      console.log('- companyName:', firstSupplier.companyName);
      console.log('- email:', firstSupplier.email);
      
      if (firstSupplier.name) {
        console.log('✅ SUCCESS: Suppliers have "name" field for frontend compatibility');
      } else {
        console.log('❌ ERROR: Suppliers missing "name" field');
      }
    } else {
      console.log('⚠️  No suppliers found in database');
    }
    
  } catch (error) {
    console.error('❌ Error testing suppliers endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSuppliersEndpoint();
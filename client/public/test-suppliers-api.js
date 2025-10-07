// Test script to verify suppliers API
console.log('🧪 Testing Suppliers API...');

// Test the public suppliers endpoint
fetch('http://localhost:5000/api/suppliers/public')
  .then(response => {
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);
    return response.json();
  })
  .then(data => {
    console.log('✅ Suppliers data received:', data);
    console.log('📊 Number of suppliers:', data.suppliers?.length || 0);
    
    if (data.suppliers && data.suppliers.length > 0) {
      console.log('👥 First supplier:', data.suppliers[0]);
      console.log('✅ API is working correctly!');
    } else {
      console.warn('⚠️ No suppliers found in response');
    }
  })
  .catch(error => {
    console.error('❌ Error testing API:', error);
  });

console.log('🧪 Test complete - check results above');
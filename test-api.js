// Test script to check if OutsourcingStaff API works
const testAPI = async () => {
  try {
    console.log('Testing /api/outsourcing-staff endpoint...');
    
    const response = await fetch('http://localhost:3002/api/outsourcing-staff?isActive=true');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ API works! Found', data.data.length, 'staff members');
    } else {
      console.log('❌ API returned error:', data.error);
    }
  } catch (error) {
    console.error('❌ Failed to call API:', error);
  }
};

testAPI();

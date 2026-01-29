#!/usr/bin/env tsx
/**
 * Script để test login API trực tiếp
 */

async function testLogin() {
  const email = 'admin@bimcompany.vn';
  const password = 'admin';
  const baseUrl = 'https://zfe-manage.vercel.app';

  console.log('🔍 Testing login API...\n');

  // Step 1: Get CSRF token
  console.log('1. Getting CSRF token...');
  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;
  console.log('✅ CSRF token:', csrfToken.substring(0, 20) + '...\n');

  // Step 2: Test login
  console.log('2. Testing login...');
  const formData = new URLSearchParams();
  formData.append('email', email);
  formData.append('password', password);
  formData.append('csrfToken', csrfToken);
  formData.append('callbackUrl', '/');
  formData.append('json', 'true');

  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const loginData = await loginResponse.json();
    
    console.log('Response status:', loginResponse.status);
    console.log('Response data:', JSON.stringify(loginData, null, 2));

    if (loginResponse.ok) {
      console.log('\n✅ Login successful!');
    } else {
      console.log('\n❌ Login failed:', loginData.error || loginData);
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  }
}

testLogin();

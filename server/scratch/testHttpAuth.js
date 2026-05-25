import fetch from 'node-fetch';

const testHttp = async () => {
  const BASE_URL = 'http://localhost:5001/api';
  const testEmail = `newuser_${Date.now()}@example.com`;
  const testPassword = 'MySecretPassword123!';

  console.log('--- STARTING HTTP AUTHENTICATION CYCLE TEST ---');

  try {
    // 1. SIGNUP
    console.log(`\n1. Attempting Signup for: ${testEmail}`);
    const signupResponse = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Test User',
        email: testEmail,
        password: testPassword,
        company: 'Test Company'
      })
    });

    const signupData = await signupResponse.json();
    console.log('Signup Status:', signupResponse.status);
    console.log('Signup Response:', JSON.stringify(signupData, null, 2));

    if (signupResponse.status !== 201) {
      console.error('❌ Signup failed!');
      process.exit(1);
    }

    // 2. LOGIN (Simulating logging back in)
    console.log(`\n2. Attempting Login with same details...`);
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', JSON.stringify(loginData, null, 2));

    if (loginResponse.status === 200) {
      console.log('✅ SUCCESS: User registered, logged out, and logged back in successfully!');
    } else {
      console.error('❌ FAIL: Login returned error after signup!');
      process.exit(1);
    }

    // 3. ADMIN LOGIN
    console.log(`\n3. Attempting Login as Admin (admin@smartstore.ai)...`);
    const adminLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@smartstore.ai',
        password: 'Admin@123'
      })
    });

    const adminLoginData = await adminLoginResponse.json();
    console.log('Admin Login Status:', adminLoginResponse.status);
    console.log('Admin Login Response:', JSON.stringify(adminLoginData, null, 2));

    if (adminLoginResponse.status === 200) {
      console.log('\n✅ SUCCESS: Admin logged in successfully!');
      process.exit(0);
    } else {
      console.error('❌ FAIL: Admin login returned error!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ HTTP Test Exception:', error);
    process.exit(1);
  }
};

testHttp();

const http = require('http');

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function test() {
  console.log('Testing Nicsan CRM API...\n');

  // Test health
  console.log('1. Health Check');
  const health = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log(`   Status: ${health.status}`);
  console.log(`   Response: ${JSON.stringify(health.body)}\n`);

  // Test login
  console.log('2. Login as Admin');
  const loginBody = JSON.stringify({ email: 'admin@nicsan.in', password: 'Admin@123' });
  const login = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginBody.length }
  }, loginBody);
  console.log(`   Status: ${login.status}`);
  console.log(`   Response: ${JSON.stringify(login.body)}\n`);

  // Get summary
  if (login.status === 200 && login.body.accessToken) {
    console.log('3. Get Policy Summary');
    const summary = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/policies/summary',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${login.body.accessToken}` }
    });
    console.log(`   Status: ${summary.status}`);
    console.log(`   Response: ${JSON.stringify(summary.body)}\n`);
  }
}

test().catch(console.error);
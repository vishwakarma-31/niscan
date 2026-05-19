const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function test() {
  const client = await pool.connect();

  // Delete and recreate fresh
  await client.query('DELETE FROM users');

  const hash = await bcrypt.hash('Admin@123', 12);
  await client.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)', ['Nicsan Admin', 'admin@nicsan.in', hash, 'admin']);

  const hash2 = await bcrypt.hash('Ops@123', 12);
  await client.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)', ['Ops User', 'ops@nicsan.in', hash2, 'ops']);

  console.log('Users recreated');

  // Test verification
  const result = await client.query('SELECT * FROM users WHERE email = $1', ['admin@nicsan.in']);
  const match = await bcrypt.compare('Admin@123', result.rows[0].password_hash);
  console.log('Verification:', match ? 'PASS' : 'FAIL');

  client.release();
  await pool.end();
}
test().catch(console.error);


require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

const BCRYPT_ROUNDS = 12;

const seedUsers = [
  {
    name: 'Nicsan Admin',
    email: 'admin@nicsan.in',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    name: 'Ops User',
    email: 'ops@nicsan.in',
    password: 'Ops@123',
    role: 'ops',
  },
];

async function seed() {
  console.log('🌱 Starting seed...');

  try {
    // Check if users already exist
    const existing = await pool.query('SELECT email FROM users');
    const existingEmails = existing.rows.map((r) => r.email);

    for (const user of seedUsers) {
      if (existingEmails.includes(user.email)) {
        console.log(`⏭️  User ${user.email} already exists, skipping`);
        continue;
      }

      const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role`,
        [user.name, user.email, passwordHash, user.role]
      );

      console.log(`✅ Created user: ${result.rows[0].email} (${result.rows[0].role})`);
    }

    console.log('🎉 Seed complete!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
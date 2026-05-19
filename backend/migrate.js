require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

const migrationsDir = path.join(__dirname, 'migrations');

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // Get all SQL files and sort them
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files...`);
    
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Running migration: ${file}...`);
      await client.query(sql);
      console.log(`✓ ${file} completed`);
    }
    
    console.log('\n✅ All migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(() => process.exit(1));
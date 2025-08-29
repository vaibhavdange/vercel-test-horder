const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTestUser() {
  try {
    const email = 'admin@example.com';
    const password = 'admin123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM better_auth_users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('User already exists:', email);
      return;
    }
    
    // Create user
    const result = await pool.query(
      'INSERT INTO better_auth_users (id, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        true,
        new Date(),
        new Date()
      ]
    );
    
    console.log('Test user created successfully:', result.rows[0]);
    
    // You would also need to create a password record in a separate table
    // For now, we'll just create the user
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();

const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addTestUser() {
  try {
    const email = 'admin@example.com';
    const username = 'admin';
    const password = 'admin123';
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('User already exists:', email);
      return;
    }
    
    // Create user
    const result = await pool.query(
      `INSERT INTO users (id, username, "passwordHash", "fullName", email, role, "isActive", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username,
        password, // In production, this should be hashed
        'System Administrator',
        email,
        'admin',
        true,
        new Date(),
        new Date()
      ]
    );
    
    console.log('Test user created successfully:', result.rows[0]);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await pool.end();
  }
}

addTestUser();

const mysql = require('mysql2');
require('dotenv').config(); // Loads your database credentials from .env

const dbPassword = process.env.DB_PASSWORD ?? process.env.DB_PASS;

// Create a connection pool (better for performance and multiple users)
const pool = mysql.createPool({
  host: process.env.DB_HOST,     // Cloud host address
  user: process.env.DB_USER,     // Your database username
  password: dbPassword,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export the promise-based version for modern async/await code
module.exports = pool.promise();

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbPassword = process.env.DB_PASSWORD ?? process.env.DB_PASS;

async function checkConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: dbPassword,
      database: process.env.DB_NAME
    });
    
    await connection.ping();
    console.log("✅ DATABASE STATUS: Connected Successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ DATABASE STATUS: Connection Failed!");
    console.error("Error Code:", err.code); // This tells us WHY it failed
    console.error("Message:", err.message);
    process.exit(1);
  }
}

checkConnection();

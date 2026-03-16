import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbPassword = process.env.DBPASSWD ?? process.env.DB_PASSWD;

async function checkConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DBUSER,
      password: dbPassword
    });
    
    await connection.ping();
    console.log("✅ DATABASE STATUS: Connected Successfully!");
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ DATABASE STATUS: Connection Failed!");
    console.error("Error Code:", err.code); // This tells us WHY it failed
    console.error("Message:", err.message);
    process.exit(1);
  }
}

checkConnection();

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DBUSER ?? process.env.DB_USER,
  password: process.env.DBPASSWD ?? process.env.DB_PASSWORD ?? process.env.DB_PASS,
  database: process.env.DBNAME ?? process.env.DB_NAME
};

async function checkConnection() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.ping();
    console.log("DATABASE STATUS: Connected successfully");
    process.exit(0);
  } catch (err) {
    console.error("DATABASE STATUS: Connection failed");
    console.error("Error Code:", err.code);
    console.error("Message:", err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkConnection();

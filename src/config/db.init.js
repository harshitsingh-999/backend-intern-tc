import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export async function createDatabaseIfNotExists() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWD
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DBNAME}\`;`
  );

  await connection.end();
}

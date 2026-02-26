const db = require('../config/db');

const createUser = async (email, hashedPassword) => {
  // SQL Query to insert a new trainee [cite: 146]
  const sql = "INSERT INTO users (email, password, role) VALUES (?, ?, 'TRAINEE')";
  const [result] = await db.execute(sql, [email, hashedPassword]);
  return result;
};
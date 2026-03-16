import db from '../config/db.js';

const createUser = async (email, hashedPassword) => {
  // SQL Query to insert a new trainee [cite: 146]
  const sql = "INSERT INTO users (email, password, Role) VALUES (?, ?, 'TRAINEE')";
  const [result] = await db.execute(sql, [email, hashedPassword]);
  return result;
};

export { createUser };
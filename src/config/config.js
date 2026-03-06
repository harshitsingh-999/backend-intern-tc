require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DBUSER || "root",
    password: process.env.DBPASSWD || null,
    database: process.env.DBNAME || "intern_db",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "mysql"
  }
}
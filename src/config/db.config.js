// src/config/db.config.js
import Sequelize from "sequelize";
import dotenv from "dotenv";
dotenv.config();


const sequelize = new Sequelize(
  process.env.DBNAME,
  process.env.DBUSER,
  process.env.DBPASSWD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
    port: 3306,

    timezone: "+05:30", // ✅ IST timezone

    dialectOptions: {
      dateStrings: true,
      typeCast: true,
      timezone: "+05:30" // ✅ Force MySQL timezone
    },

    pool: {
      max: 5,
      min: 0,
      idle: 10000
    }
  }
);

export default sequelize;

import dotenv from "dotenv";

import Sequelize from "sequelize";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DBNAME,
  process.env.DBUSER,
  process.env.DBPASSWD,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: "mysql",
    logging: false,
    port: parseInt(process.env.DB_PORT) ||3306,

    timezone: "+05:30", // ? IST timezone

    dialectOptions: {
      dateStrings: true,
      typeCast: true,
      timezone: "+05:30",
      authSwitchHandler: ({ pluginName, pluginData }, cb) => {
        if (pluginName === 'caching_sha2_password') {
          cb(null, Buffer.from(process.env.DBPASSWD + '\0'));
        }
      } // ? Force MySQL timezone
    },

    pool: {
      max: 5,
      min: 0,
      idle: 10000
    }
  }
);

export default sequelize;

require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DBUSER,
    password: process.env.DBPASSWD,
    database: process.env.DBNAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: 3306,
    logging: false,
    timezone: '+05:30',
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
      timezone: '+05:30'
    },
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    }
  },
  production: {
    username: process.env.DBUSER,
    password: process.env.DBPASSWD,
    database: process.env.DBNAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: 3306,
    logging: false,
    timezone: '+05:30',
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
      timezone: '+05:30'
    },
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    }
  }
};

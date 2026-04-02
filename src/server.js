const db = require('./config/db');

// Attempt to query the database as soon as the server starts
db.query('SELECT 1')
  .then(() => {
    console.log('✅ Success: Database connected to Team Computers Cloud.');
  })
  .catch((err) => {
    console.error('❌ Error: Database connection failed!', err.message);
    console.log('Check your .env file and Network Access settings.');
  });

  db.UpdateRequest = require("./UpdateRequest")(sequelize, DataTypes);
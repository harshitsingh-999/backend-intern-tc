'use strict';

require("dotenv").config();
const express = require("express");
const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require("./src/config/config.js")[env];
const port = Number(process.env.PORT || process.env.port || 7358);

const app = express();
app.use(express.json());

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

sequelize.authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch(err => console.log("Database connection error:", err));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

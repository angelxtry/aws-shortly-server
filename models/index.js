"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require("../config/config.json")[env];
const db = {};

let sequelize;
sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

sequelize.sync();

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.users = require("./users")(sequelize, Sequelize);
db.urls = require("./urls")(sequelize, Sequelize);

db.users.hasMany(db.urls);
db.urls.belongsTo(db.users);

module.exports = db;

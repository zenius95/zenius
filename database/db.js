const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Use database file in the application root directory
const dbPath = path.resolve(__dirname, '..', 'zenius.sqlite');
console.log("Database Path:", dbPath);

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
});

module.exports = sequelize;

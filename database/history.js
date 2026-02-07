const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const History = sequelize.define('History', {
    title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    favicon: {
        type: DataTypes.TEXT, // Changed to TEXT to support long Base64 strings
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

// Sync model with database
// In production, use migrations. For this rapid prototype, sync() is fine.
History.sync({ alter: true }).then(() => {
    console.log("History table synced");
}).catch(err => {
    console.error("Error syncing History table:", err);
});

module.exports = History;

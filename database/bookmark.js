const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Bookmark = sequelize.define('Bookmark', {
    title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    favicon: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    folder: {
        type: DataTypes.STRING,
        defaultValue: 'Bookmarks Bar'
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

Bookmark.sync({ alter: true }).then(() => {
    console.log("Bookmark table synced");
}).catch(err => {
    console.error("Error syncing Bookmark table:", err);
});

module.exports = Bookmark;

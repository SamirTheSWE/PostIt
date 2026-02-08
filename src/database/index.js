require('dotenv').config();
const mysql = require('mysql2/promise');

if (!process.env.DB_PASSWORD || !process.env.SESSION_SECRET) {
    throw new Error('Required environment variables are not set. Check .env file.');
}

module.exports = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
db.getConnection()
  .then(connection => {
    console.log('Connected to database cattle_rustling');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

module.exports = db;
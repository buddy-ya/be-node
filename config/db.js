require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'local'}` });
const mysql = require('mysql2');

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
};

if (process.env.DB_SSL === 'true') {
  config.ssl = { rejectUnauthorized: false };
}

const connection = mysql.createConnection(config);

connection.connect((err) => {
  if (err) {
    console.error('❌ MySQL 연결 실패:', err.message);
  } else {
    console.log(`✅ MySQL 연결 성공`);
  }
});

module.exports = connection;

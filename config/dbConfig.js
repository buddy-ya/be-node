require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'local'}` });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  // typeCast 옵션 추가: BIT(1) 타입을 boolean으로 변환
  typeCast: function (field, next) {
    if (field.type === 'BIT' && field.length === 1) {
      const buffer = field.buffer();
      // Buffer가 null인 경우도 처리
      return buffer ? buffer[0] === 1 : false;
    }
    return next();
  }
};

if (process.env.DB_SSL === 'true') {
  config.ssl = { rejectUnauthorized: false };
}

// createPool을 사용하여 연결 풀 생성 (변수명을 db로 사용)
const db = mysql.createPool(config);

// 연결 테스트 (옵션)
db.getConnection()
  .then((connection) => {
    console.log('✅ MySQL 연결 성공');
    connection.release(); // 사용 후 연결 해제
  })
  .catch((err) => {
    console.error('❌ MySQL 연결 실패:', err.message);
  });

module.exports = db;

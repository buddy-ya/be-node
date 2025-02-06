const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '3.39.240.61',         // ✅ AWS EC2의 MySQL 호스트 IP (Spring과 동일)
    user: 'root',                // ✅ MySQL 사용자 이름
    password: 'Buddyya1234!',    // ✅ MySQL 비밀번호
    database: 'buddy_ya',        // ✅ 데이터베이스 이름
    port: 3306,                  // ✅ MySQL 기본 포트
    ssl: { rejectUnauthorized: false } // 🔒 AWS 환경일 경우 SSL 설정 필요 시 사용
});

connection.connect((err) => {
    if (err) {
        console.error('❌ MySQL 연결 실패:', err);
        return;
    }
    console.log('✅ MySQL 연결 성공!');
});

module.exports = connection;

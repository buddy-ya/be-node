const db = require('../config/db');

// ✅ 모든 학생 정보 조회
exports.getAllStudents = (callback) => {
    db.query('SELECT * FROM student', (err, results) => {  // 수정: 'students' → 'student'
        if (err) {
            return callback(err);
        }
        callback(null, results);
    });
};

// ✅ 특정 학생 정보 조회
exports.getStudentById = (id, callback) => {
    db.query('SELECT * FROM student WHERE id = ?', [id], (err, result) => {  // 수정: 'students' → 'student'
        if (err) {
            return callback(err);
        }
        callback(null, result[0]);
    });
};

const db = require('../config/db');
const Student = require('../model/Student');

class StudentRepository {
  // 모든 학생 정보 조회
  async getAllStudents() {
    try {
      const [rows] = await db.query('SELECT * FROM student');
      return rows.map(row => new Student(row));
    } catch (err) {
      throw err;
    }
  }

  // 특정 학생 정보 조회
  async getStudentById(id) {
    try {
      const [rows] = await db.query('SELECT * FROM student WHERE id = ?', [id]);
      if (rows.length === 0) {
        return null;
      }
      return new Student(rows[0]);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = new StudentRepository();

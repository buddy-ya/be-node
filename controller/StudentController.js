const StudentResponse = require('../dto/StudentResponse');
const studentService = require('../service/StudentService');

class StudentController {
  // 모든 학생 정보 조회
  async getAllStudents(req, res) {
    try {
      const students = await studentService.getAllStudents();
      const response = students.map((student) => StudentResponse.from(student));
      return res.status(200).json(response);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 특정 학생 정보 조회
  async getStudentById(req, res) {
    try {
      const student = await studentService.getStudentById(req.params.id);
      const response = StudentResponse.from(student);
      return res.status(200).json(response);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new StudentController(); 

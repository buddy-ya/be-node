const BaseError = require('../common/exception/BaseError');
const studentRepository = require('../repository/StudentRepository');

class StudentService {

  async getAllStudents() {
      const students = await studentRepository.getAllStudents();
      return students;
  }

  async getStudentById(id) {
      const student = await studentRepository.getStudentById(id);
      if(!student){
        throw new BaseError(404, 2000, "해당 학생을 찾지 못하였습니다.");
      }
      return student;
  }
}

module.exports = new StudentService(); // 싱글톤 패턴 적용

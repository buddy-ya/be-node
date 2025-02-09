// dtos/StudentResponse.js
class StudentResponse {
    constructor({
      id,
      name,
      email,
      phoneNumber,
      country,
      gender,
      role,
      certificated,
      korean,
      createDate,
      updatedDate,
      universityId,
      characterProfileImage,
      studentNumber,
    }) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.phoneNumber = phoneNumber;
      this.country = country;
      this.gender = gender;
      this.role = role;
      this.certificated = certificated;
      this.korean = korean;
      this.createDate = createDate;
      this.updatedDate = updatedDate;
      this.universityId = universityId;
      this.characterProfileImage = characterProfileImage;
      this.studentNumber = studentNumber;
    }
  
    /**
     * Student 모델 인스턴스를 받아 camelCase 키를 가진 StudentResponse 인스턴스를 생성합니다.
     * @param {Student} student - Student 모델 인스턴스 (키는 언더스코어 표기)
     * @returns {StudentResponse}
     */
    static from(student) {
      return new StudentResponse({
        id: student.id,
        name: student.name,
        email: student.email,
        phoneNumber: student.phone_number, // 언더스코어 → camelCase 변환
        country: student.country,
        gender: student.gender,
        role: student.role,
        certificated: student.certificated,
        korean: student.korean,
        createDate: student.create_date, // 언더스코어 → camelCase 변환
        updatedDate: student.updated_date, // 언더스코어 → camelCase 변환
        universityId: student.university_id, // 언더스코어 → camelCase 변환
        characterProfileImage: student.character_profile_image, // 언더스코어 → camelCase 변환
        studentNumber: student.student_number, // 언더스코어 → camelCase 변환
      });
    }
  }
  
  module.exports = StudentResponse;
  
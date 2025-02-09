class Student {
    constructor(data) {
        this.certificated = data.certificated;
        this.korean = data.korean;
        this.create_date = new Date(data.create_date);
        this.id = data.id;
        this.university_id = data.university_id;
        this.updated_date = new Date(data.updated_date);
        this.phone_number = data.phone_number;
        this.country = data.country;
        this.name = data.name;
        this.character_profile_image = data.character_profile_image;
        this.email = data.email;
        this.student_number = data.student_number;
        this.gender = data.gender;
        this.role = data.role;
    }
}
module.exports = Student;

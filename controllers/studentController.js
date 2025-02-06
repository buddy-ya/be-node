const studentModel = require('../models/studentModel');

exports.getAllStudents = (req, res) => {
    studentModel.getAllStudents((err, students) => {
        if (err) {
            return res.status(500).json({ error: 'DB 오류' });
        }
        res.json(students);
    });
};

exports.getStudentById = (req, res) => {
    const { id } = req.params;
    studentModel.getStudentById(id, (err, student) => {
        if (err) {
            return res.status(500).json({ error: 'DB 오류' });
        }
        if (!student) {
            return res.status(404).json({ error: '학생을 찾을 수 없습니다.' });
        }
        res.json(student);
    });
};
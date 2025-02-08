const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.get('/', studentController.getAllStudents);       // 모든 학생 정보 조회
router.get('/:id', studentController.getStudentById);    // 특정 학생 정보 조회

module.exports = router;
// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controller/StudentController');

router.get('/', (req, res) => studentController.getAllStudents(req, res));
router.get('/:id', (req, res) => studentController.getStudentById(req, res));

module.exports = router;

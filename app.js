const express = require('express');
const app = express();

app.use(express.json());

// 라우터 설정
const studentRouter = require('./routes/students');
app.use('/students', studentRouter);

// 에러 핸들러
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;  // ✅ 올바르게 내보내기

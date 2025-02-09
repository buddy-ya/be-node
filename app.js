// app.js
const express = require('express');
const app = express();

app.use(express.json());

const studentRoutes = require('./routes/studentRoute');
app.use('/students', studentRoutes);

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof require('./common/exception/BaseError')) {
    return res.status(err.status).json({
      errorCode: err.errorCode,
      message: err.message,
    });
  }
  res.status(500).json({
    errorCode: 0,
    message: 'Internal Server Error',
  });
});

module.exports = app;

// app.js
const express = require("express");
const app = express();
const httpAuthInterceptor = require("./middleware/HttpAuthInterceptor");
const dotenv = require("dotenv");
dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
});

app.use(express.json());

const baseRoute = require("./routes/baseRoute");
app.use("/node", baseRoute);

const studentRoute = require("./routes/studentRoute");
app.use("/node/students", studentRoute);

const chatRoute = require("./routes/chatRoute");
app.use("/node/room", httpAuthInterceptor, chatRoute);

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof require("./common/exception/BaseError")) {
    return res.status(err.status).json({
      errorCode: err.errorCode,
      message: err.message,
    });
  }
  res.status(500).json({
    errorCode: 0,
    message: "Internal Server Error",
  });
});

module.exports = app;

// app.js

const express = require('express');
const app = express();

// JSON 파싱 미들웨어 등록
app.use(express.json());

const studentRoutes = require('./routes/studentRoutes');
app.use('/students', studentRoutes);

// 외부 모듈 불러오기
const socketAuth = require('./middleware/SocketAuth');
// const studentRouter = require('./routes/students');

// --- 기본 테스트 라우트 ---
// GET "/" 엔드포인트에서 요청 헤더의 Authorization 값을 이용해 
// socketAuth.verify() 미들웨어를 테스트합니다.
app.get('/', (req, res) => {
  // 요청 헤더의 Authorization 값을 사용하여 가짜 socket 객체 생성
  console.log(req.headers);

  const fakeSocket = {
    handshake: {
      headers: {
        authorization: req.headers.authorization
      }
    }
  };

//   // socketAuth.verify() 호출하여 토큰 검증
  socketAuth.verify(fakeSocket, (err) => {
    if (err) {
      return res.status(401).json({ error: err.message });
    }
    // 검증 성공 시, 디코드된 토큰 정보를 응답으로 전송
    res.json({ message: 'Token verified', decoded: fakeSocket.decoded });
  });
});


// --- 에러 핸들러 ---
// 라우터나 미들웨어에서 발생한 에러를 처리합니다.
app.use((err, req, res, next) => {
  console.error(err); // 서버 로그에 에러 출력
  
  // BaseError 인스턴스이면 해당 상태와 메시지를 사용
  if (err instanceof require('./common/exception/BaseError')) {
    return res.status(err.status).json({
      errorCode: err.errorCode,
      message: err.message,
    });
  }
  
  // 그 외의 예외는 500 Internal Server Error 처리
  res.status(500).json({
    errorCode: 0,
    message: 'Internal Server Error',
  });
});

// 필요에 따라 다른 모듈에서 이 Express 앱 인스턴스를 사용하기 위해 내보냅니다.
module.exports = app;

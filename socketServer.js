// socketServer.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
dotenv.config();

const app = require('./app'); // Express 앱 가져오기

// HTTP 서버 생성 (Express 앱을 포함)
const server = http.createServer(app);

// Socket.IO 서버 생성 (HTTP 서버와 동일 포트 사용)
const io = new Server(server);

// Socket.IO 인증 미들웨어 불러오기
const socketAuthInterceptor = require('./middleware/SocketAuthInterceptor');

// 동적 네임스페이스 생성: URL이 "/ws/chat" 형식으로 설정
// (쿼리 파라미터로 roomId를 전달하는 방식으로 변경)
const chatNamespace = io.of('/ws/chat');

// 네임스페이스에 인증 미들웨어 적용
chatNamespace.use((socket, next) => {
  socketAuthInterceptor.verify(socket, next);
});

// 연결 성공 시 이벤트 핸들러 등록
chatNamespace.on('connection', (socket) => {
  console.log(`Socket connected in namespace ${socket.nsp.name}: studentId=${socket.studentId}, roomId=${socket.roomId}`);
  
  // 클라이언트를 해당 방에 참여시키기 (roomId는 문자열로 변환)
  socket.join(socket.roomId.toString());

  // 'message' 이벤트 핸들러 등록
  socket.on('message', (data) => {
    const ChatService = require('./service/ChatService'); // 상대경로에 주의 (예: './service/ChatService')
    ChatService.handleMessage(socket, data);
  });
});

// 하나의 HTTP 서버에서 Express와 Socket.IO 모두 실행
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

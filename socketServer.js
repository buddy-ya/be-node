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

// 동적 네임스페이스 생성: URL이 "/ws/chat/{roomId}" 형태인 경우에만 연결 허용
const chatNamespace = io.of('/ws/chat');

// 네임스페이스에 인증 미들웨어 적용
chatNamespace.use((socket, next) => {
  socketAuthInterceptor.verify(socket, next);
});

// 연결 성공 시 이벤트 핸들러 등록
chatNamespace.on('connection', (socket) => {
  console.log(`Socket connected in namespace ${socket.nsp.name}: studentId=${socket.studentId}, roomId=${socket.roomId}`);
  // 이후 추가 이벤트 핸들러 등록 가능 (메시지 처리, disconnect 등)
});

// 하나의 HTTP 서버에서 Express와 Socket.IO 모두 실행
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

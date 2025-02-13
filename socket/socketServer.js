// socket/socketServer.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');


const app = require('../app'); // 상위 디렉터리에 위치한 Express 앱
const server = http.createServer(app);
const io = new Server(server, {
  pingInterval: 25000, // 25초마다 ping 전송
  pingTimeout: 60000   // 60초 동안 pong 응답이 없으면 연결 해제
});

// 상위 디렉터리의 middleware 폴더에서 SocketAuthInterceptor 불러오기
const socketAuthInterceptor = require('../middleware/SocketAuthInterceptor');

// 네임스페이스를 정적으로 설정 (쿼리 파라미터 방식 사용)
// 클라이언트는 "ws://localhost:3000/ws/chat?roomId=1" 형식으로 연결합니다.
const chatNamespace = io.of('node/ws/chat');

// 네임스페이스에 인증 미들웨어 적용
chatNamespace.use((socket, next) => {
  socketAuthInterceptor.verify(socket, next);
});

// 연결 이벤트 처리
chatNamespace.on('connection', (socket) => {
  console.log(`Socket connected in namespace ${socket.nsp.name}: studentId=${socket.studentId}, roomId=${socket.roomId}`);
  
  // 소켓을 해당 방(roomId)으로 참여시킵니다.
  socket.join(socket.roomId.toString());
  
  // 'message' 이벤트 핸들러 등록 (실시간 메시지 전송 및 DB 저장)
  socket.on('message', async (data) => {
    const ChatService = require('../service/ChatService');
    try {
      await ChatService.handleMessageAndSave(socket, data, chatNamespace);
    } catch (err) {
      console.error("Error handling message:", err);
      socket.emit('error', { message: 'Message processing failed' });
    }
  });
});

// 하나의 HTTP 서버에서 Express와 Socket.IO를 모두 실행합니다.
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = chatNamespace;
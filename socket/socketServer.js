// socket/socketServer.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = require("../app"); // 상위 디렉터리에 위치한 Express 앱
const server = http.createServer(app);
const io = new Server(server, {
  pingInterval: 25000, // 25초마다 ping 전송
  pingTimeout: 60000, // 60초 동안 pong 응답이 없으면 연결 해제
  transports: ["websocket"],
  maxHttpBufferSize: 10 * 1024 * 1024,
});

// 상위 디렉터리의 middleware 폴더에서 SocketAuthInterceptor 불러오기
const socketAuthInterceptor = require("../middleware/SocketAuthInterceptor");
const ChatService = require("../service/ChatService");

// 네임스페이스를 정적으로 설정 (쿼리 파라미터 없이 단순 URL 사용)
// 클라이언트는 "ws://localhost:3000/ws/chat" 형식으로 연결합니다.
const chatNamespace = io.of("/chat");

// 네임스페이스에 인증 미들웨어 적용
chatNamespace.use((socket, next) => {
  socketAuthInterceptor.verify(socket, next);
});

// 연결 이벤트 처리
chatNamespace.on("connection", (socket) => {
  // 핸드셰이크 시에는 studentId만 설정됩니다.

  // 클라이언트가 채팅방에 입장할 때 호출하는 'room_in' 이벤트
  // 클라이언트는 { roomId: <roomId> } 형태의 payload를 전달해야 합니다.
  socket.on("room_in", async (data, callback) => {
    try {
      const roomId = parseInt(data.roomId, 10);
      socket.join(roomId.toString());
      socket.roomId = roomId; // 클라이언트에서 보내는 roomId로 socket 업데이트
      if (callback && typeof callback === "function") {
        callback({ status: "success" });
      }
    } catch (err) {
      console.error("Error joining room:", err);
      if (callback && typeof callback === "function") {
        callback({ status: "error" });
      }
    }
  });

  // 'message' 이벤트 핸들러 (data에 roomId 포함)
  // 클라이언트는 { roomId: <roomId>, message: "..." } 형태의 payload를 전달합니다.
  socket.on("message", async (data, callback) => {
    try {
      const roomId = parseInt(data.roomId, 10);
      socket.roomId = roomId; // 업데이트: 클라이언트가 보내는 roomId 사용
      const chat = await ChatService.handleMessageAndSave(
        socket,
        data,
        chatNamespace
      );
      if (callback && typeof callback === "function") {
        callback({ status: "success", chat: chat });
      }
    } catch (err) {
      console.error("Error handling message:", err);
      if (callback && typeof callback === "function") {
        callback({ status: "error" });
      }
    }
  });

  // 'room_back' 이벤트: 채팅방 UI를 벗어나 뒤로가기 할 때 호출
  // 클라이언트는 { roomId: <roomId> } 형태의 payload를 전달합니다.
  socket.on("room_back", (data, callback) => {
    try {
      const roomId = parseInt(data.roomId, 10);
      socket.leave(roomId.toString());
      if (callback && typeof callback === "function") {
        callback({ status: "success" });
      }
    } catch (err) {
      console.error("Error processing room_back:", err);
      if (callback && typeof callback === "function") {
        callback({ status: "error" });
      }
    }
  });

  // 'room_out' 이벤트 핸들러 (data에 roomId 포함)
  // 클라이언트는 { roomId: <roomId> } 형태의 payload를 전달합니다.
  socket.on("room_out", async (data, callback) => {
    try {
      const roomId = parseInt(data.roomId, 10);
      await ChatService.leaveChatroom(roomId, { studentId: socket.studentId });
      socket.leave(roomId.toString());
      socket
        .to(roomId.toString())
        .emit("roomOut", { senderId: socket.studentId });
      if (callback && typeof callback === "function") {
        callback({ status: "success" });
      }
    } catch (err) {
      console.error("Error leaving chatroom:", err);
      if (callback && typeof callback === "function") {
        callback({ status: "error" });
      }
    }
  });
});

// 하나의 HTTP 서버에서 Express와 Socket.IO를 모두 실행합니다.
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = chatNamespace;

// service/ChatService.js
class ChatService {
    /**
     * 클라이언트로부터 수신한 메시지 데이터를 처리하고, 
     * 같은 방(roomId)에 있는 다른 클라이언트에게 메시지를 브로드캐스트합니다.
     *
     * @param {object} socket - 연결된 Socket.IO 소켓 객체 (이미 roomId, studentId가 설정되어 있음)
     * @param {any} data - 클라이언트가 전송한 메시지 데이터 (예: 문자열 또는 객체)
     * @returns {object} 생성된 메시지 객체
     */
    handleMessage(socket, data) {
      // 메시지 객체 구성
      const message = {
        studentId: socket.studentId,         // 발신자 ID
        roomId: socket.roomId,               // 채팅방 ID
        content: data,                       // 클라이언트에서 보낸 메시지 내용
        createdDate: new Date().toISOString()  // 메시지 전송 시각
      };
  
      // 같은 방에 있는 다른 클라이언트에게 메시지 브로드캐스트 (발신자 제외)
      socket.to(socket.roomId.toString()).emit('message', message);
  
      console.log(`Broadcasted message to room ${socket.roomId}:`, message);
      
      return message;
    }
  }
  
  module.exports = new ChatService();
  
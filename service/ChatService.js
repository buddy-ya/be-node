const ChatRepository = require('../repository/ChatRepository');
const ChatroomRepository = require('../repository/ChatroomRepository');
const ChatroomStudentRepository = require('../repository/ChatroomStudentRepository');

/**
 * MySQL DATETIME 형식 (YYYY-MM-DD HH:MM:SS) 타임스탬프 생성 함수
 * Java의 LocalDateTime 형식과 유사하게 생성 (기본적으로 밀리초 3자리 + "000" 추가)
 */
function getFormattedTimestamp() {
  const date = new Date();
  const pad = (num, size = 2) => String(num).padStart(size, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const milliseconds = pad(date.getMilliseconds(), 3);
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}000`;
}

class ChatService {
  /**
   * 전체 메시지 처리 플로우를 실행합니다.
   * 1. 메시지 객체 생성
   * 2. 브로드캐스트
   * 3. DB 저장
   * 4. 채팅방 업데이트
   * 5. 연결된 소켓(학생) 목록을 이용하여, 읽지 않은 메시지 수 업데이트
   *
   * @param {object} socket - Socket.IO 소켓 (studentId, roomId가 설정됨)
   * @param {object} data - 클라이언트가 전송한 메시지 데이터 (예: { type: "TALK", tempId: 1, message: "메시지입니다" })
   * @param {object} namespace - 현재 사용 중인 Socket.IO 네임스페이스 (연결된 소켓 조회용)
   * @returns {Promise<object>} - 구성된 메시지 객체
   */
  async handleMessageAndSave(socket, data, namespace) {
    const timestamp = getFormattedTimestamp();
    const message = this.buildMessage(socket, data, timestamp);

    this.broadcastMessage(socket, message, timestamp);
    const chatId = await this.persistMessage(message);
    console.log('chatId', chatId);

    await this.updateChatroomLastMessage(socket, message, timestamp);

    const connectedStudentIds = await this.getConnectedStudentIds(namespace, socket.roomId);
    console.log('Connected student IDs:', connectedStudentIds);

    const allStudentIds = await ChatroomStudentRepository.getAllStudentIds(socket.roomId);
    const notConnectedStudentIds = allStudentIds.filter(id => id !== socket.studentId && !connectedStudentIds.includes(id));
    console.log('Students not connected in room:', notConnectedStudentIds);

    await this.updateUnreadCount(socket, connectedStudentIds);
    
    console.log(`Message broadcasted and saved in room ${socket.roomId}:`, message);
    return message;
  }

  /**
   * 메시지 객체를 생성합니다.
   */
  buildMessage(socket, data, timestamp) {
    return {
      type: data.type || 'TALK',  // 기본값 TALK
      chatroomId: socket.roomId,
      studentId: socket.studentId,
      tempId: data.tempId,
      message: data.message || "",
      createdDate: timestamp  // DB 컬럼: create_date
    };
  }

  /**
   * 같은 방(roomId)에 있는 다른 클라이언트에게 메시지를 브로드캐스트합니다.
   */
  broadcastMessage(socket, message, timestamp) {
    socket.to(socket.roomId.toString()).emit('message', {
      type: message.type,
      roomId: socket.roomId,
      userId: socket.studentId,
      tempId: message.tempId,
      message: message.message,
      time: timestamp
    });
  }

  /**
   * 메시지를 DB에 저장합니다.
   */
  async persistMessage(message) {
    return await ChatRepository.save(message);
  }

  /**
   * 채팅방의 마지막 메시지와 마지막 메시지 시간을 업데이트합니다.
   */
  async updateChatroomLastMessage(socket, message, timestamp) {
    const lastMessageContent = message.type === 'TALK' ? message.message : "User entered";
    console.log('lastMessage', lastMessageContent);
    await ChatroomRepository.updateLastMessage(socket.roomId, lastMessageContent, timestamp);
  }

  /**
   * 현재 네임스페이스에서 해당 roomId에 연결된 학생 ID 목록을 반환합니다.
   */
  async getConnectedStudentIds(namespace, roomId) {
    const socketIds = await namespace.in(roomId.toString()).allSockets();
    const connectedStudentIds = [];
    for (const id of socketIds) {
      const s = namespace.sockets.get(id);
      if (s && s.studentId && !connectedStudentIds.includes(s.studentId)) {
        connectedStudentIds.push(s.studentId);
      }
    }
    return connectedStudentIds;
  }

  /**
   * 채팅방의 읽지 않은 메시지 수를 업데이트합니다.
   */
  async updateUnreadCount(socket, connectedStudentIds) {
    await ChatroomStudentRepository.updateUnreadCount(socket.roomId, socket.studentId, connectedStudentIds);
  }
}

module.exports = new ChatService();

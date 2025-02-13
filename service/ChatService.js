// service/ChatService.js
const ChatRepository = require('../repository/ChatRepository');
const ChatroomRepository = require('../repository/ChatroomRepository');
const ChatroomStudentRepository = require('../repository/ChatroomStudentRepository');
const notificationRepository = require('../repository/notificationRepository');
const studentRepository = require('../repository/StudentRepository');
const { expo } = require('../config/expoClient');

/**
 * MySQL DATETIME 형식 (YYYY-MM-DD HH:MM:SS) 타임스탬프 생성 함수
 */
function getFormattedTimestamp() {
  const date = new Date();
  const pad = (n) => (n < 10 ? '0' + n : n);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

class ChatService {
  /**
   * 클라이언트로부터 전달받은 메시지 데이터를 처리하고,
   * 1. 같은 방(roomId)에 있는 다른 클라이언트에게 메시지를 브로드캐스트하며,
   * 2. DB에 메시지를 저장하고,
   * 3. 채팅방의 마지막 메시지 및 시간을 업데이트하며,
   * 4. 발신자를 제외한 연결되지 않은 사용자(읽지 않는 사용자)의 unread_count를 증가시킵니다.
   *
   * @param {object} socket - Socket.IO 소켓 (socket.studentId, socket.roomId가 설정됨)
   * @param {object} data - 클라이언트가 전송한 메시지 데이터 (예: { type: "TALK", tempId: 1, message: "메시지입니다" })
   * @param {object} namespace - 현재 사용 중인 Socket.IO 네임스페이스 (연결된 소켓을 조회하기 위함)
   * @returns {Promise<object>} - 구성된 메시지 객체
   */
  async handleMessageAndSave(socket, data, namespace) {
    // 1. 타임스탬프 생성 (MySQL DATETIME 형식)
    const timestamp = getFormattedTimestamp();
    
    // 2. 메시지 객체 구성
    const message = {
      type: data.type || 'TALK',  // 기본값을 TALK으로 설정
      chatroomId: socket.roomId,  
      studentId: socket.studentId,
      tempId: data.tempId,
      message: data.message || "",
      createdDate: timestamp    // DB 컬럼: create_date
    };

    // 3. 같은 방(roomId)에 있는 다른 클라이언트에게 메시지 브로드캐스트 (발신자 제외)
    socket.to(socket.roomId.toString()).emit('message', {
      type: message.type,
      roomId: socket.roomId,
      userId: socket.studentId,
      tempId: message.tempId,
      message: message.message,
      time: timestamp
    });
    
    // 4. DB에 메시지 저장
    const chatId = await ChatRepository.save(message);
    
    // 5. 채팅방의 마지막 메시지 및 마지막 메시지 시간 업데이트
    const lastMessageContent = message.type === 'TALK' ? message.message : "User entered";
    await ChatroomRepository.updateLastMessage(socket.roomId, lastMessageContent, timestamp);
    
    // 6. 연결된 소켓(학생) 목록을 조회하여, 현재 해당 방에 연결되어 있는 학생 ID 목록을 구합니다.
    //    이를 위해 현재 네임스페이스에서 해당 roomId에 연결된 소켓들의 ID를 가져옵니다.
    const socketIds = await namespace.in(socket.roomId.toString()).allSockets();
    const connectedStudentIds = [];
    for (const id of socketIds) {
      // Socket.IO v4: 네임스페이스의 sockets Map에서 소켓 객체를 가져옴
      const s = namespace.sockets.get(id);
      if (s && s.studentId && !connectedStudentIds.includes(s.studentId)) {
        console.log(s.studentId);
        connectedStudentIds.push(s.studentId);
      } else{// 상대방이 채팅방에 없을 경우에 알림을 보낸다.
        await this.sendPushNotification(socket.studentId, socket.roomId, message.message);
      }
    }
    
    // 7. 채팅방의 읽지 않은 메시지 수 업데이트 (발신자 제외하고, 연결되어 있지 않은 사용자)
    await ChatroomStudentRepository.updateUnreadCount(socket.roomId, socket.studentId, connectedStudentIds);

    console.log(`Message broadcasted and saved in room ${socket.roomId}:`, message);
    return message;
  }

  /**
   * 푸시 알림 전송
   * @param {number} senderId - 메시지 발신자 ID
   * @param {number} chatroomId - 채팅방 ID
   * @param {string} message - 메시지 내용
   */
  async sendPushNotification(senderId, chatroomId, message) {
    try {
      // 1. 채팅방에서 수신자(receiverId) 찾기
      const receiverId = await ChatroomStudentRepository.findReceiverId(chatroomId, senderId);
      if (!receiverId) {
        console.warn(`${chatroomId}채팅룸에 참여하고 있는 학생이 없습니다.`);
        return;
      }

      // 2. 수신자의 ExpoToken 조회
      const expoToken = await notificationRepository.getExpoTokenByStudentId(receiverId);
      if (!expoToken) {
        console.warn(`${receiverId}의 Expo토큰이 존재하지 않습니다.`);
        return;
      }

      // 3. 수신자의 학생 정보 조회
      const receiver = await studentRepository.getStudentById(receiverId);
      if (!receiver) {
        console.warn(`수신자의 학생 정보가 존재하지 않습니다.`);
        return;
      }

      // 4. 한국인 여부에 따라 제목 설정
      const title = receiver.isKorean ? "새로운 메시지가 도착했습니다." : "New Message";
      const body = `${receiver.name} : ${message}`;

      // 5. Expo Push Notification 메시지 생성
      const pushMessage = {
        to: expoToken,
        title,
        body,
        data: { chatroomId }
      };

      // 6. 알림 전송
      const response = await expo.sendPushNotificationsAsync([pushMessage]);
      console.log(`${receiverId}에게 성공적으로 알림을 보냈습니다.`, response);

    } catch (error) {
      console.error(`알림을 보내는데 실패하였습니다.`, error);
      // 알림이 실패해도 프로세스를 종료하지 않음
    }
  }
}

module.exports = new ChatService();

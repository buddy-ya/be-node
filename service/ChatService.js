// service/ChatService.js
const ChatRepository = require('../repository/ChatRepository');
const ChatroomRepository = require('../repository/ChatroomRepository');
const ChatroomStudentRepository = require('../repository/ChatroomStudentRepository');
const S3UploadService = require('../service/S3UploadService');
const Chat = require('../model/Chat');
const chatNamespace = require("../socket/socketServer");
const { expo } = require('../config/expoClient');
const NotificationRepository = require('../repository/NotificationRepository');
const StudentRepository = require('../repository/StudentRepository');

/**
 * MySQL DATETIME 형식 (YYYY-MM-DD HH:MM:SS) 타임스탬프 생성 함수
 * (밀리초 3자리 + "000" 추가)
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
   * 텍스트 메시지 처리 플로우:
   * 1. 채팅(chat) 객체 생성
   * 2. 채팅 브로드캐스트
   * 3. DB 저장
   * 4. 채팅방 업데이트
   * 5. 연결되지 않은 학생(not connected)의 unread_count 업데이트
   *
   * @param {object} socket - Socket.IO 소켓 (studentId, roomId 설정됨)
   * @param {object} data - 클라이언트 메시지 데이터 (예: { type: "TALK", tempId: 1, message: "메시지입니다" })
   * @param {object} namespace - Socket.IO 네임스페이스 인스턴스
   * @returns {Promise<object>} - 생성된 chat 객체
   */
  async handleMessageAndSave(socket, data, namespace) {
    const timestamp = getFormattedTimestamp();
    const chat = this.buildChat(socket, data, timestamp);

    await this.saveChat(chat);

    this.broadcastChat(socket, chat, timestamp);

    await this.updateChatroomLastMessage(socket, chat, timestamp);

    // 연결된 학생들의 ID 목록 조회
    const connectedStudentIds = await this.getConnectedStudentIds(namespace, socket.roomId);

    // DB에 등록된 모든 학생 ID를 조회하고 중복 제거
    const allStudentIds = await ChatroomStudentRepository.getAllStudentIds(socket.roomId);
    const uniqueAllStudentIds = [...new Set(allStudentIds)];

    // sender(studentId)와 연결된 학생들을 제외한 나머지가 unread_count 증가 대상
    const notConnectedStudentIds = uniqueAllStudentIds.filter(
      id => id !== socket.studentId && !connectedStudentIds.includes(id)
    );

    // 연결되지 않은 학생들에게 각각 푸시 알림 전송
    for (const studentId of notConnectedStudentIds) {
      const student = await ChatroomStudentRepository.findByChatroomAndStudentId(socket.roomId, studentId);
      if (student && student.exited === false) {
        await this.sendPushNotification(socket.studentId, studentId, socket.roomId, 'text', data.message);
      }
    }

    console.log('Students not connected in room:', notConnectedStudentIds);

    await this.updateUnreadCount(socket, notConnectedStudentIds);

    console.log(`Chat broadcasted and saved in room ${socket.roomId}:`, chat);
    return {
      id: chat.id,
      roomId: chat.chatroomId,
      type: chat.type,
      senderId: chat.studentId,
      message: chat.message,
      tempId: data.tempId,
      createdDate: chat.createdDate
    };
  }

  /**
   * Chat 모델을 활용하여 채팅(chat) 객체 생성
   */
  buildChat(socket, data, timestamp) {
    return new Chat({
      chatroom_id: socket.roomId,
      student_id: socket.studentId,
      type: data.type || 'TALK',
      message: data.message || "",
      created_date: timestamp,
      tempId: data.tempId // 클라이언트가 전달한 임시 ID
    });
  }

  /**
   * 같은 방(roomId)에 있는 다른 클라이언트에 채팅(chat) 브로드캐스트 (송신자 제외)
   */
  broadcastChat(socket, chat, timestamp) {
    socket.to(socket.roomId.toString()).emit('message', {
      id: chat.id,
      type: chat.type,
      roomId: socket.roomId,
      senderId: socket.studentId,
      tempId: chat.tempId,
      message: chat.message,
      createdDate: timestamp
    });
  }

  /**
   * 채팅(chat)을 DB에 저장한 후, 생성된 id를 Chat 객체에 반영
   */
  async saveChat(chat) {
    const chatId = await ChatRepository.save(chat);
    chat.id = chatId;
    return chatId;
  }

  /**
   * 채팅방의 마지막 메시지와 시간을 업데이트
   */
  async updateChatroomLastMessage(socket, chat, timestamp) {
    const lastMessageContent = chat.type === 'TALK' ? chat.message : "사진을 보냈습니다";
    console.log('lastMessage', lastMessageContent);
    await ChatroomRepository.updateLastMessage(socket.roomId, lastMessageContent, timestamp);
  }

  /**
   * 현재 네임스페이스에서 해당 roomId에 연결된 학생 ID 목록 반환
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
   * 채팅방의 unread_count 업데이트 (연결되지 않은 학생들에 대해서만 증가)
   */
  async updateUnreadCount(socket, notConnectedStudentIds) {
    await ChatroomStudentRepository.updateUnreadCount(socket.roomId, socket.studentId, notConnectedStudentIds);
  }

  /**
   * 채팅방 이미지 전송 처리 플로우:
   * 1. S3에 이미지 업로드
   * 2. 채팅(chat) 객체 생성 (type: IMAGE, message: imageUrl, tempId 포함)
   * 3. DB 저장, 채팅방 업데이트, 실시간 브로드캐스트, unread_count 업데이트
   *
   * @param {string|number} roomId - 채팅방 ID
   * @param {object} userInfo - 인증된 사용자 정보 (예: { studentId: 사용자ID, ... })
   * @param {object} request - { file: Multer 파일 객체, tempId: 임시 ID }
   * @returns {Promise<object>} - 생성된 이미지 chat 객체
   */
  async chatUploadImage(roomId, userInfo, request) {
    console.log("CHAT 이미지 요청!");
    const timestamp = getFormattedTimestamp();

    // 1. 이미지 파일을 S3에 업로드하고 이미지 URL 획득
    const imageUrl = await S3UploadService.uploadFile('/chats', request.file);
    console.log("S3로 부터 Image URL을 받고자함", imageUrl);

    // 2. 채팅(chat) 객체 생성 (클라이언트가 보낸 tempId 포함)
    const chatData = {
      chatroom_id: roomId,
      student_id: userInfo.studentId,
      type: 'IMAGE',
      message: imageUrl,
      created_date: timestamp,
    };

    const chat = new Chat(chatData);

    console.log('chat 객체 생성', chat);

    // 3. DB에 채팅 객체 저장 및 생성된 id 반영
    const chatId = await ChatRepository.save(chat);
    chat.id = chatId;

    // 4. 채팅방의 마지막 메시지 업데이트 ("사진을 보냈습니다")
    await ChatroomRepository.updateLastMessage(roomId, "사진을 보냈습니다", timestamp);

    // 5. 브로드캐스트 준비: 클라이언트가 요구하는 응답 형식으로 payload 구성
    const chatNamespace = require("../socket/socketServer");

    const payload = {
      id: chat.id,
      roomId: parseInt(chat.chatroomId, 10),
      tempId: parseInt(request.tempId, 10),
      senderId: chat.studentId,
      type: chat.type,
      message: chat.message,
      createdDate: chat.createdDate
    };

    // 6. 동일 채팅방에 연결된 다른 소켓(송신자 제외)에게 브로드캐스트
    try {
      const sockets = await chatNamespace.in(roomId.toString()).fetchSockets();
      sockets.forEach(socket => {
        if (socket.studentId !== userInfo.studentId) {
          socket.emit('message', payload);
        }
      });
    } catch (err) {
      console.error("Error broadcasting image chat:", err);
    }

    // 7. 연결되지 않은 학생들에 대해 unread_count 업데이트
    const connectedStudentIds = await this.getConnectedStudentIds(chatNamespace, roomId);
    const allStudentIds = await ChatroomStudentRepository.getAllStudentIds(roomId);
    const uniqueAllStudentIds = [...new Set(allStudentIds)];
    const notConnectedStudentIds = uniqueAllStudentIds.filter(
      id => id !== userInfo.studentId && !connectedStudentIds.includes(id)
    );

    for (const studentId of notConnectedStudentIds) {
      const student = await ChatroomStudentRepository.findByChatroomAndStudentId(roomId, studentId);
      if (student && student.exited === false) {
        await this.sendPushNotification(userInfo.studentId, studentId, roomId, 'image', chat.message);
      }
    }

    console.log('Students not connected in room:', notConnectedStudentIds);
    await this.updateUnreadCount({ roomId: roomId, studentId: userInfo.studentId }, notConnectedStudentIds);

    console.log(`Image chat created for room ${roomId}:`, chat);

    // 8. 최종적으로 클라이언트가 요구하는 형식의 chat 객체를 반환
    return payload;
  }


  /**
   * 채팅방 나가기 처리
   * - REST API와 socket.io 이벤트 모두에서 호출 가능
   * - DB에서 채팅방-사용자 레코드를 조회한 후, exited 플래그를 업데이트
   *
   * @param {number|string} roomId - 채팅방 ID
   * @param {object} userInfo - 사용자 정보 (예: { studentId: 사용자ID, ... })
   * @returns {Promise<object>} - 처리 결과
   */
  async leaveChatroom(roomId, userInfo) {
    const chatroomStudent = await ChatroomStudentRepository.findByChatroomAndStudentId(roomId, userInfo.studentId);
    await ChatroomStudentRepository.updateExited(chatroomStudent.id);
  }

  /**
   * 푸시 알림 전송
   * @param {number} senderId - 메시지 보낸 사람 ID
   * @param {number} receiverId - 메시지 받는 사람 ID
   * @param {number} chatroomId - 채팅방 ID
   * @param {string} type - 메시지 type (예: "text", "image")
   * @param {string} message - 메시지 내용 (text일 경우)
   */
  async sendPushNotification(senderId, receiverId, chatroomId, type, message) {
    try {
      // 1. 수신자의 학생 정보 조회
      const receiver = await StudentRepository.getStudentById(receiverId);
      if (!receiver) {
        console.warn(`수신자의 학생 정보가 존재하지 않습니다.`);
        return;
      }

      // 2. 수신자의 ExpoToken 조회
      const expoToken = await NotificationRepository.getExpoTokenByStudentId(receiverId);
      if (!expoToken) {
        console.warn(`${receiverId}의 Expo토큰이 존재하지 않습니다.`);
        return;
      }

      // 3. 한국인 여부에 따라 제목 설정
      const title = receiver.korean ? "새로운 메시지가 도착했습니다." : "New Message";

      // 4. 메시지 타입에 따라 body 설정
      const sender = await StudentRepository.getStudentById(senderId);
      let body;
      if (type === "text") {
        body = `${sender.name} : ${message}`;
      }
      if (type === "image") {
        body = receiver.korean ? "사진을 보냈습니다." : "Sent an image.";
      }

      // 5. Expo Push Notification 메시지 생성
      const pushMessage = {
        to: expoToken,
        title,
        body,
        priority: 'high',
        channelId: 'default',
        sound: 'default',
        data: {
          chatroomId,
          type: "CHAT"
        }
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

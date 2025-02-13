// service/ChatService.js
const ChatRepository = require('../repository/ChatRepository');
const ChatroomRepository = require('../repository/ChatroomRepository');
const ChatroomStudentRepository = require('../repository/ChatroomStudentRepository');
const S3UploadService = require('../service/S3UploadService');
const Chat = require('../model/Chat');
const chatNamespace = require("../socket/socketServer");

/**
 * MySQL DATETIME 형식 (YYYY-MM-DD HH:MM:SS) 타임스탬프 생성 함수
 * Java의 LocalDateTime 형식과 유사하게 생성 (밀리초 3자리 + "000" 추가)
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
   * 1. 메시지 객체 생성  
   * 2. 브로드캐스트  
   * 3. DB 저장  
   * 4. 채팅방 업데이트  
   * 5. 연결되지 않은 학생(not connected)의 unread_count 업데이트
   *
   * @param {object} socket - Socket.IO 소켓 (studentId, roomId 설정)
   * @param {object} data - 클라이언트 메시지 데이터 (예: { type: "TALK", tempId: 1, message: "메시지입니다" })
   * @param {object} namespace - Socket.IO 네임스페이스 인스턴스
   * @returns {Promise<object>} - 생성된 메시지 객체
   */
  async handleMessageAndSave(socket, data, namespace) {
    const timestamp = getFormattedTimestamp();
    const message = this.buildMessage(socket, data, timestamp);

    this.broadcastMessage(socket, message, timestamp);
    const chatId = await this.persistMessage(message);
    console.log('chatId', chatId);

    await this.updateChatroomLastMessage(socket, message, timestamp);

    // 연결된 학생들의 ID 목록 조회
    const connectedStudentIds = await this.getConnectedStudentIds(namespace, socket.roomId);
    console.log('Connected student IDs:', connectedStudentIds);

    // DB에 등록된 모든 학생 ID를 조회하고 중복 제거
    const allStudentIds = await ChatroomStudentRepository.getAllStudentIds(socket.roomId);
    const uniqueAllStudentIds = [...new Set(allStudentIds)];
    // sender와 연결된 학생들을 제외한 나머지가 unread_count 증가 대상
    const notConnectedStudentIds = uniqueAllStudentIds.filter(
      id => id !== socket.studentId && !connectedStudentIds.includes(id)
    );
    console.log('Students not connected in room:', notConnectedStudentIds);

    await this.updateUnreadCount(socket, notConnectedStudentIds);
    
    console.log(`Message broadcasted and saved in room ${socket.roomId}:`, message);
    return message;
  }

  /**
   * Chat 모델을 활용하여 메시지 객체 생성
   */
  buildMessage(socket, data, timestamp) {
    return new Chat({
      chatroom_id: socket.roomId,
      student_id: socket.studentId,
      type: data.type || 'TALK',
      message: data.message || "",
      created_date: timestamp
    });
  }

  /**
   * 같은 방(roomId)에 있는 다른 클라이언트에 메시지 브로드캐스트 (송신자 제외)
   */
  broadcastMessage(socket, message, timestamp) {
    socket.to(socket.roomId.toString()).emit('message', {
      type: message.type,
      roomId: socket.roomId,
      userId: socket.studentId,
      tempId: message.tempId, // 필요 시 포함
      message: message.message,
      time: timestamp
    });
  }

  /**
   * 메시지를 DB에 저장한 후, 생성된 id를 Chat 객체에 반영
   */
  async persistMessage(message) {
    const chatId = await ChatRepository.save(message);
    message.id = chatId;
    return chatId;
  }

  /**
   * 채팅방의 마지막 메시지와 시간을 업데이트
   */
  async updateChatroomLastMessage(socket, message, timestamp) {
    const lastMessageContent = message.type === 'TALK' ? message.message : "사진을 보냈습니다";
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
   * 2. ChatMessage 생성 (type: IMAGE, message: imageUrl, tempId 포함)  
   * 3. DB 저장, 채팅방 업데이트, 실시간 브로드캐스트, unread_count 업데이트
   *
   * @param {string|number} roomId - 채팅방 ID
   * @param {object} userInfo - 인증된 사용자 정보 (예: { studentId: 사용자ID, ... })
   * @param {object} request - { file: Multer 파일 객체, tempId: 임시 ID }
   * @returns {Promise<object>} - 생성된 이미지 ChatMessage 객체
   */
  async chatUploadImage(roomId, userInfo, request) {
    const timestamp = getFormattedTimestamp();
    // S3에 이미지 업로드 후 이미지 URL 반환
    const imageUrl = await S3UploadService.uploadFile('/chats', request.file);
    console.log('Uploaded image URL:', imageUrl);
    
    // Chat 모델을 활용하여 이미지 메시지 객체 생성 (tempId 포함)
    const chatData = {
      chatroom_id: roomId,
      student_id: userInfo.studentId,
      type: 'IMAGE',
      message: imageUrl,
      created_date: timestamp,
      tempId: request.tempId
    };
    const chatMessage = new Chat(chatData);
    
    // DB에 이미지 메시지 저장 및 생성된 id 반영
    const chatId = await ChatRepository.save(chatMessage);
    chatMessage.id = chatId;
    console.log('chatId', chatId);
    
    // 채팅방의 마지막 메시지 업데이트 ("사진을 보냈습니다")
    await ChatroomRepository.updateLastMessage(roomId, "사진을 보냈습니다", timestamp);
    
    // HTTP를 통한 이미지 업로드의 경우, 소켓 연결이 없으므로 lazy require를 통해
    // 순환 참조 문제를 피하면서 chatNamespace를 가져오고,
    // 연결된 소켓 중 sender(studentId 일치하는 경우)를 제외하고 브로드캐스트합니다.
    const chatNamespace = require("../socket/socketServer");
    const payload = {
      type: chatMessage.type,
      roomId: roomId,
      userId: userInfo.studentId,
      tempId: chatMessage.tempId,
      message: chatMessage.message,
      time: timestamp
    };

    try {
      const sockets = await chatNamespace.in(roomId.toString()).fetchSockets();
      sockets.forEach(socket => {
        if (socket.studentId !== userInfo.studentId) {
          socket.emit('message', payload);
        }
      });
    } catch (err) {
      console.error("Error broadcasting image message:", err);
    }
    
    // 연결된 학생들과 DB의 전체 학생 목록을 이용하여, 연결되지 않은 학생들(not connected)을 구합니다.
    const connectedStudentIds = await this.getConnectedStudentIds(chatNamespace, roomId);
    console.log('Connected student IDs:', connectedStudentIds);
    const allStudentIds = await ChatroomStudentRepository.getAllStudentIds(roomId);
    const uniqueAllStudentIds = [...new Set(allStudentIds)];
    const notConnectedStudentIds = uniqueAllStudentIds.filter(
      id => id !== userInfo.studentId && !connectedStudentIds.includes(id)
    );
    console.log('Students not connected in room:', notConnectedStudentIds);
    await this.updateUnreadCount({ roomId: roomId, studentId: userInfo.studentId }, notConnectedStudentIds);
    
    console.log(`Image message created for room ${roomId}:`, chatMessage);
    return chatMessage;
  }
}

module.exports = new ChatService();

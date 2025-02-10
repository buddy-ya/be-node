class Chatroom {
    /**
     * @param {object} data - 채팅방 데이터
     * @param {number} data.id - 채팅방 ID
     * @param {string} data.last_message - 마지막 메시지 내용
     * @param {Date|string} data.last_message_time - 마지막 메시지 전송 시간
     * @param {Date|string} data.created_date - 채팅방 생성 시간
     */
    constructor(data) {
      this.id = data.id;
      this.lastMessage = data.last_message;
      this.lastMessageTime = data.last_message_time;
      this.createdDate = data.created_date;
    }
  }
  
  module.exports = Chatroom;
  
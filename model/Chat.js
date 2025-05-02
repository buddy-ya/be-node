class Chat {
    /**
     * @param {object} data - 채팅 데이터
     * @param {number} data.id - 채팅 ID
     * @param {number} data.chatroom_id - 채팅방 ID
     * @param {number} data.student_id - 발신자(학생) ID
     * @param {string} data.type - 메시지 타입 ("TALK", "ENTER" 등)
     * @param {string} data.message - 채팅 메시지 내용
     * @param {Date|string} data.created_date - 채팅 생성 시간
     */
    constructor(data) {
      this.id = data.id;
      this.chatroomId = data.chatroom_id;
      this.studentId = data.student_id;
      this.type = data.type;
      this.message = data.message;
      this.createdDate = data.created_date; 
    }
  }
  
  module.exports = Chat;
  
class ChatroomStudent {
    /**
     * @param {object} data - 채팅방-사용자 데이터
     * @param {number} data.id - 해당 기록 ID
     * @param {number} data.student_id - 사용자(학생) ID
     * @param {number} data.chatroom_id - 채팅방 ID
     * @param {number} data.unread_count - 읽지 않은 메시지 수
     * @param {boolean|number} data.exited - 사용자가 채팅방을 나갔는지 여부 (예: 0,1 또는 false,true)
     */
    constructor(data) {
      this.id = data.id;
      this.studentId = data.student_id;
      this.chatroomId = data.chatroom_id;
      this.unreadCount = data.unread_count;
      this.exited = data.exited;
    }
  }
  
  module.exports = ChatroomStudent;
  
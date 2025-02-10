// repository/ChatroomRepository.js
const db = require('../config/dbConfig'); // MySQL 연결 풀

class ChatroomRepository {
  /**
   * 주어진 채팅방(roomId)의 마지막 메시지와 마지막 메시지 시간을 업데이트합니다.
   * @param {number} roomId 
   * @param {string} lastMessage 
   * @param {string} lastMessageTime - MySQL DATETIME 형식 (YYYY-MM-DD HH:MM:SS)
   */
  async updateLastMessage(roomId, lastMessage, lastMessageTime) {
    const query = `
      UPDATE chatroom 
      SET last_message = ?, last_message_time = ?
      WHERE id = ?
    `;
    const params = [lastMessage, lastMessageTime, roomId];
    await db.execute(query, params);
  }
}

module.exports = new ChatroomRepository();

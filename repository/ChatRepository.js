// repository/ChatRepository.js
const db = require('../config/dbConfig'); // mysql2/promise 연결 풀

class ChatRepository {
  /**
   * 채팅 메시지를 DB에 저장합니다.
   * @param {object} chat - { chatroomId, studentId, type, message, createdDate }
   * @returns {Promise<number>} - insertId
   */
  async save(chat) {
    const query = `
      INSERT INTO chat (chatroom_id, student_id, type, message, created_date)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [chat.chatroomId, chat.studentId, chat.type, chat.message, chat.createdDate];
    const [result] = await db.execute(query, params);
    return result.insertId;
  }
}

module.exports = new ChatRepository();

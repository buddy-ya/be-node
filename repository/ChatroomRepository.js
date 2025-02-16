// repository/ChatroomRepository.js
const db = require('../config/dbConfig');

class ChatroomRepository {
  /**
   * 채팅방 ID로 채팅방 정보를 조회합니다.
   * @param {number|string} roomId
   * @returns {Promise<object|null>} - 채팅방 데이터 또는 null
   */
  async findById(roomId) {
    const query = `SELECT * FROM chatroom WHERE id = ?`;
    const [rows] = await db.execute(query, [roomId]);
    return rows[0] || null;
  }

  /**
   * 채팅방의 마지막 메시지 및 시간을 업데이트합니다.
   * @param {number|string} roomId
   * @param {string} lastMessage - 업데이트할 마지막 메시지 내용
   * @param {string} lastMessageTime - MySQL DATETIME 형식 타임스탬프
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

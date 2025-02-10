// repository/ChatroomStudentRepository.js
const db = require('../config/dbConfig');

class ChatroomStudentRepository {
  /**
   * 지정된 채팅방에서 발신자(senderId)를 제외하고, 
   * 연결되어 있지 않은 (즉, 메시지를 읽고 있지 않은) 사용자들의 읽지 않은 메시지 수를 증가시킵니다.
   * @param {number} roomId 
   * @param {number} senderId 
   * @param {Array<number>} connectedStudentIds - 현재 해당 방에 연결된 학생 ID 목록
   */
  async updateUnreadCount(roomId, senderId, connectedStudentIds = []) {
    let query = `
      UPDATE chatroom_student
      SET unread_count = unread_count + 1
      WHERE chatroom_id = ? 
        AND student_id <> ?
    `;
    let params = [roomId, senderId];

    if (connectedStudentIds.length > 0) {
      const placeholders = connectedStudentIds.map(() => '?').join(', ');
      query += ` AND student_id NOT IN (${placeholders})`;
      params = params.concat(connectedStudentIds);
    }
    
    await db.execute(query, params);
  }

    /**
   * 해당 채팅방에 속한 모든 학생 ID를 조회합니다.
   * @param {number} roomId 
   * @returns {Promise<Array<number>>} 전체 학생 ID 배열
   */
    async getAllStudentIds(roomId) {
      const query = `SELECT student_id FROM chatroom_student WHERE chatroom_id = ?`;
      const [rows] = await db.execute(query, [roomId]);
      return rows.map(row => row.student_id);
    }
}

module.exports = new ChatroomStudentRepository();

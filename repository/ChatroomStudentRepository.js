// repository/ChatroomStudentRepository.js
const db = require('../config/db');

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
   * 채팅방의 발신자(senderId)를 제외한 수신자(receiverId) 조회
   * @param {number} roomId
   * @param {number} senderId
   * @returns {Promise<number|null>} - 수신자의 studentId 반환 (없으면 null)
   */
//   student_id <> ?
// → student_id가 senderId와 다른 사용자만 선택 (즉, 보낸 사람 제외)
  async findReceiverId(roomId, senderId) {
    const query = `
      SELECT student_id FROM chatroom_student
      WHERE chatroom_id = ? AND student_id <> ?
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [roomId, senderId]);

    return rows.length > 0 ? rows[0].student_id : null;
  }
}

module.exports = new ChatroomStudentRepository();

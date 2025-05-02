// repository/ChatroomStudentRepository.js
const db = require('../config/dbConfig');

class ChatroomStudentRepository {

  /**
   * 채팅방-사용자 레코드의 exited 플래그를 true로 업데이트합니다.
   * @param {number|string} recordId 
   */
    async updateExited(recordId) {
      const query = `UPDATE chatroom_student SET exited = ? WHERE id = ?`;
      await db.execute(query, [true, recordId]);
    }

  /**
   * 지정된 채팅방에 속한 모든 학생 ID를 조회합니다.
   * @param {number|string} roomId 
   * @returns {Promise<Array<number>>} 전체 학생 ID 배열
   */
  async getAllStudentIds(roomId) {
    const query = `SELECT student_id FROM chatroom_student WHERE chatroom_id = ?`;
    const [rows] = await db.execute(query, [roomId]);
    return rows.map(row => row.student_id);
  }

  /**
   * 채팅방과 학생 ID로 해당 채팅방-사용자 레코드를 조회합니다.
   * @param {number|string} roomId 
   * @param {number|string} studentId 
   * @returns {Promise<object|null>} - 레코드 데이터 또는 null
   */
  async findByChatroomAndStudentId(roomId, studentId) {
    const query = `SELECT * FROM chatroom_student WHERE chatroom_id = ? AND student_id = ?`;
    const [rows] = await db.execute(query, [roomId, studentId]);
    return rows[0] || null;
  }

  /**
   * 채팅방-사용자 레코드의 exited 플래그를 true로 업데이트합니다.
   * @param {number|string} recordId 
   */
  async updateExited(recordId) {
    const query = `UPDATE chatroom_student SET exited = ? WHERE id = ?`;
    await db.execute(query, [true, recordId]);
  }

  /**
   * 연결되지 않은 학생들의 unread_count를 업데이트합니다.
   * @param {number|string} roomId 
   * @param {number|string} senderId 
   * @param {Array<number>} connectedStudentIds 
   */
  async updateUnreadCount(roomId, senderId, notConnectedStudentIds = []) {
    if (notConnectedStudentIds.length === 0) return;
    const placeholders = notConnectedStudentIds.map(() => '?').join(', ');
    const query = `
      UPDATE chatroom_student
      SET unread_count = unread_count + 1
      WHERE chatroom_id = ? 
        AND student_id IN (${placeholders})
    `;
    const params = [roomId, ...notConnectedStudentIds];
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

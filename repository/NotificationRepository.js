const db = require('../config/db');

class NotificationRepository {
    /**
     * studentId로 ExpoToken 조회
     * @param {number} studentId
     * @returns {Promise<string|null>} - Expo 푸시 토큰 반환 (없으면 null)
     */
    async getExpoTokenByStudentId(studentId) {
        const query = `SELECT token FROM expo_token WHERE student_id = ? LIMIT 1`;
        const [rows] = await db.execute(query, [studentId]);

        return rows.length > 0 ? rows[0].token : null;
    }
}

module.exports = new NotificationRepository();

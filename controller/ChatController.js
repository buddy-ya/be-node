// controllers/ChatController.js
const ChatService = require('../service/ChatService');

class ChatController {
  // 채팅방 이미지 업로드 처리
  async uploadImages(req, res, next) {
    try {
      const roomId = req.params.roomId;
      const tempId = req.body.tempId;
      const file = req.file; 

      const userInfo = req.decoded; // 인증 미들웨어에서 설정된 사용자 정보
      if (!userInfo) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const chat = await ChatService.chatUploadImage(roomId, userInfo, { file, tempId });
      return res.status(200).json({
        status: 'success',
        chat
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();

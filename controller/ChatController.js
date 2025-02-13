// controllers/ChatController.js
const ChatService = require('../service/ChatService');

class ChatController {
  // 채팅방 이미지 업로드 처리
  async uploadImages(req, res, next) {
    try {
      const roomId = req.params.roomId;
      const tempId = req.body.tempId;
      const file = req.file; // Multer가 파싱한 파일 객체

      if (!file) {
        return res.status(400).json({ message: 'No file uploaded.' });
      }

      const userInfo = req.decoded; // 인증 미들웨어에서 설정된 사용자 정보
      if (!userInfo) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const chatMessage = await ChatService.chatUploadImage(roomId, userInfo, { file, tempId });
      return res.status(200).json({
        message: 'Image uploaded and broadcasted successfully',
        chatMessage: chatMessage
      });
    } catch (error) {
      next(error);
    }
  }

  // 채팅방 나가기 처리
  async leaveChatroom(req, res, next) {
    try {
      const roomId = req.params.roomId;
      const userInfo = req.user; // 인증 미들웨어에서 설정된 사용자 정보

      if (!userInfo) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const result = await ChatService.leaveChatroom(roomId, userInfo);
      return res.status(200).json({ message: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();

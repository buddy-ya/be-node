// controllers/ChatController.js
const ChatService = require('../service/ChatService');

/**
 * 채팅방 이미지 업로드 컨트롤러
 * - PathVariable: roomId
 * - FormData: image 파일과 tempId (추가 필드)
 * - 인증된 사용자 정보는 req.user에 있다고 가정합니다.
 */
async function uploadImages(req, res, next) {
  try {
    const roomId = req.params.roomId;
    const tempId = req.body.tempId;
    const file = req.file; // Multer가 파싱한 파일 객체

    // if (!file) {
    //   return res.status(400).json({ message: 'No file uploaded.' });
    // }

    // // 인증된 사용자 정보 (예: { id: 사용자ID, ... })
    const userInfo = req.user;
    // if (!userInfo) {
    //   return res.status(401).json({ message: 'Unauthorized' });
    // }
    
    // ChatService의 이미지 전송 처리 함수 호출
    const chatMessage = await ChatService.chatUploadImage(roomId, userInfo, { file, tempId });
    
    res.status(200).json({
      message: 'Image uploaded and broadcasted successfully',
      chatMessage: chatMessage
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadImages
};

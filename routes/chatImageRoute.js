const express = require('express');
const multer = require('multer');
const router = express.Router();
const S3UploadService = require('../service/S3UploadService');

// multer 메모리 스토리지 사용: 파일이 메모리에 버퍼 형태로 저장됩니다.
const upload = multer({ storage: multer.memoryStorage() });

// POST /node/chat/:roomId/image
// 프론트엔드는 FormData를 사용하여 "image" 필드에 파일과 추가 필드(tempId 등)를 보냅니다.
router.post('/:roomId/image', upload.single('image'), async (req, res, next) => {
  try {
    const roomId = req.params.roomId;
    const tempId = req.body.tempId;
    // 업로드할 디렉터리: 여기서는 "/chats"를 사용 (필요에 따라 S3DirectoryName과 유사한 구조로 확장 가능)
    const imageUrl = await S3UploadService.uploadFile('/chats', req.file);

    res.json({ 
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      roomId: roomId,
      tempId: tempId
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

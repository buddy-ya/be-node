// routes/chatRoute.js
const express = require("express");
const multer = require("multer");
const router = express.Router();
const ChatController = require("../controller/ChatController");

// Multer 미들웨어: 메모리 스토리지를 사용해 파일을 버퍼 형태로 저장
const upload = multer({ storage: multer.memoryStorage() });

/**
 * 이미지 업로드 엔드포인트
 * URL 예시: POST /node/chat/:roomId/image
 * 클라이언트는 FormData로 "image" 필드에 파일과 "tempId" 등을 전송합니다.
 */

console.log("채팅방 이미지 호출!");

router.post(
  "/:roomId/image",
  upload.single("image"),
  ChatController.uploadImages
);
module.exports = router;

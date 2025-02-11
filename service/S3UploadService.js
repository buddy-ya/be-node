// service/S3UploadService.js
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require('../config/s3Config');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();

const bucketName = process.env.CLOUD_AWS_S3_BUCKET;  
const defaultUrl = process.env.CLOUD_AWS_S3_URL;       

/**
 * 파일 업로드 함수
 * @param {string} dir - 업로드할 디렉터리 (예: "/chats")
 * @param {object} file - 업로드할 파일 객체 (예: multer에서 전달되는 객체)
 * @returns {Promise<string>} - 업로드된 파일의 URL
 */
async function uploadFile(dir, file) {
  try {
    const fileName = generateFileName(file);
    const key = `${dir}/${fileName}`.replace('//', '/');
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: 'inline',
      ContentLength: file.size,
    });
    
    await s3Client.send(command);
    return `${defaultUrl}${key}`;
  } catch (error) {
    throw new Error(`File upload error: ${error.message}`);
  }
}

/**
 * 파일 삭제 함수
 * @param {string} dir - 파일이 저장된 디렉터리 (예: "/chats")
 * @param {string} fileUrl - 삭제할 파일의 URL
 * @returns {Promise<void>}
 */
async function deleteFile(dir, fileUrl) {
  const fileName = extractFileName(fileUrl);
  const key = `${dir}/${fileName}`.replace('//', '/');
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  await s3Client.send(command);
}

/**
 * 파일 이름 생성 함수
 * @param {object} file - 업로드할 파일 객체
 * @returns {string} - 생성된 파일 이름 (UUID + '-' + 원본 파일명, 공백 및 쉼표는 "_"로 대체)
 */
function generateFileName(file) {
  const fileName = `${uuidv4()}-${file.originalname}`;
  return fileName.replace(/[\s,]/g, '_');
}

/**
 * 파일 URL에서 파일 이름 추출 함수
 * @param {string} fileUrl 
 * @returns {string} - 파일 이름
 */
function extractFileName(fileUrl) {
  return fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
}

module.exports = {
  uploadFile,
  deleteFile
};

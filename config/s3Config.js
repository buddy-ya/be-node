// config/s3Config.js
const { S3Client } = require("@aws-sdk/client-s3");
const dotenv = require('dotenv');
dotenv.config();

const region = process.env.CLOUD_AWS_REGION_STATIC;
const accessKey = process.env.CLOUD_AWS_CREDENTIALS_ACCESS_KEY;
const secretKey = process.env.CLOUD_AWS_CREDENTIALS_SECRET_KEY;

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  }
});

module.exports = s3Client;

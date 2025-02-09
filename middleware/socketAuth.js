/**
 * @file SocketAuth.js
 * @description Socket.IO 핸드쉐이크 단계에서 JWT 토큰을 검증하는 미들웨어.
 */
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt'); // JWT_SECRET이 base64로 인코딩된 문자열이라고 가정
const TokenError = require('../common/exception/TokenError');
const TokenErrorType = require('../common/exception/TokenErrorType');

class SocketAuth {
  verify(socket, next) {
    let token = socket.handshake.headers.authorization;
    
    if (!token) {
      return next(new TokenError(TokenErrorType.EMPTY_CLAIMS));
    }
    
    // Bearer 접두사가 있다면 제거
    if (token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    }
    token = token.trim();
    
    
    try {
      // Base64로 인코딩된 JWT_SECRET을 Buffer로 변환하여 사용
      const secretKey = Buffer.from(JWT_SECRET, 'base64');
      const decoded = jwt.verify(token, secretKey, { algorithms: ['HS256'] });
       // 검증 성공 후 decoded 값을 socket 객체에 저장
      socket.decoded = decoded;
      return next();
    } catch (error) {      
      // JWT 토큰 관련 오류에 따라 적절한 TokenError를 생성합니다.
      if (error.name === 'TokenExpiredError') {
        return next(new TokenError(TokenErrorType.EXPIRED_TOKEN));
      } else if (error.name === 'JsonWebTokenError') {
        return next(new TokenError(TokenErrorType.INVALID_TOKEN));
      } else {
        // 그 외의 에러는 기본적으로 INVALID_TOKEN 처리
        return next(new TokenError(TokenErrorType.INVALID_TOKEN));
      }
    }
  }
}

module.exports = new SocketAuth();

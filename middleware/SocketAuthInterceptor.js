/**
 * @file SocketAuthInterceptor.js
 * @description Socket.IO 핸드셰이크 단계에서 JWT 토큰 검증 미들웨어 (Step 1).
 */
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwtConfig'); // JWT_SECRET은 Base64로 인코딩된 문자열이라고 가정

const TokenError = require('../common/exception/TokenError');
const TokenErrorType = require('../common/exception/TokenErrorType');

class SocketAuthInterceptor {
  /**
   * Socket.IO 핸드셰이크 단계에서 JWT 토큰을 검증하고,
   * 사용자 ID(studentId)를 헤더에서 추출한 토큰을 이용해 확인합니다.
   *
   * @param {object} socket - Socket.IO 소켓 객체
   * @param {function} next - 다음 미들웨어로 전달하는 콜백 함수
   */
  verify(socket, next) {
    let token = socket.handshake.headers.authorization;
    // 토큰이 없으면 에러 반환
    if (!token) {
      return next(new TokenError(TokenErrorType.EMPTY_CLAIMS));
    }
    
    // "Bearer " 접두어가 있으면 제거
    if (token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    }
    token = token.trim();
    
    try {
      // Base64로 인코딩된 JWT_SECRET을 Buffer로 변환
      const secretKey = Buffer.from(JWT_SECRET, 'base64');
      
      // JWT 토큰 검증 (알고리즘 HS256 사용)
      const decoded = jwt.verify(token, secretKey, { algorithms: ['HS256'] });
      const studentId = decoded.studentId;
      
      // roomId 관련 코드는 제거 (이제 payload에서 전달됨)
      socket.decoded = decoded;
      socket.studentId = studentId;
      
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new TokenError(TokenErrorType.EXPIRED_TOKEN));
      }
      return next(new TokenError(TokenErrorType.INVALID_TOKEN));
    }
  }
}

module.exports = new SocketAuthInterceptor();

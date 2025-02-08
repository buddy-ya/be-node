const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

class SocketAuth {
  /**
   * Socket.IO 핸드쉐이크 단계에서 JWT 토큰을 검증하고,
   * 디코드된 객체에서 userId 필드를 콘솔에 출력합니다.
   *
   * @param {object} socket - Socket.IO 소켓 객체
   * @param {function} next - 다음 미들웨어로 전달하는 콜백 함수
   */
  verify(socket, next) {
    let token = socket.handshake.headers.authorization;
    if (!token) {
      console.error('[SocketAuth] No token provided');
      return next(new Error('Authentication error: No token provided'));
    }
    
    // Bearer 접두사가 있다면 제거
    if (token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    }
    token = token.trim();

    console.info('[SocketAuth] Received token:', token);
    try {
      // Base64로 인코딩된 JWT_SECRET을 Buffer로 변환하여 사용
      const secretKey = Buffer.from(JWT_SECRET, 'base64');
      const decoded = jwt.verify(token, secretKey, { algorithms: ['HS256'] });
      console.info('[SocketAuth] Decoded token:', decoded);
      console.info('[SocketAuth] userId:', decoded.userId);
      
      // 검증 성공 후 decoded 값을 socket 객체에 저장
      socket.decoded = decoded;
      
      return next();
    } catch (error) {
      console.error('[SocketAuth] Error verifying token:', error);
      return next(new Error('Authentication error: ' + error.message));
    }
  }
}

module.exports = new SocketAuth();

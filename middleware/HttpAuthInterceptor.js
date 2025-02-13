const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwtConfig'); // JWT_SECRET은 Base64 인코딩된 문자열
const TokenError = require('../common/exception/TokenError');
const TokenErrorType = require('../common/exception/TokenErrorType');

/**
 * HTTP 요청에 대한 JWT 토큰 검증 미들웨어.
 * 요청 헤더의 Authorization 값을 확인하여 JWT를 검증하고,
 * 성공 시 req.user에 디코딩된 토큰 정보를 저장합니다.
 *
 * 사용 예:
 *   app.use('/node/someApi', httpAuthInterceptor, someApiRouter);
 */
function httpAuthInterceptor(req, res, next) {
  let token = req.headers.authorization;
  
  // 토큰이 없으면 에러 반환
  if (!token) {
    return next(new TokenError(TokenErrorType.EMPTY_CLAIMS));
  }
  
  // "Bearer " 접두어 제거
  if (token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }
  token = token.trim();
  
  try {
    // Base64로 인코딩된 JWT_SECRET을 Buffer로 변환
    const secretKey = Buffer.from(JWT_SECRET, 'base64');
    // JWT 검증 (알고리즘 HS256 사용)
    const decoded = jwt.verify(token, secretKey, { algorithms: ['HS256'] });
    // 검증 성공 시, 디코딩된 토큰 정보를 req.user에 저장
    req.decoded = decoded;
    req.studentId = decoded.studentId;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new TokenError(TokenErrorType.EXPIRED_TOKEN));
    } else if (error.name === 'JsonWebTokenError') {
      return next(new TokenError(TokenErrorType.INVALID_TOKEN));
    } else {
      return next(new TokenError(TokenErrorType.INVALID_TOKEN));
    }
  }
}

module.exports = httpAuthInterceptor;

/**
 * @file TokenErrorType.js
 * @description 토큰 관련 에러 타입 정의.
 */

const TokenErrorType = {
    INVALID_TOKEN: {
      errorCode: 3000,
      httpStatus: 401, // UNAUTHORIZED
      errorMessage: "유효하지 않은 토큰입니다."
    },
    UNSUPPORTED_TOKEN: {
      errorCode: 3000,
      httpStatus: 400, // BAD_REQUEST
      errorMessage: "지원되지 않는 토큰입니다."
    },
    EMPTY_CLAIMS: {
      errorCode: 3000,
      httpStatus: 400, // BAD_REQUEST
      errorMessage: "빈 토큰값입니다."
    },
    ACCESS_DENIED: {
      errorCode: 3000,
      httpStatus: 403, // FORBIDDEN
      errorMessage: "접근 권한이 없습니다."
    },
    UNAUTHORIZED_USER: {
      errorCode: 3001,
      httpStatus: 401, // UNAUTHORIZED
      errorMessage: "인가되지 않은 사용자입니다."
    },
    EXPIRED_TOKEN: {
      errorCode: 3002,
      httpStatus: 401, // UNAUTHORIZED
      errorMessage: "만료된 토큰입니다."
    },
    INVALID_MEMBER_ID: {
      errorCode: 3003,
      httpStatus: 400, // BAD_REQUEST
      errorMessage: "유효하지 않은 사용자 ID 타입입니다."
    },
    REFRESH_TOKEN_NOT_FOUND: {
      errorCode: 3005,
      httpStatus: 404, // NOT_FOUND
      errorMessage: "리프레시 토큰을 찾을 수 없습니다."
    },
    INVALID_REFRESH_TOKEN: {
      errorCode: 3005,
      httpStatus: 401, // UNAUTHORIZED
      errorMessage: "유효하지 않은 리프레시 토큰입니다."
    }
  };
  
  module.exports = TokenErrorType;
  
/**
 * @file TokenError.js
 * @description 토큰 관련 에러를 위한 BaseError 확장 클래스.
 */
const BaseError = require('./BaseError');
const TokenErrorType = require('./TokenErrorType');

class TokenError extends BaseError {
  /**
   * @param {Object} errorType - TokenErrorType 객체 (errorCode, httpStatus, errorMessage)
   */
  constructor(errorType) {
    super(errorType.httpStatus, errorType.errorCode, errorType.errorMessage);
  }
}

module.exports = TokenError;

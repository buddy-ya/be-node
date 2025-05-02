/**
 * @file BaseError.js
 * @description 애플리케이션 전반에서 사용될 커스텀 에러의 기본 클래스.
 */

class BaseError extends Error {
    /**
     * 새로운 BaseError 인스턴스를 생성합니다.
     *
     * @param {number} status - HTTP 상태 코드 (예: 404, 500 등)
     * @param {number} errorCode - 애플리케이션 전용 에러 코드
     * @param {string} message - 에러 메시지
     */
    constructor(status, errorCode, message) {
      super(message);
      this.name = this.constructor.name;
      this.status = status;
      this.errorCode = errorCode;
      // 현재 에러 생성 시점부터 스택 트레이스 기록 (실제 에러 발생 위치 추적에 유용)
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  module.exports = BaseError;
  
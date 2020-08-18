import { ICircuitInfo, Status } from './definitions/circuit';

class Circuit {
  static defaultOption = {
    timeout: 2000,
    resetTime: 20000,
    timeoutCountThreshold: 10,
  }

  circuitOpen: boolean = false;
  circuitClose: boolean = true;
  circuitHalfOpen: boolean = false;
  timeoutCount: number = 0;
  option: ICircuitInfo;
  lastCallTime: number = 0;
  status: Status = Status.CLOSE;
  halfOpenSemaphore: number = 0;

  constructor(option: ICircuitInfo) {
    this.option = { ...Circuit.defaultOption, ...option };
  }

  openCircuitBreaker(): void {
    this.circuitOpen = true;
    this.circuitHalfOpen = false;
    this.circuitClose = false;
    this.status = Status.OPEN;
  }

  closeCircuitBreaker(): void {
    this.circuitOpen = false;
    this.circuitHalfOpen = false;
    this.circuitClose = true;
    this.status = Status.CLOSE;
  }

  healthCheck(): void {
    if (this.circuitOpen && (+new Date - this.lastCallTime) > this.option.resetTime) {
      this.circuitOpen = false;
      this.circuitHalfOpen = true;
      this.circuitClose = false;
      this.status = Status.HALF_OPEN;
    }
  }

  fire(excuteFallback, excuteAction) {
    // 检查断路器状态 是否需要半开
    this.healthCheck();
    // 
    console.log('circuit breaker status', this.status, 'semaphore', this.halfOpenSemaphore);
    if (this.circuitClose) {
      this.handleNormalRequest();
      excuteAction();
    } else if (this.circuitOpen || (this.circuitHalfOpen && this.halfOpenSemaphore > 0)) {
      excuteFallback();
    } else if (this.circuitHalfOpen && this.halfOpenSemaphore === 0) {
      this.halfOpenSemaphore++;
      this.handleNormalRequest();
      excuteAction();
    }
  }

  handleNormalRequest() {
    const startTime = +new Date();
    this.lastCallTime = startTime;
  }

  handleRquestResult(data) {
    const { startTime, success, fail } = data;
    const { timeout, timeoutCountThreshold } = this.option;
    if (this.circuitHalfOpen && this.halfOpenSemaphore > 0) {
      this.halfOpenSemaphore--;
    }
    const endTime = +new Date();
    const diff = endTime - startTime;
    if (diff > timeout) {
      this.timeoutCount++;
    } else {
      this.timeoutCount = 0;
      this.closeCircuitBreaker();
    }
    if (this.timeoutCount > timeoutCountThreshold) {
      this.openCircuitBreaker();
    }
  }
}

export = Circuit;

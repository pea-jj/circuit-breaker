import { ICircuitInfo, Status } from './definitions/circuit';

class Circuit {
  static defaultOption = {
    name: 'default circuit',
    timeout: 2000,
    resetTime: 20000,
    timeoutCountThreshold: 10,
    action: () => Promise.resolve(),
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
    // console.log('open')
    this.circuitOpen = true;
    this.circuitHalfOpen = false;
    this.circuitClose = false;
    this.status = Status.OPEN;
  }

  closeCircuitBreaker(): void {
    // console.log('close')
    this.circuitOpen = false;
    this.circuitHalfOpen = false;
    this.circuitClose = true;
    this.status = Status.CLOSE;
  }

  healthCheck(): void {
    if (this.circuitOpen && (+new Date - this.lastCallTime) > this.option.resetTime) {
      // console.log('half open')
      this.circuitOpen = false;
      this.circuitHalfOpen = true;
      this.circuitClose = false;
      this.status = Status.HALF_OPEN;
    }
  }

  async fire(...params) {
    // 检查断路器状态 是否需要半开
    this.healthCheck();
    // 
    console.log('circuit breaker status', this.status, 'semaphore', this.halfOpenSemaphore);
    if (this.circuitClose) {
      return this.handleNormalRequest(params);
    } else if (this.circuitOpen || (this.circuitHalfOpen && this.halfOpenSemaphore > 0)) {
      this.option.fallBack(...params);
    } else if (this.circuitHalfOpen && this.halfOpenSemaphore === 0) {
      this.halfOpenSemaphore ++;
      return this.handleNormalRequest(params);
    }
  }

  handleNormalRequest(params: any[]) {
    const { timeout, action } = this.option;
    const startTime = +new Date();
    
    this.lastCallTime = startTime;
    
    return action(...params)
    .then((res) => {
      return res;
    }).catch((e) => {
      throw(e);
    }).finally(() => {
      if (this.circuitHalfOpen && this.halfOpenSemaphore > 0) {
        this.halfOpenSemaphore --;
      }
      const endTime = +new Date();
      const diff = endTime - startTime;
      console.log('请求时间',diff)
      if (diff > timeout) {
        this.timeoutCount ++;
      } else {
        this.timeoutCount = 0;
        this.closeCircuitBreaker();
      }
      if (this.timeoutCount > this.option.timeoutCountThreshold) {
        this.openCircuitBreaker();
      }
    })
  }
}

const createCircuitFactory = (param) => {
  const c = new Circuit(param);
  return c.fire.bind(c);
};

export = { Circuit, createCircuitFactory};

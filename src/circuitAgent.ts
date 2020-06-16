import CircuitBreaker from './circuit-breaker';

class CircuitServer {

  circuitMap: Map<string, any>;

  constructor() {
    this.circuitMap = new Map();

    process.on("message", data => {
      if (data.from === 'appWorker') {
        this.receiveFromAppWorker(data);
      } else {
        this.receiveFromMaster(data);
      }
    })
  }

  sendToMaster(action: string) {
    if (process.send) {
      process.send({ action, to: 'master', from: 'circuitAgent' });
    }
  }

  sendToAppWorker(action, pid, data) {
    if (process.send) {
      process.send({ action, to: 'appWorker', pid, from: 'circuitAgent', data });
    }
  }

  receiveFromMaster(data) {

  }

  receiveFromAppWorker(data) {
    switch(data.action) {
      case 'register-circuit':
        this.registerCircuit(data);
        break;
      case 'fire':
        this.fireCircuit(data);
        break;
      case 'excute-over':
        this.excuteOver(data);
        break;
    }
  }

  registerCircuit(data) {
    const { data: option } = data;
    const { name } = option;
    if (!this.circuitMap.has(name)) {
      const circuit = new CircuitBreaker(option)
      this.circuitMap.set(name, {circuit});
    }
  }

  fireCircuit(data) {
    const { data: option, pid } = data;
    const { name, requestId } = option;
    if (this.circuitMap.has(name)) {
      const circuit = this.circuitMap.get(name).circuit;
      const param = { pid, name, requestId }
      circuit.fire(this.excuteFallback.bind(this, param), this.excuteAction.bind(this, param));
    }
  }

  excuteOver(data) {
    const { data: option } = data;
    const { name, ...other } = option;
    if (this.circuitMap.has(name)) {
      const circuit = this.circuitMap.get(name).circuit;
      circuit.handleRquestResult(other);
    }
  }

  excuteFallback(param) {
    const { pid, name, requestId } = param;
    this.sendToAppWorker('excute-fallback', pid, {
      name,
      requestId
    });
  }

  excuteAction(param) {
    const { pid, name, requestId } = param;
    this.sendToAppWorker('excute-action', pid, {
      name,
      requestId
    });
  }
}

const obj = new CircuitServer();
obj.sendToMaster('agent-start')
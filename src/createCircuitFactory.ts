import { ICircuitInfo, Status } from './definitions/circuit';
import { EventEmitter } from 'events';

class CircuitClient extends EventEmitter {
  options: ICircuitInfo;
  _id: number;

  constructor(options: ICircuitInfo) {
    super();
    this._id = 0;
    this.options = options;
    process.on("message", (data) => {
      if (data.from === 'master') {
        this.receiveFromMaster(data);
      } else {
        this.receiveFromCircuitAgentWorker(data);
      }
    })
  }

  sendToCircuitAgent(action, other) {
    const { name } = this.options;
    if (process.send) {
      process.send({
        action,
        to: 'agent',
        from: 'appWorker',
        pid: process.pid,
        data: {
          name,
          ...other
        }
      })
    }
  }

  receiveFromMaster(data) {

  }

  receiveFromCircuitAgentWorker(data) {
    const {data: option} = data;
    if (option.name !== this.options.name) {
      return;
    }
    this.emit(`${data.action}-${option.requestId}`, data.data);
  }

  addId() {
    this._id ++;
  }
}

const createCircuitFactory = (param) => {
  if (!param.name && typeof param.name !== 'string') {
    throw new Error('熔断器命名错误');
  }
  const client = new CircuitClient(param);
  client.sendToCircuitAgent('register-circuit', {
    name: param.name,
    timeout: param.timeout,
    resetTime: param.resetTime,
    timeoutCountThreshold: param.timeoutCountThreshold,
  });

  return async (ctx, next) => {
    await new Promise((resolve, reject) => {
      client.addId();
      client.sendToCircuitAgent('fire', {requestId: client._id});

      client.once(`excute-action-${client._id}`, () => {
        const startTime = +new Date();
        param.action(ctx, next)
          .then((res) => {
            client.sendToCircuitAgent('excute-over', {
              success: res,
              startTime,
            });
            return res;
          }).catch((e) => {
            client.sendToCircuitAgent('excute-over', {
              fail: e,
              startTime
            });
            throw (e);
          }).finally(() => {
            resolve();
          })
      })
      client.once(`excute-fallback-${client._id}`, () => {
        param.fallBack(ctx, next).finally(() => {
          resolve();
        })
      })
    })

  }
};

export = { createCircuitFactory };

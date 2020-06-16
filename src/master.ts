import { IClusterOption, IMessage } from './definitions/circuit';
import os from 'os';
import child_process from 'child_process';
import { EventEmitter } from 'events';

import path from 'path';
import cluster from 'cluster';

class Master extends EventEmitter {

  options: IClusterOption;
  circuitAgentWorker: child_process.ChildProcess | null;

  constructor(options: IClusterOption) {
    super();
    this.options = options;
    this.circuitAgentWorker = null;
    if (!cluster.isMaster) {
      return;
    }
    // process.on('message', (data) => {
    //   console.log('message in')
    //   this.emit(data.action, data.data);
    // });

    this.once('agent-start', () => {
      console.log('agent 启动成功');
      this.forkAppWorker();
    })
    this.forkCircuitAgentWorker();
  }

  forkCircuitAgentWorker() {
    const circuitAgentWorker = child_process.fork(path.join(__dirname, 'circuitAgent.js'));
    this.circuitAgentWorker = circuitAgentWorker;
    circuitAgentWorker.on('message', (data: IMessage) => {
      if (data.to === 'master') {
        this.emit(data.action, data.data);
      } else {
        for (const id in cluster.workers) {
          if (cluster.workers.hasOwnProperty(id)) {
            const worker = cluster.workers[id];
            if (worker && data.pid && worker.process.pid === data.pid) {
              worker.send(data);
            }
          }
        }
      }
    });
  }

  forkAppWorker() {
    cluster.setupMaster({
      exec: this.options.path,
    });
    for (let i = 0; i < os.cpus().length - 2; i++) {
      cluster.fork();
    };
    // 转发请求给agent
    cluster.on("message", (worker, data) => {
      if (this.circuitAgentWorker) {
        this.circuitAgentWorker.send(data);
      }
    });
    // cluster.on("fork", (worker) => {
    //   console.log('worker', worker.process.pid, worker.id)
    //   worker.on("message", (data) => {
    //     console.log(data, 'mmmm')
    //   })
    // })
  }


}

export = Master;

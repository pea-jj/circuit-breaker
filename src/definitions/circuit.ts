export interface ICircuitInfo {
  name: string;
  timeout: number;
  resetTime: number;
  timeoutCountThreshold: number;
  action(...param: any[]): Promise<any>;
  fallBack(...param: any[]): any;
}

export enum Status {
  CLOSE = "CLOSE",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export interface IClusterOption {
  path: string;
}

export interface IMessage {
  action: string;
  data?: any;
  from: string;
  to: string;
  pid?: number;
}

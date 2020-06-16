const Circuit = require('../dist/circuit');

const action = (param) => new Promise((resolve) => {
  setTimeout(resolve, param);
})
const fallBack = () => {console.log('fall back')}
const param = {
  name: 'test circuit',
  timeout: 2000,
  resetTime: 6000,
  timeoutCountThreshold: 2,
  action,
  fallBack,
}
const c = new Circuit(param);

c.fire(3000);
c.fire(3000);
c.fire(3000);

setTimeout(() => {
  c.fire(1000)
}, 4000)

setTimeout(() => {
  c.fire(1000)
}, 7000)

setTimeout(() => {
  c.fire(1000)
}, 8000)


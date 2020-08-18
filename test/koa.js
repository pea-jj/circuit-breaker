const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
const router = new Router();

const { createCircuitFactory } = require('../dist/circuit');

app.listen(3000)
app.use(router.routes())
console.log('启动成功')

const action = async (ctx) => {
  await new Promise(resolve => {
    setTimeout(() => {
      console.log('执行action');
      resolve();
    }, 3000)
  })
  ctx.body = 'hello world'
}

const fallBack = (ctx) => { 
  console.log('fall back'); 
  ctx.body = 'fall back';
}
const param = {
  name: 'test circuit',
  timeout: 2000,
  resetTime: 10000,
  timeoutCountThreshold: 2,
  action,
  fallBack,
}


const handleRoute = createCircuitFactory(param);

router.get('/', handleRoute)
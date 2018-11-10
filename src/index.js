const {serverConfig} = require('../config');

const Koa = require('koa');
const koaBodyparser = require('koa-bodyparser');
const koaStatic = require('koa-static');
const router = require('./router');



let app = new Koa();

app.use(koaBodyparser({
  enableTypes: ['json', 'form', 'text']
}));

app.use(koaStatic(__dirname + '/../www',  {
  maxAge: 1000 * 60 * 60 * 24 * 7,
  gzip: true,
}));

app.use(router.routes());


app.listen( serverConfig.port, function () {
  console.log(`server is running at port ${serverConfig.port}`);
});

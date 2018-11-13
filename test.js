/**
 * 开发时候测试用~~~~~~~~~~
 * **/

let Crawler = require('./src/crawlers/lianjia');
let c = new Crawler();

c.getDistrictSection('bj').then(function (v) {
  console.log(JSON.stringify(v));
});
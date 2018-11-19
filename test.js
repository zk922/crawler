const LianjiaCrawler = require('./src/crawlers/lianjia');

let c = new LianjiaCrawler();

c.getErshoufangDistrict('bj').then(v=>{
  console.log(JSON.stringify(v));
});
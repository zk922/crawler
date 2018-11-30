const LianjiaCrawler = require('./src/crawlers/lianjia');

let c = new LianjiaCrawler();

// c.getErshoufangDistrict('hf').then(v=>{
//   console.log(JSON.stringify(v));
// });

// c.getErshoufangSection('hf', 'baohe').then(v=>{
//   console.log(JSON.stringify(v));
// });

// c.getErshoufangSectionList('hf', 'baohe', 1).then(v=>{
//   console.log(JSON.stringify(v.data));
//   console.log(v.data.list.length);
// });
// c.getErshoufangDetail('bj', '101103624977').then(v=>{
//
// });
let i = 0;
c.getLoupanByCity('gz', v=>{
  i++
}).then(()=>{console.log(i)});
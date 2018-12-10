const LianjiaCrawler = require('./src/crawlers/lianjia');
const fs = require('fs');
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
// let i = 0;
// c.getLoupanByCity('gz', v=>{
//   if(v){
//     i++
//   }
// }).then(()=>{console.log(i)});
let ws = fs.createWriteStream('./gy.log', {flags: 'a'});
let i = 0;
c.getErshoufangByCity('gy', v=>{
  ws.write(JSON.stringify(v)+'/n');
  i++;
}).then(()=>{
  ws.end();
  console.log(i)
});
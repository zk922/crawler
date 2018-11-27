const LianjiaCrawler = require('../crawlers/lianjia');
const PassThrough = require('stream').PassThrough;

/**
 * 获取链家楼盘信息中间件
 * **/
module.exports = async function getLianjiaLoupan(ctx, next) {
  let c = new LianjiaCrawler();
  let v;

  let t = new PassThrough();
  ctx.body = t;
  //没有调度任务后，关闭流
  let timer;
  c.c.on('drain', function () {
    console.log('drain');
    timer = setTimeout(()=>{
      t.end('没有新的抓取请求，关闭链接');
      console.log('关闭')
    }, 10000);
  });
  c.c.on('schedule',function(){
    clearTimeout(timer);
  });


  try{
    v = await c.getLianjiaCities();
  }
  catch (e) {
    return e;
  }

  ctx.status = 200;
  ctx.type = 'text/plain; charset=utf-8';
  v.data.forEach(function (v, i, a){
    v.cities.forEach(async function (v, i, a){
      let sendData = `${v.cityName}(${v.alias}):      `;
      let total;
      try{
        total = (await c.getCityLoupanTotal(v.alias)).data.total;
      }
      catch (e) {
        console.log(`获取${v.cityName}新房数量失败   `, e);
      }

      console.log(`${v.cityName}(${v.alias})新房数量    `, total || 0);
      // console.log(v.cityName, total);
      if(!total){
        sendData += '共0套\n';
      }
      else{
        sendData += `共${total}套\n`;

        if(total <= 1000){
          for(let i=0; i*10<total; i++){
            let listData;
            try {
              listData = (await c.getCityLoupanPerpage(v.alias, i+1)).data;
            }
            catch (e) {
              return e;
            }
            console.log(`${v.cityName}(${v.alias})第${listData.page}页获取成功`);
            let str = `第${listData.page}页：\n`;
            listData.list.forEach(v=>{
              str += `   ${v.address}     ${v.show_price_info}\n`;
            });
            sendData += str;
          }
        }
        else if(total > 1000){
          let sections;
          let cityAlias = v.alias;
          let cityName = v.cityName;
          try{
            // console.log('超过1000000', cityAlias);
            sections = (await c.getDistrictSection(cityAlias)).data;
            // console.log('超过1000000', sections);
            // process.exit(111);
          }
          catch (e) {
            return e
          }
          for(let i=0; i<sections.district.length; i++){
            for(let j=0; j<sections.district[i].section.length; j++){
              await (async function (v) {
                let sectionTotal;
                try{
                  sectionTotal = (await c.getCityLoupanTotal(cityAlias, v.sectionAlias)).data.total;
                }
                catch (e) {
                  console.log(`获取${cityName} ${v.sectionName}新房数量失败   `, e);
                }

                console.log(`${cityName}(${cityAlias})  ${v.sectionName}新房数量    `, sectionTotal || 0);
                // console.log(v.cityName, total);
                if(!sectionTotal){
                  sendData += `  ${v.sectionName}（${v.sectionAlias}）新房数量  共0套\n`;
                }
                else {
                  sendData += `  ${v.sectionName}（${v.sectionAlias}）新房数量  共${sectionTotal}套\n`;
                  if(sectionTotal>0){
                    for(let i=0; i*10<sectionTotal; i++){
                      let listData;
                      try {
                        listData = (await c.getCityLoupanPerpage(cityAlias, i+1, v.sectionAlias)).data;
                      }
                      catch (e) {
                        return e;
                      }
                      let str = `第${listData.page}页：\n`;
                      listData.list.forEach(v=>{
                        str += `     ${v.address}     ${v.show_price_info}\n`;
                      });
                      sendData += str;
                    }
                  }
                }
              })(sections.district[i].section[j])
            }
          }
          sections.district.forEach(function (v, i, a) {

          })
        }
      }
      sendData += '--------------------------------------------------\n';
      t.write(sendData);
    })
  })
};
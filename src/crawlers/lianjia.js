const fs = require('fs');
const { cityUrl } = require('../urls/lianjiaUrl');
const createCrawler = require('./crawler');


/**
 * 获取链家城市列表
 * @return Promise <{result: number, msg: string}>
 * **/
function getLianjiaCities(){
  return new Promise(function (resolve, reject) {
    let c = createCrawler();
    //获取
    c.queue({
      uri: cityUrl,
      callback: function (error, res, done) {
        if(error){
          console.log(error);
          done();
          return;
        }
        let $ = res.$;
        let result = [];   //城市列表结果
        let provinceList = $('.city_list_ul .city_province');

        provinceList.each(function () {
          let provinceName = $('.city_list_tit', this).text();
          let cityList = $('a', this);
          let cityResult = [];

          cityList.each(function (){
            cityResult.push({
              cityName: $(this).text(),
              alias: $(this).attr('href').match(/^https:\/\/(\w+)\..+$/)[1]
            })
          });
          result.push({
            provinceName: provinceName,
            cities: cityResult
          })
        });

        console.log(JSON.stringify(result));
        done();
        resolve({result: 0, msg: '城市列表获取成功'});
      }
    });
  })
}
module.exports.getLianjiaCities = getLianjiaCities;


/**
 * 获取city的新楼盘
 * @param city: string      城市的简写别名，用来获取城市连接
 * **/
function getLoupan(city){
  let c = createCrawler();

  c.queue({//获取总数
    uri: `https://${city}.fang.lianjia.com/loupan/pg1/?_t=1`,
    jQuery: false,
    callback: function (error, res, done) {
      if(error){
        console.log(error);
        done();
        return;
      }
      let result = JSON.parse(res.body).data;

      let total = +(result.total);

      // console.log(total)
      let num = 0;
      //获取每一页数据详细数据
      for(let i=0; i*10<total; i++){
        // console.log(i)
        c.queue({
          uri: `https://${city}.fang.lianjia.com/loupan/pg${i+1}/?_t=1`,
          jQuery: false,
          callback: function (error, res, done) {
            if(error){
              console.log(error);
              done();
              return;
            }
            let page = JSON.parse(res.body).data;
            num += page.list.length;
            // console.log(i+1, num);
            done();
          }
        })
      }
    }
  });
}




//test
// getLianjiaCities();
getLoupan('bj');
const fs = require('fs');
const { cityUrl } = require('../urls/lianjiaUrl');
const createCrawler = require('./crawler');

/**
 * 获取链家城市列表
 * @return {Promise<{result: number, msg: string, data: *}>}
 * **/
function getLianjiaCities(){
  let _this = this;
  return new Promise(function (resolve, reject) {
    //获取
    _this.c.queue({
      uri: cityUrl,
      callback: function (error, res, done) {
        if(error){
          console.log(error);
          done();
          reject({result: 1, msg: '链家城市列表获取失败', data: error});
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

        // console.log(JSON.stringify(result));
        done();
        resolve({result: 0, msg: '城市列表获取成功', data: result});
      }
    });
  })
}

/**
 * 获取指定城市新楼盘的总数
 * 获取city的新楼盘total
 * @param {string} city    城市的简写别名，用来获取城市连接
 * @return {Promise<{result: number, msg: string, data: ?}>}
 * **/
function getCityLoupanTotal(city){
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({//获取总数
      uri: `https://${city}.fang.lianjia.com/loupan/pg1/?_t=1`,
      jQuery: false,
      callback: function (error, res, done) {
        if(error){
          // console.log(123, error);
          done();
          reject({msg: `获取${city}的楼盘总数失败`, result: 1, data: error});
          return;
        }


        if(res.statusCode !== 200){
          reject({msg: `获取${city}的楼盘总数失败, 请求可能重定向`, result: 2, data: error});
          done();
          return;
        }



        let result;
        try{
          result = JSON.parse(res.body).data;
        }
        catch (e) {
          reject({msg: `获取${city}的楼盘总数失败, 请求可能重定向`, result: 3, data: error});
          done();
          return;
        }
        let total = +(result.total);
        done();
        resolve({result: 0, msg: `获取${city}的楼盘总数${total}`, data: {total: total, city: city}});
      }
    });
  });
}

/**
 * 获取某一页房产数据
 * @description 链家限制显示只有3000个。新房数量不会过多，所以直接扒取就可以。二手房有的城市会有区域超过3000，需要分区域扒取
 * @param {string} city     城市的简写别名
 * @param {number} page     第几页，1开始
 * @return {Promise<{result: number, msg: string, data: ?}>}
 * **/
function getCityLoupanPerpage(city, page){
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({
      uri: `https://${city}.fang.lianjia.com/loupan/pg${page}/?_t=1`,
      jQuery: false,
      callback: function (error, res, done) {
        if(error){
          console.log(error);
          done();
          reject({msg: `获取${city}的第${page}页楼盘失败`, result: 1, data: error});
          return;
        }

        let list;
        if(page<=100){
          list = JSON.parse(res.body).data.list;
        }
        else{
          list = JSON.parse(res.body).data.no_result_resblocks;
        }
        resolve({result: 0, msg: `获取${city}的第${page}页楼盘成功`, data: {page: page, list: list, city: city}});
        done();
      }
    })
  });
}

/**
 * 导出的链家爬虫类
 * @constructor
 * **/
function LianjiaCrawler() {
  this.c = createCrawler()
}
LianjiaCrawler.prototype.getLianjiaCities = getLianjiaCities;

LianjiaCrawler.prototype.getCityLoupanTotal = getCityLoupanTotal;

LianjiaCrawler.prototype.getCityLoupanPerpage = getCityLoupanPerpage;

module.exports = LianjiaCrawler;



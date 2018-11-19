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
 * 获取指定城市新楼盘的总数,获取city的新楼盘total
 * @param {string} city    城市的简写别名，用来获取城市连接
 * @param {string=}section  区域
 * @return {Promise<{result: number, msg: string, data: ?}>}
 * **/
function getCityLoupanTotal(city, section=undefined){
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({//获取总数
      uri: `https://${city}.fang.lianjia.com/loupan${section ? '/' + section : ''}/pg1/?_t=1`,
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
 * 链家限制显示只有100页数据。有的城市会超过100页，需要分区域扒取
 * @param {string} city     城市的简写别名
 * @param {number} page     第几页，1开始
 * @param {string=} section  区域，可选
 * @return {Promise<{result: number, msg: string, data: ?}>}    响应成功后楼盘的信息
 * **/
function getCityLoupanPerpage(city, page, section=undefined){
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({
      uri: `https://${city}.fang.lianjia.com/loupan${section ? '/' + section : ''}/pg${page}/?_t=1`,
      jQuery: false,
      callback: function (error, res, done) {
        if(error){
          console.log(error);
          done();
          reject({msg: `获取${city}${section ? ' '+ section : ''}的第${page}页楼盘失败`, result: 1, data: error});
          return;
        }
        let list = JSON.parse(res.body).data.list;
        resolve({result: 0, msg: `获取${city}${section ? ' '+ section : ''}的第${page}页楼盘成功`, data: {page: page, list: list, city: city}});
        done();
      }
    })
  });
}

/**
 * 获取某个城市city的新房的行政分区+再细分区域
 * @description     仅需要在获取到某个城市新房房源超过100页时候调用，即超过1000个新房
 * @param {string} city       城市简写别名
 * @return {Promise<{
 *   result: number,
 *   msg: string,
 *   data: {
 *     city: string,
 *     district: Array<{
 *        districtName: string,
 *        districtAlias: string,
 *        section: {sectionName: string, sectionAlias: string}[]
 *     }>}
 *    }
 *  >}
 * **/
function getDistrictSection(city) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({
      uri: `https://${city}.fang.lianjia.com/loupan/`,
      callback: function (error, res, done) {
        if(error){
          console.log(error);
          done();
          reject({msg: `获取${city}的区域district失败`, result: 1, data: error});
          return;
        }
        let $ = res.$;
        let itemList = $('.district-item');
        let result = {
          city: city,
          district: []
        };
        itemList.each(function (i) {

          let districtDetail = {
            districtName: $(this).text(),
            districtAlias: $(this).attr('data-district-spell'),
            section: []
          };

          let sectionList = $(`.bizcircle-item[data-district-id="${$(this).attr('data-district-id')}"]`);
          sectionList.each(function (i) {
            districtDetail.section.push({
              sectionName: $('.bizcircle-item-name', this).text(),
              sectionAlias: $(this).attr('data-bizcircle-spell')
            });
          });

          result.district.push(districtDetail);
        });
        resolve({result: 0, msg: `获取${city}区域district成功`, data: result});
        done();
      }
    })
  });
}

/**
 * 获取城市city的大行政区域，东城区，西城区之类
 * @deprecated   可以直接用上面方法获取所有大小区域信息
 * @param {string}city  城市别名
 * @return {Promise<{
 *   result: number,
 *   msg: string,
 *   data: {
 *     city: string,
 *     district: Array<{
 *        districtName: string,
 *        districtAlias: string
 *     }>}
 *    }
 *  >}
 * **/
function getCityDistrict(city) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({
      uri: `https://${city}.fang.lianjia.com/loupan/`,
      callback: function (error, res, done) {
        if(error){
          console.log(error);
          done();
          reject({msg: `获取${city}的区域district失败`, result: 1, data: error});
          return;
        }
        let $ = res.$;
        let itemList = $('.district-item');
        let result = {
          city: city,
          district: []
        };
        itemList.each(function (i) {
          // console.log(this);
          result.district.push({
            districtName: $(this).text(),
            districtAlias: $(this).attr('data-district-spell')
          })
        });
        resolve({result: 0, msg: `获取${city}区域district成功`, data: result});
        done();
      }
    })
  });
}




/**
 * 获取链家二手房某个城市的分区列表
 * @param {string} city
 * @return {Promise<*>}
 * **/
function getErshoufangDistrict(city) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({
      uri: `https://${city}.lianjia.com/ershoufang/`,
      callback: function (error, res, done) {
        if(error){
          console.log(error);
          done();
          reject({msg: `获取${city}的区域district失败`, result: 1, data: error});
          return;
        }
        let $ = res.$;

        let result = {
          city: city,
          district: []
        };

        let eleList = $('.sub_nav.section_sub_nav a');
        eleList.each(function (i) {
          let district = {
            name: $(this).text(),
            alias: $(this).attr('href').split('/')[2]
          };
          result.district.push(district);
        });

        resolve({result: 0, msg: `获取${city}区域district成功`, data: result});
        done();
      }
    })
  });
}


/**
 * 获取链家二手房某个城市的分区列表
 * @param {string} city
 * @param {string} district
 * @return {Promise<*>}
 * **/
function getErshoufangSection(city, district) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({
      uri: `https://${city}.lianjia.com/ershoufang/${district}/`,
      callback: function (error, res, done) {
        if(error){
          console.log(error);
          done();
          reject({msg: `获取${city}  ${district}的sections失败`, result: 1, data: error});
          return;
        }
        let $ = res.$;

        let result = [];

        let eleList = $('.sub_sub_nav.section_sub_sub_nav a');
        eleList.each(function (i) {
          result.push({
            name: $(this).text(),
            alias: $(this).attr('href').split('/')[2]
          })
        });
        resolve({result: 0, msg: `获取${city}  ${district}的sections成功`, data: result});
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

LianjiaCrawler.prototype.getDistrictSection = getDistrictSection;



LianjiaCrawler.prototype.getErshoufangDistrict = getErshoufangDistrict;
LianjiaCrawler.prototype.getErshoufangSection = getErshoufangSection;

module.exports = LianjiaCrawler;

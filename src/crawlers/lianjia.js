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
        let parsedData = JSON.parse(res.body);
        let list = parsedData.data.list;
        let total = +(parsedData.data.total);
        resolve({result: 0, msg: `获取${city}${section ? ' '+ section : ''}的第${page}页楼盘成功`, data: {page: page, total: total, list: list, city: city}});
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

        let eleList = $('div[data-role="ershoufang"]>div:first-child a');
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

        let eleList = $('div[data-role="ershoufang"]>div:nth-child(2) a');
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
 * 获取某个城市city区域section第i页的房产列表
 * @param {string}city 城市
 * @param {string}section 区域
 * @param {string}page 第i页面
 * @return {Promise}
 * **/
function getErshoufangSectionList(city, section, page) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({
      uri: `https://${city}.lianjia.com/ershoufang/${section}/pg${page}`,
      callback: function (error, res, done) {
        if(error){
          console.log(error);
          done();
          reject({msg: `获取${city}  ${section} 第${page}页的信息失败`, result: 1, data: error});
          return;
        }
        let $ = res.$;

        let total = +($('h2.total span').text().trim());
        let result = [];
        let eleList = $('ul.sellListContent li.LOGCLICKDATA .info .title a');
        eleList.each(function (i) {
          let that = $(this);
          result.push({
            name: that.text(),
            id: that.attr('data-housecode'),
            href: that.attr('href')
          })
        });
        resolve({result: 0, msg: `获取${city}  ${section} 第${page}页的信息成功`, data: {
          total: total,
          page: page,
          list: result
        }});
        done();
      }
    })
  });
}
/**
 * 获取二手房详细信息
 * @param {string}city    城市别名alias
 * @param {string}id     房子id，唯一标识
 * @return {Promise}
 * **/
function getErshoufangDetail(city, id) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({
      uri: `https://${city}.lianjia.com/ershoufang/${id}.html`,
      callback: function (error, res, done) {
        if(error){
          console.log(error);
          done();
          reject({msg: `获取${city}  ${id}的信息失败`, result: 1, data: error});
          return;
        }
        let $ = res.$;
        let info = {};  //数据对象

        info.name = $('h1.main').text();  //name
        //总价
        info.price_total = $('.price .total').text();
        info.price_total_unit = $('.price .unit span').text();
        console.log(info.price_total, '   ', info.price_total_unit);
        //均价
        let averagePriceString = $('.unitPriceValue').text();
        info.price_average = averagePriceString.match(/\d+/)[0];
        info.price_average_unit = averagePriceString.match(/\d+(\D*)/)[1];
        console.log(info.price_average, '   ', info.price_average_unit);
        //小区
        let communityEle = $('.communityName a:first-of-type');
        info.community_name = communityEle.text();
        info.community_id = communityEle.attr('href').split('/')[2];
        console.log(info.community_name, '   ', info.community_id);
        //城区
        let districtEle = $('.areaName .info a:nth-child(1)');
        info.district_name = districtEle.text();
        info.district_alias = districtEle.attr('href').split('/')[2];
        console.log(info.district_name, '    ', info.district_alias);
        //地区
        let sectionEle = $('.areaName .info a:nth-child(2)');
        info.section_name = sectionEle.text();
        info.section_alias = sectionEle.attr('href').split('/')[2];
        console.log(info.section_name, '   ', info.section_alias);
        //详情信息
        let detailList = $('.introContent ul li');
        detailList.each(function(i){
          let str = $(this).text().trim();
          // console.log(str);
          switch (true) {
            case /.*房屋户型.*/.test(str):
              info.house_model = str.replace(/.*房屋户型\s*/, '');
              break;
            case /.*建筑面积.*/.test(str):
              str.replace(/.*建筑面积\s*(\d+\.?\d+)\s*(\S*)/, (m, m1, m2, s)=>{
                info.building_area = m1;
                info.building_area_unit = m2;
              });
              break;
            case /.*套内面积.*/.test(str):
              str.replace(/.*套内面积\s*(\d+\.?\d+)\s*(\S*)/, (m, m1, m2, s)=>{
                info.using_area = m1;
                info.using_area_unit = m2;
              });
              break;
            case /.*房屋朝向.*/.test(str):
              info.orientation = str.replace(/.*房屋朝向\s*/, '');
              break;
            case /.*装修情况.*/.test(str):
              info.decoration = str.replace(/.*装修情况\s*/, '');
              break;
            case /.*供暖方式.*/.test(str):
              info.heating = str.replace(/.*供暖方式\s*/, '');
              break;
            case /.*产权年限.*/.test(str):
              info.property_right_last = str.replace(/.*产权年限\s*/, '');
              break;
            case /.*所在楼层.*/.test(str):
              info.floor = str.replace(/.*所在楼层\s*/, '');
              break;
            case /.*户型结构.*/.test(str):
              info.hm_structure = str.replace(/.*户型结构\s*/, '');
              break;
            case /.*建筑类型.*/.test(str):
              info.building_type = str.replace(/.*建筑类型\s*/, '');
              break;
            case /.*建筑结构.*/.test(str):
              info.building_structure = str.replace(/.*建筑结构\s*/, '');
              break;
            case /.*梯户比例.*/.test(str):
              info.elevator_resident_ratio = str.replace(/.*梯户比例\s*/, '');
              break;
            case /.*配备电梯.*/.test(str):
              info.elevator = str.replace(/.*配备电梯\s*/, '');
              break;
            case /.*挂牌时间.*/.test(str):
              info.onsale_time = str.replace(/.*挂牌时间\s*/, '');
              break;
            case /.*上次交易.*/.test(str):
              info.last_sale = str.replace(/.*上次交易\s*/, '');
              break;
            case /.*交易权属.*/.test(str):
              info.sale_type = str.replace(/.*交易权属\s*/, '');
              break;
            case /.*房屋用途.*/.test(str):
              info.usage = str.replace(/.*房屋用途\s*/, '');
              break;
            case /.*房屋年限.*/.test(str):
              info.house_age_limit = str.replace(/.*房屋年限\s*/, '');
              break;
            case /.*产权所属.*/.test(str):
              info.roperty_ownership = str.replace(/.*产权所属\s*/, '');
              break;
            case /.*抵押信息.*/.test(str):
              info.mortgage = str.replace(/.*抵押信息\s*/, '');
              break;
          }
        });
        console.log(JSON.stringify(info));
        resolve({result: 0, msg: `获取${city}  ${id}的信息成功`, data: info});
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
LianjiaCrawler.prototype.getCityDistrict = getCityDistrict;

LianjiaCrawler.prototype.getErshoufangDistrict = getErshoufangDistrict;
LianjiaCrawler.prototype.getErshoufangSection = getErshoufangSection;
LianjiaCrawler.prototype.getErshoufangSectionList = getErshoufangSectionList;
LianjiaCrawler.prototype.getErshoufangDetail = getErshoufangDetail;

module.exports = LianjiaCrawler;

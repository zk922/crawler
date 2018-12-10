const { cityUrl } = require('../urls/lianjiaUrl');
const createCrawler = require('./crawler');
const logger = require('../log');
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
          logger.error(error);
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

        // logger.log(JSON.stringify(result));
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
 * @deprecated  获取某一页的数据可以获取到总数了
 * **/
function getLoupanTotal(city, section=undefined){
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({//获取总数
      uri: `https://${city}.fang.lianjia.com/loupan${section ? '/' + section : ''}/pg1/?_t=1`,
      jQuery: false,
      callback: function (error, res, done) {
        if(error){
          logger.error(error);
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
function getLoupanPerpage(city, page, section=undefined){
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({
      uri: `https://${city}.fang.lianjia.com/loupan${section ? '/' + section : ''}/pg${page}/?_t=1`,
      jQuery: false,
      callback: function (error, res, done) {
        if(error){
          logger.error(error);
          done();
          reject({msg: `获取${city}${section ? ' '+ section : ''}的第${page}页楼盘失败`, result: 1, data: error});
          return;
        }
        if(res.statusCode !== 200){
          reject({msg: `获取${city}的楼盘失败, 请求可能重定向`, result: 2, data: error});
          done();
          return;
        }
        let result;
        try{
          result = JSON.parse(res.body).data;
        }
        catch (e) {
          reject({msg: `获取${city}的楼盘失败, 请求可能重定向`, result: 3, data: error});
          done();
          return;
        }
        let list = result.list;
        let total = +(result.total);
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
function getLoupanDistrictSection(city) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({
      uri: `https://${city}.fang.lianjia.com/loupan/`,
      callback: function (error, res, done) {
        if(error){
          logger.error(error);
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
        itemList.each(function () {
          let districtDetail = {
            districtName: $(this).text(),
            districtAlias: $(this).attr('data-district-spell'),
            section: []
          };
          let sectionList = $(`.bizcircle-item[data-district-id="${$(this).attr('data-district-id')}"]`);
          sectionList.each(function () {
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
function getLoupanDistrict(city) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({
      uri: `https://${city}.fang.lianjia.com/loupan/`,
      callback: function (error, res, done) {
        if(error){
          logger.error(error);
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
        itemList.each(function () {
          // logger.log(this);
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
 * @return {Promise<{data: {city: string, districts: Array<{name: string, alias: string}>}}>}
 * **/
function getErshoufangDistrict(city) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({
      uri: `https://${city}.lianjia.com/ershoufang/`,
      callback: function (error, res, done) {
        if(error){
          logger.error(error);
          done();
          reject({msg: `获取${city}的区域district失败`, result: 1, data: error});
          return;
        }
        let $ = res.$;

        let result = {
          city: city,
          districts: []
        };
        let eleList = $('div[data-role="ershoufang"]>div:first-child a');
        eleList.each(function () {
          let a = $(this);
          if(a.attr('href').match(/lianjia\.com/g)){
            return;
          }
          let district = {
            name: a.text(),
            alias: a.attr('href').split('/')[2]
          };
          result.districts.push(district);
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
 * @return {Promise<{data:{total: number, sections: Array<{name: string, alias: string}>}}>}
 * **/
function getErshoufangSection(city, district) {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({
      uri: `https://${city}.lianjia.com/ershoufang/${district}/`,
      callback: function (error, res, done) {
        if(error){
          logger.error(error);
          done();
          reject({msg: `获取${city}  ${district}的sections失败`, result: 1, data: error});
          return;
        }
        let $ = res.$;

        let total = +($('h2.total span').text().trim());
        let result = [];
        let eleList = $('div[data-role="ershoufang"]>div:nth-child(2) a');
        eleList.each(function () {
          let a = $(this);
          result.push({
            name: a.text(),
            alias: a.attr('href').split('/')[2]
          })
        });
        resolve({result: 0, msg: `获取${city}  ${district}的sections成功`, data: {total: total, sections: result}});
        done();
      }
    })
  });
}
/**
 * 获取某个城市city区域section第i页的房产列表
 * @param {string}city 城市
 * @param {string}section 区域
 * @param {number}page 第i页面
 * @return {Promise<{data:{
          total: total,
          page: page,
          list: result
        }}>}
 * **/
function getErshoufangPerPage(city, page, section='') {
  let _this = this;
  return new Promise(function (resolve, reject) {
    _this.c.queue({
      uri: `https://${city}.lianjia.com/ershoufang${section ? '/'+ section : ''}/pg${page}`,
      callback: function (error, res, done) {
        if(error){
          logger.error(error);
          done();
          reject({msg: `获取${city}  ${section} 第${page}页的信息失败`, result: 1, data: error});
          return;
        }
        let $ = res.$;
        let total = +($('h2.total span').text().trim());
        let result = [];
        let eleList = $('ul.sellListContent li.LOGCLICKDATA .info .title a');
        eleList.each(function () {
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
          let e = {msg: `获取${city} 二手房 ${id}的信息失败`, result: 1, data: error};
          logger.error(e);
          done();
          reject(e);
          return;
        }
        let $ = res.$;
        let info = {};  //数据对象

        // name
        try{
          info.name = $('h1.main').text();
        }catch (e) {
          logger.error({msg: `获取${city}  name失败`, error: e});
        }
        //总价
        try{
          info.price_total = $('.price .total').text();
          info.price_total_unit = $('.price .unit span').text();
        }
        catch (e) {
          logger.error({msg: `获取${city} 二手房 ${id}总价失败`, error: e});
        }

        //均价
        try{
          let averagePriceString = $('.unitPriceValue').text();
          info.price_average = averagePriceString.match(/\d+/)[0];
          info.price_average_unit = averagePriceString.match(/\d+(\D*)/)[1];
        }
        catch (e) {
          logger.error({msg: `获取${city} 二手房 ${id}均价失败`, error: e});
        }
        //小区
        try{
          let communityEle = $('.communityName a:first-of-type');
          info.community_name = communityEle.text();
          info.community_id = communityEle.attr('href').split('/')[2];
        }
        catch (e) {
          logger.error({msg: `获取${city} 二手房 ${id}小区信息失败`, error: e});
        }

        //城区
        try{
          let districtEle = $('.areaName .info a:nth-child(1)');
          info.district_name = districtEle.text();
          info.district_alias = districtEle.attr('href').split('/')[2];
        }
        catch (e) {
          logger.error({msg: `获取${city} 二手房 ${id}城区失败`, error: e});
        }

        //地区
        try{
          let sectionEle = $('.areaName .info a:nth-child(2)');
          info.section_name = sectionEle.text();
          info.section_alias = sectionEle.attr('href').split('/')[2];
          // logger.log(info.section_name, '   ', info.section_alias);
        }
        catch (e) {
          logger.error({msg: `获取${city} 二手房 ${id}地区信息失败`, error: e});
        }

        //详情信息
        let detailList = $('.introContent ul li');
        detailList.each(function(){
          let str = $(this).text().trim();
          // logger.log(str);
          switch (true) {
            case /.*房屋户型.*/.test(str):
              info.house_model = str.replace(/.*房屋户型\s*/, '');
              break;
            case /.*建筑面积.*/.test(str):
              str.replace(/.*建筑面积\s*(\d+\.?\d+)\s*(\S*)/, (m, m1, m2)=>{
                info.building_area = m1;
                info.building_area_unit = m2;
              });
              break;
            case /.*套内面积.*/.test(str):
              str.replace(/.*套内面积\s*(\d+\.?\d+)\s*(\S*)/, (m, m1, m2)=>{
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
        logger.log(JSON.stringify(info));
        resolve({result: 0, msg: `获取${city}  ${id}的信息成功`, data: info});
        done();
      }
    })
  });
}



/**
 * 获取某个城市新房的数据，每获取一条，执行一次callback
 * @param {string}city  城市的alias
 * @param {function}callback  每获取到一条房产数据，执行一次的回调，第一个参数为该条房产数据。如果失败，第一个参数为null，第二个参数为错误信息
 * @return {Promise}
 * **/
async function getLoupanByCity(city, callback=null) {
  let _this = this;
  let total;
  //1.尝试获取该城市房子总数
  try{
    total = (await _this.getLoupanPerpage(city, 1)).data.total;
  }
  catch (e) {
    return Promise.reject({msg: '获取某个城市新房数据失败，可能没有新房信息', error: e});
  }
  //2.区分房子总数是否超过1000
  if(total <= 1000){
    //2.1 不超过1000，直接分页获取
    return _this.getLoupanLessThanThousand(city, callback);
  }
  else{
    //2.2 超过1000
    return _this.getLoupanMoreThanThousand(city,callback);
  }
}
/**
 * 获取新房时候，城市楼盘数量超过1000的方法
 * @param{string} city
 * @param{function?} callback 没获取到一条房产信息后的回调
 * @retrun{Promise}
 * **/
async function getLoupanMoreThanThousand(city, callback=null) {
  let _this = this;
  let districtSection;
  try{
    districtSection = (await _this.getLoupanDistrictSection(city)).data;
  }
  catch (e) {
    logger.error(e);
    return Promise.reject({msg: `获取城市${city}分区失败`, err: e});
  }
  let promiseArray = [];  //每一次的请求
  districtSection.district.forEach(district => {
    //有的大区域不分section，需要直接用大区域获取数据,分section的，就需要每个section获取数据
    if(district.section.length === 0){
      //该区域不分section
      promiseArray.push(_this.getLoupanLessThanThousand(city, callback, district.districtAlias));
    }
    else{
      //该区域分section
      district.section.forEach(section => {
        promiseArray.push(_this.getLoupanLessThanThousand(city, callback, section.sectionAlias));
      });
    }
  });

  return Promise.all(promiseArray);
}
/**
 * 获取指定city/district/section新房少于1000时候的所有楼盘信息，每条信息执行一次callback
 * @param{string} city   指定的城市
 * @param{function} callback  对每条信息的回调
 * @param{string} area  指定的district或者section
 * @return{Promise}
 * @description  该方法思路：对于每个区域，先获取总数，然后每个分页对应一个promise,每个promise在内部处理失败情况，因而总是会是resolved。
 *                 该方法使用Promise.all返回单一promise，resolve时候表示获取信息结束。
 * **/
async function getLoupanLessThanThousand(city, callback=null, area=''){
  let _this = this;
  let total;
  try{
    total = (await _this.getLoupanPerpage(city, 1, area)).data.total;
  }
  catch (e){
    let err = {msg: `获取${city} ${area} 房子总量信息失败`, err: e};
    logger.error(err);
    return err;
  }
  let promiseArray = [];
  for(let i=0; i*10<total; i++){
    let page = i+1;
    let promise = _this.getLoupanPerpage(city, page, area).then(v=>{
      v.data.list.forEach(data =>{
        callback && callback(data);
      });
    })
    .catch(err=>{
      callback && callback(null, {msg: `获取${city} ${area}第${page}页新房数据失败`, error: err, city: city, page: page, area: area});
      logger.error(err);
    });
    promiseArray.push(promise);
  }
  return Promise.all(promiseArray);
}


/**
 * 获取指定city/district/section二手房小于3000时候的所有楼盘信息
 * @param{string} city   指定的城市
 * @param{function} callback  对每条信息的回调
 * @param{string} area  指定的district或者section
 * @return{Promise}
 * **/
async function getErshoufangLessThanThreeThousand(city, callback=null, area='') {
  let _this = this;
  let total;
  try{
    total = (await _this.getErshoufangPerPage(city, 1, area)).data.total;
  }
  catch (e) {
    let err = {msg: `获取${city}的${area}的二手房总数信息失败`, error: e};
    logger.error(err);
    return Promise.reject(err);
  }
  let promiseArray = [];   //获取每一页二手房信息的promise列表
  for(let i=0; i*30<total; i++){
    //遍历获取每一页二手房信息
    let page = i+1;
    let promise = _this.getErshoufangPerPage(city, page, area).then(result => {
      let getPerErshoufangPromiseArray = [];  //获取每个二手房信息的promise
      result.data.list.forEach(item => {
        //遍历获取某页中的每一条二手房产信息
        let p = _this.getErshoufangDetail(city, item.id).then(data=>{
          callback && callback(data);
        })
        .catch(e => {
          logger.error({msg: `获取${city}的id为${item.id}的二手房数据失败`, error: e});
        });
        getPerErshoufangPromiseArray.push(p);
      });
      return Promise.all(getPerErshoufangPromiseArray);
    })
    .catch(err => {
      logger.error({msg: `获取${city}的${area}第${page}页的数据失败`, error: err});
    });
    promiseArray.push(promise);
  }
  return Promise.all(promiseArray);
}

/**
 * 获取指定city二手房信息
 * @param{string} city   指定的城市
 * @param{function} callback  对每条信息的回调
 * @return{Promise}
 * **/
async function getErshoufangByCity(city, callback) {
  let _this = this;
  let total;
  try{
    total = (await _this.getErshoufangPerPage(city, 1)).data.total;
  }
  catch (e) {
    let err = {msg: `获取${city}二手房总数失败`, error: e};
    logger.error(err);
    return Promise.reject(err);
  }
  logger.log(`-------获取到${city}二手房总数${total}-------`);

  if(total <= 3000){
    //二手房总数少于3000
    return _this.getErshoufangLessThanThreeThousand(city, callback);
  }
  else{
    //二手房总数超过3000
    return _this.getErshoufangMoreThanThreeThousand(city, callback);
  }
}


/**
 * 获取指定城市二手房超过3000时候的方法
 * @param{string} city
 * @param{function?} callback
 * @return{Promise}
 * **/
async function getErshoufangMoreThanThreeThousand(city, callback=null){
  let _this = this;
  let districtSections;
  try{
    districtSections = await _this.getErshoufangDistrictSection(city);
  }
  catch (e) {
    let err = {msg: `获取${city} 分区（districts + sections）失败`, error: e};
    logger.error(err);
    return Promise.reject(err);
  }
  let promiseArray = [];   //每个小于3000的请求的列表
  districtSections.forEach(district => {
    if(district.total <= 3000){
      promiseArray.push(_this.getErshoufangLessThanThreeThousand(city, callback, district.alias));
    }
    else if(district.total > 3000 && district.sections.length === 0){
      logger.error({msg: `${city}的district ${district.name}(${district.alias}) 二手房数量超过3000，且没有section，只能获取3000条数据`});
      promiseArray.push(_this.getErshoufangLessThanThreeThousand(city, callback, district.alias));
    }
    else if(district.total > 3000 && district.sections.length > 0){
      district.sections.forEach(section => {
        let promise = _this.getErshoufangPerPage(city, 1, section.alias).then(result => {
          if(result.data.total > 3000){
            logger.error({msg: `${city}的district ${district.name}(${district.alias}) 的section ${section.name}(${section.alias})二手房数量超过3000，只能获取3000条数据`});
          }
          return _this.getErshoufangLessThanThreeThousand(city, callback, section.alias);
        });
        promiseArray.push(promise);
      });
    }
  });
  return Promise.all(promiseArray);
}


/**
 * 获取指定城市的二手房每个district的总房产数，以及分区section
 * @param{string} city
 * @return{Promise<Array<{name: string, alias: string, total: number, sections: {name: string, alias: string}[]}>>}
 * **/
async function getErshoufangDistrictSection(city) {
  let _this = this;
  let districts;
  try{
    districts = (await _this.getErshoufangDistrict(city)).data.districts;
  }
  catch (e) {
    let err = {msg: `获取${city} districts分区失败`, error: e};
    logger.error(err);
    return Promise.reject(err);
  }

  let promiseArray = [];
  districts.forEach(function (district){
    let promise = _this.getErshoufangSection(city, district.alias).then(result=>{
      district.total = result.data.total;
      district.sections = result.data.sections;
    })
    .catch(e=>{
      let err = {msg: `获取${city} ${district.name} ${district.alias} 的sections失败`, error: e};
      logger.error(err);
      return Promise.reject(err);
    });
    promiseArray.push(promise);
  });

  return Promise.all(promiseArray).then(()=>{
    return districts;
  });

}


/**
 * 导出的链家爬虫类
 * @constructor
 * **/
function LianjiaCrawler(){
  this.c = createCrawler();
}
//获取城市列表
LianjiaCrawler.prototype.getLianjiaCities = getLianjiaCities;

//新房相关<基础>方法
LianjiaCrawler.prototype.getLoupanTotal = getLoupanTotal;
LianjiaCrawler.prototype.getLoupanPerpage = getLoupanPerpage;
LianjiaCrawler.prototype.getLoupanDistrictSection = getLoupanDistrictSection;
LianjiaCrawler.prototype.getLoupanDistrict = getLoupanDistrict;

//二手房相关<基础>方法
LianjiaCrawler.prototype.getErshoufangDistrict = getErshoufangDistrict;
LianjiaCrawler.prototype.getErshoufangSection = getErshoufangSection;
LianjiaCrawler.prototype.getErshoufangDistrictSection = getErshoufangDistrictSection;
LianjiaCrawler.prototype.getErshoufangPerPage = getErshoufangPerPage;
LianjiaCrawler.prototype.getErshoufangDetail = getErshoufangDetail;

//获取某个城市的新房相关<组合>方法
LianjiaCrawler.prototype.getLoupanByCity = getLoupanByCity;
LianjiaCrawler.prototype.getLoupanLessThanThousand = getLoupanLessThanThousand;
LianjiaCrawler.prototype.getLoupanMoreThanThousand = getLoupanMoreThanThousand;

//获取某个城市二手房相关<组合>方法
LianjiaCrawler.prototype.getErshoufangLessThanThreeThousand = getErshoufangLessThanThreeThousand;
LianjiaCrawler.prototype.getErshoufangMoreThanThreeThousand = getErshoufangMoreThanThreeThousand;
LianjiaCrawler.prototype.getErshoufangByCity = getErshoufangByCity;

module.exports = LianjiaCrawler;
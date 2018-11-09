const Crawler = require('crawler');
const fs = require('fs');
function crawler(ctx, next) {

  let c = new Crawler({
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, res, done) {
      if(error){
        console.log(error);
        return;
      }else{
        let $ = res.$;
        // $ is Cheerio by default
        //a lean implementation of core jQuery designed specifically for the server
        console.log($("title").text());
      }
      done();
    }
  });

  c.queue({
    uri: 'http://www.zk922.com',
    callback: function (error, res, done) {
      if(error){
        done();
        return;
      }
      let $ = res.$;
      console.log($("title").text());
      done();
    }
  })



}
module.export = crawler;

crawler();
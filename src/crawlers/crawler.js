const Crawler = require('crawler');

module.exports = function createCrawler(maxConnection = 10){
  return new Crawler({
    maxConnections : maxConnection,
    retries: 0,
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
};
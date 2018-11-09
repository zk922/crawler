const Crawler = require('crawler');


export function crawler(ctx, next) {

  let c = new Crawler({
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, res, done) {
      if(error){
        console.log(error);
      }else{
        let $ = res.$;
        // $ is Cheerio by default
        //a lean implementation of core jQuery designed specifically for the server
        console.log($("title").text());
      }
      done();
    }
  });

  c.queue()



}
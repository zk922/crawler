const Router = require('koa-router');


let getLianjiaLoupan = require('./middlewares/getLianjiaLoupan')



let router = new Router();

router.get('/test', getLianjiaLoupan);


module.exports = router;
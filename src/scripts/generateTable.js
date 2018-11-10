/**
 * 此脚本是为了创建数据表
 * **/
const pool = require('../db');

pool.getConnection()
.then(conn =>{

})
.catch(err=>{
  console.log('创建数据表脚本执行失败');
});
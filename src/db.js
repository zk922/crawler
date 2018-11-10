const mariadb = require('mariadb');
const {dbConfig} = require('../config');


const pool = mariadb.createPool(dbConfig);

module.exports = pool;


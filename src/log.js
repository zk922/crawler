const fs = require('fs');
const { Console } = require('console');

const logger = new Console(
  fs.createWriteStream(__dirname + '/../log.log', {flags: 'a'}),
  fs.createWriteStream(__dirname + '/../err.log', {flags: 'a'})
);
module.exports = logger;
const serverless = require('serverless-http');
const app = require('../apiserver');

module.exports = serverless(app);
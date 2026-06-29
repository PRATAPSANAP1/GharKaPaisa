const analytics = require('./analytics.service');
const audit     = require('./audit.service');
module.exports  = { ...analytics, ...audit };

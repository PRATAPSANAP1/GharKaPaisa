const partner = require('./partner.controller');
const kyc = require('./kyc.controller');
module.exports = { ...partner, ...kyc };

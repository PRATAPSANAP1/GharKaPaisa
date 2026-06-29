const kyc = require('./kyc.service');
const commission = require('./commission.service');
module.exports = { ...kyc, ...commission };

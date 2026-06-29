const cms     = require('./cms.controller');
const svc     = require('./service.controller');
const catalog = require('./service_catalog.controller');
module.exports = { ...cms, ...svc, ...catalog };

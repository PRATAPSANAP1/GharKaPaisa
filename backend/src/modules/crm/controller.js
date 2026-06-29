const lead    = require('./lead.controller');
const card    = require('./card_application.controller');
const app     = require('./application.controller');
module.exports = { ...lead, ...card, ...app };

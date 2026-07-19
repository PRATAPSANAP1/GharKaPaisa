const leadRouter            = require('./lead.routes');
const cardApplicationRouter = require('./card_application.routes');
const applicationRouter     = require('./application.routes');
const loanApplicationRouter = require('./loan_application.routes');
const insuranceApplicationRouter = require('./insurance_application.routes');
const bankCardApplicationRouter = require('./bank_card_application.routes');

module.exports = { 
  leadRouter, 
  cardApplicationRouter, 
  applicationRouter,
  loanApplicationRouter,
  insuranceApplicationRouter,
  bankCardApplicationRouter
};



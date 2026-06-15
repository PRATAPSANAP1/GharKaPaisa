const { validationResult } = require('express-validator');
const { VALIDATION_ERROR } = require('../constants/errorCodes');
const { error } = require('../utils/response');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return error(res, 'Validation failed', 400, {
      code: VALIDATION_ERROR,
      details: errors.array().map(err => ({ field: err.param, message: err.msg }))
    });
  };
};

module.exports = validate;

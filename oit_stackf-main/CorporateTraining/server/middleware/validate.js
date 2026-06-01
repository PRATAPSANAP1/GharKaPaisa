const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');

const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const extractedErrors = errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      }));

      return errorResponse(res, 400, 'Validation failed', extractedErrors);
    }

    next();
  };
};

module.exports = validate;


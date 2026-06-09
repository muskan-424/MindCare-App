/**
 * validate.js
 * Shared express-validator result checker. Place AFTER a route's validation
 * chain so failures become a consistent 400 via the central error handler:
 *   { error: 'Validation failed', code: 'VALIDATION_ERROR', details: [...] }
 *
 * @example
 *   router.post('/', [body('title').notEmpty()], validate, asyncHandler(...));
 */

const { validationResult } = require('express-validator');
const { httpError } = require('./errorHandler');

function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(httpError(400, 'Validation failed', 'VALIDATION_ERROR', errors.array()));
  }
  next();
}

module.exports = { validate };

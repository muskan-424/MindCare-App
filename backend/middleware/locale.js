const { getRequestLanguage } = require('../src/shared/locale');

/** Attach `req.language` (normalized BCP47 base code) to every API request. */
function localeMiddleware(req, _res, next) {
  req.language = getRequestLanguage(req);
  next();
}

module.exports = { localeMiddleware };

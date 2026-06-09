/**
 * asyncHandler.js
 * Wraps an async Express handler so any rejected promise is forwarded to the
 * central error handler via next(err) — removing repetitive try/catch blocks.
 *
 * @example
 *   router.get('/', asyncHandler(async (req, res) => {
 *     const goals = await Goal.find({ userId: req.user.id });
 *     res.json(goals);
 *   }));
 */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { asyncHandler };

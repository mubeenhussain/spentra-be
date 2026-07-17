/**
 * Placeholder for auth middleware (Phase 1).
 * Will attach req.user from Bearer JWT.
 */
function notImplemented(_req, res) {
  res.status(501).json({ message: 'Not implemented yet' });
}

module.exports = { notImplemented };

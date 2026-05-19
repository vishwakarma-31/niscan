const { verifyAccessToken } = require('../utils/jwtUtils');
const { unauthorized, serverError } = require('../utils/responseUtils');


function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'Access token required');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return unauthorized(res, 'Access token expired');
      }
      return unauthorized(res, 'Invalid access token');
    }
  } catch (err) {
    return serverError(res, 'Authentication error');
  }
}

module.exports = authMiddleware;
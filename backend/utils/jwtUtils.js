const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';


function signAccessToken(payload) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}


function signRefreshToken(payload) {
  if (!JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET not configured');
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}


function verifyAccessToken(token) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.verify(token, JWT_SECRET);
}


function verifyRefreshToken(token) {
  if (!JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET not configured');
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};

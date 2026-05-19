const bcrypt = require('bcryptjs');
const { createUser, findByEmail } = require('../repositories/userRepository');
const { signAccessToken, signRefreshToken } = require('../utils/jwtUtils');
const { logActivity } = require('../repositories/policyRepository');


async function register({ name, email, password, role }) {
  const existing = await findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    err.code = 'EMAIL_EXISTS';
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ name, email, passwordHash, role });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    },
  };
}


async function login(email, password) {
  const user = await findByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  // Log activity
  await logActivity({
    user_id: user.id,
    action: 'user_login',
    entity_type: 'user',
    entity_id: user.id,
    metadata: { email: user.email },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}


async function refresh(refreshToken) {
  const { verifyRefreshToken } = require('../utils/jwtUtils');
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    error.code = 'INVALID_REFRESH_TOKEN';
    throw error;
  }

  // Find user to get current role
  const { findById } = require('../repositories/userRepository');
  const user = await findById(decoded.id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 401;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  return { accessToken };
}


async function logout(userId) {
  await logActivity({
    user_id: userId,
    action: 'user_logout',
    entity_type: 'user',
    entity_id: userId,
    metadata: {},
  });
  return { message: 'Logged out successfully' };
}

module.exports = { register, login, refresh, logout };
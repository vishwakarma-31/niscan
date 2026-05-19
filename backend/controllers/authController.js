const { validationResult, body } = require('express-validator');
const authService = require('../services/authService');
const { success, unauthorized, serverError, error } = require('../utils/responseUtils');

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'ops']).withMessage('Role must be admin or ops'),
];

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array()[0].msg, 400, 'VALIDATION_ERROR');
    }

    const { name, email, password, role } = req.body;
    const result = await authService.register({ name, email, password, role });

    return success(res, result, 201);
  } catch (err) {
    if (err.code === 'EMAIL_EXISTS') {
      return error(res, err.message, 409, err.code);
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array()[0].msg, 400, 'VALIDATION_ERROR');
    }

    const { email, password } = req.body;
    const result = await authService.login(email, password);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return accessToken in body (not cookie) for client convenience
    const { refreshToken, ...rest } = result;
    return success(res, rest);
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return unauthorized(res, err.message);
    }
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return unauthorized(res, 'Refresh token required');
    }

    const result = await authService.refresh(refreshToken);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const userId = req.user?.id;
    await authService.logout(userId);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return success(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    return success(res, { user: req.user });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  registerValidation,
};
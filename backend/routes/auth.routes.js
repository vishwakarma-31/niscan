const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { register, login, refresh, logout, me, registerValidation } = require('../controllers/authController');

// POST /api/auth/register — admin only
router.post('/register', authMiddleware, requireRole('admin'), registerValidation, register);

// POST /api/auth/login — public
router.post('/login', login);

// POST /api/auth/refresh — public (requires refreshToken cookie)
router.post('/refresh', refresh);

// POST /api/auth/logout — authenticated
router.post('/logout', authMiddleware, logout);

// GET /api/auth/me — authenticated
router.get('/me', authMiddleware, me);

module.exports = router;
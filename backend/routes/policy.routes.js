const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const policyController = require('../controllers/policyController');

// GET /api/policies — authenticated (admin + ops)
router.get('/', authMiddleware, policyController.getAll);

// GET /api/policies/summary — authenticated (admin + ops)
router.get('/summary', authMiddleware, policyController.getSummary);

// GET /api/policies/export/csv — admin only
router.get('/export/csv', authMiddleware, requireRole('admin'), policyController.exportCSV);

// GET /api/policies/:id — authenticated
router.get('/:id', authMiddleware, policyController.getById);

// GET /api/policies/:id/download — authenticated
router.get('/:id/download', authMiddleware, policyController.download);

// POST /api/policies/upload — authenticated (admin + ops)
router.post(
  '/upload',
  authMiddleware,
  uploadMiddleware.single('file'),
  policyController.uploadPolicy
);

// PATCH /api/policies/:id/status — admin only
router.patch('/:id/status', authMiddleware, requireRole('admin'), policyController.updateStatus);

// DELETE /api/policies/:id — admin only
router.delete('/:id', authMiddleware, requireRole('admin'), policyController.deletePolicy);

module.exports = router;
const policyService = require('../services/policyService');
const { success, notFound, error, paginated } = require('../utils/responseUtils');

async function uploadPolicy(req, res, next) {
  try {
    if (!req.file) {
      return error(res, 'No file uploaded', 400, 'NO_FILE');
    }

    const userId = req.user.id;
    const policy = await policyService.uploadPolicy(req.body, req.file.buffer, userId);

    return success(res, { policy }, 201);
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const { search, status, page, limit, uploaded_by } = req.query;
    const result = await policyService.getAllPolicies({
      search,
      status,
      page: parseInt(page, 10) || 1,
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      uploaded_by,
    });

    const pageVal = parseInt(page, 10) || 1;
    const limitVal = Math.min(parseInt(limit, 10) || 20, 100);
    const totalPages = Math.ceil(result.total / limitVal);

    return paginated(res, { policies: result.policies }, {
      total: result.total,
      page: pageVal,
      limit: limitVal,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
}

async function getSummary(req, res, next) {
  try {
    const summary = await policyService.getSummary();
    return success(res, summary);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const policy = await policyService.getPolicyById(req.params.id);
    if (!policy) {
      return notFound(res, 'Policy not found');
    }
    return success(res, { policy });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['pending', 'active', 'expired', 'cancelled'].includes(status)) {
      return error(res, 'Invalid status value', 400, 'VALIDATION_ERROR');
    }

    const policy = await policyService.updateStatus(req.params.id, status, req.user.id);

    // tell frontend to update
    const io = req.app.get('io');
    io.emit('policy:status_updated', {
      policy_id: policy.id,
      status: policy.status,
      updatedBy: { id: req.user.id, name: req.user.name },
      timestamp: new Date().toISOString(),
    });

    return success(res, { policy });
  } catch (err) {
    next(err);
  }
}

async function deletePolicy(req, res, next) {
  try {
    await policyService.deletePolicy(req.params.id, req.user.id);
    return success(res, { message: 'Policy deleted' });
  } catch (err) {
    if (err.statusCode === 404) {
      return notFound(res, err.message);
    }
    next(err);
  }
}

async function download(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await policyService.getDownloadUrl(req.params.id, userId);
    return success(res, result);
  } catch (err) {
    if (err.statusCode === 404) {
      return notFound(res, err.message);
    }
    if (err.statusCode === 400) {
      return error(res, err.message, 400);
    }
    next(err);
  }
}

async function exportCSV(req, res, next) {
  try {
    const policies = await policyService.exportCSV({});

    const csvHeaders = [
      'id', 'policy_number', 'customer_name', 'customer_email',
      'vehicle_number', 'insurer', 'premium', 'status', 'created_at',
    ];

    const rows = policies.map((p) =>
      csvHeaders.map((h) => {
        const val = p[h];
        if (val === null || val === undefined) return '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csv = [csvHeaders.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=policies-export.csv');
    return res.send(csv);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadPolicy,
  getAll,
  getSummary,
  getById,
  updateStatus,
  deletePolicy,
  download,
  exportCSV,
};
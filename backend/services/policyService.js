const { uploadToS3 } = require('../config/s3');
const policyRepository = require('../repositories/policyRepository');
const { extractPolicyData } = require('./extractionService');


async function uploadPolicy(policyData, pdfBuffer, userId) {
  const { customer_email } = policyData;

  // Generate S3 key with year/month folders
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const { v4: uuidv4 } = require('uuid');
  const filename = `policy-${uuidv4()}.pdf`;
  const s3Key = `policies/${year}/${month}/${filename}`;

  // Upload to S3
  let s3_file_url;
  try {
    const result = await uploadToS3(pdfBuffer, s3Key, 'application/pdf');
    s3_file_url = result.s3_file_url;
  } catch (err) {
    const error = new Error('Failed to upload file to storage');
    error.statusCode = 500;
    error.code = 'S3_UPLOAD_FAILED';
    throw error;
  }

  // Create policy record in DB
  const policy = await policyRepository.createPolicy({
    s3_file_url,
    s3_file_key: s3Key,
    customer_email: customer_email || null,
    uploaded_by: userId,
  });

  // Log activity
  await policyRepository.logActivity({
    user_id: userId,
    action: 'policy_uploaded',
    entity_type: 'policy',
    entity_id: policy.id,
    metadata: { filename: s3Key },
  });

  // Trigger async extraction (non-blocking)
  setImmediate(() => {
    extractPolicyData(policy.id, pdfBuffer).catch((err) => {
      console.error(`[ExtractionService] Failed for policy ${policy.id}:`, err.message);
    });
  });

  return { policy };
}

async function getPolicyById(id) {
  return policyRepository.findPolicyById(id);
}

async function getAllPolicies(filters) {
  return policyRepository.findAll(filters);
}

async function getSummary() {
  return policyRepository.getSummary();
}

async function updateStatus(id, status, userId) {
  const policy = await policyRepository.updateStatus(id, status);
  if (!policy) {
    const err = new Error('Policy not found');
    err.statusCode = 404;
    throw err;
  }

  await policyRepository.logActivity({
    user_id: userId,
    action: 'policy_status_changed',
    entity_type: 'policy',
    entity_id: id,
    metadata: { newStatus: status },
  });

  return policy;
}

async function deletePolicy(id, userId) {
  const deleted = await policyRepository.softDelete(id);
  if (!deleted) {
    const err = new Error('Policy not found');
    err.statusCode = 404;
    throw err;
  }

  await policyRepository.logActivity({
    user_id: userId,
    action: 'policy_deleted',
    entity_type: 'policy',
    entity_id: id,
    metadata: {},
  });

  return { message: 'Policy deleted' };
}

async function getDownloadUrl(id, requestingUserId) {
  const policy = await policyRepository.findPolicyById(id);
  if (!policy) {
    const err = new Error('Policy not found');
    err.statusCode = 404;
    throw err;
  }
  if (!policy.s3_file_key) {
    const err = new Error('File not available for download');
    err.statusCode = 400;
    throw err;
  }

  const { getPresignedUrl } = require('../config/s3');
  const downloadUrl = await getPresignedUrl(policy.s3_file_key, 900);

  await policyRepository.logActivity({
    user_id: requestingUserId,
    action: 'policy_downloaded',
    entity_type: 'policy',
    entity_id: id,
    metadata: {},
  });

  return { downloadUrl };
}

async function exportCSV(filters) {
  const { policies } = await policyRepository.findAll({ ...filters, limit: 10000, page: 1 });
  return policies;
}

module.exports = {
  uploadPolicy,
  getPolicyById,
  getAllPolicies,
  getSummary,
  updateStatus,
  deletePolicy,
  getDownloadUrl,
  exportCSV,
};
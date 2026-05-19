const pool = require('../config/db');


async function createPolicy(data) {
  const {
    policy_number,
    customer_name,
    customer_email,
    vehicle_number,
    insurer,
    premium,
    s3_file_url,
    s3_file_key,
    uploaded_by,
  } = data;

  const result = await pool.query(
    `INSERT INTO policies (
      policy_number, customer_name, customer_email, vehicle_number,
      insurer, premium, s3_file_url, s3_file_key, uploaded_by, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
    RETURNING *`,
    [
      policy_number || null,
      customer_name || null,
      customer_email || null,
      vehicle_number || null,
      insurer || null,
      premium || null,
      s3_file_url,
      s3_file_key,
      uploaded_by,
    ]
  );

  return result.rows[0];
}


async function updatePolicyExtraction(id, data) {
  const {
    policy_number,
    customer_name,
    vehicle_number,
    insurer,
    premium,
    extraction_confidence,
  } = data;

  const result = await pool.query(
    `UPDATE policies
     SET policy_number = COALESCE($2, policy_number),
         customer_name = COALESCE($3, customer_name),
         vehicle_number = COALESCE($4, vehicle_number),
         insurer = COALESCE($5, insurer),
         premium = COALESCE($6, premium),
         extraction_confidence = $7
     WHERE id = $1 AND is_deleted = FALSE
     RETURNING *`,
    [id, policy_number, customer_name, vehicle_number, insurer, premium, extraction_confidence]
  );

  return result.rows[0] || null;
}


async function findPolicyById(id) {
  const result = await pool.query(
    `SELECT p.*, u.name as uploader_name, u.email as uploader_email
     FROM policies p
     LEFT JOIN users u ON p.uploaded_by = u.id
     WHERE p.id = $1 AND p.is_deleted = FALSE`,
    [id]
  );
  return result.rows[0] || null;
}


async function findAll({ search, status, page = 1, limit = 20, uploaded_by }) {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = ['p.is_deleted = FALSE'];

  let paramIndex = 1;

  if (search) {
    conditions.push(`(p.customer_name ILIKE $${paramIndex} OR p.policy_number ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (status) {
    conditions.push(`p.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (uploaded_by) {
    conditions.push(`p.uploaded_by = $${paramIndex}`);
    params.push(uploaded_by);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Count
  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM policies p WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // Data
  params.push(limit, offset);
  const dataResult = await pool.query(
    `SELECT p.*, u.name as uploader_name
     FROM policies p
     LEFT JOIN users u ON p.uploaded_by = u.id
     WHERE ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  );

  return { policies: dataResult.rows, total };
}


async function getSummary() {
  const result = await pool.query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'active') as active,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COUNT(*) FILTER (WHERE status = 'expired') as expired,
       COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
     FROM policies
     WHERE is_deleted = FALSE`
  );

  const row = result.rows[0];
  return {
    total: parseInt(row.total, 10),
    active: parseInt(row.active, 10),
    pending: parseInt(row.pending, 10),
    expired: parseInt(row.expired, 10),
    cancelled: parseInt(row.cancelled, 10),
  };
}


async function updateStatus(id, status) {
  const result = await pool.query(
    `UPDATE policies
     SET status = $2
     WHERE id = $1 AND is_deleted = FALSE
     RETURNING *`,
    [id, status]
  );
  return result.rows[0] || null;
}


async function softDelete(id) {
  const result = await pool.query(
    `UPDATE policies SET is_deleted = TRUE WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rowCount > 0;
}


async function logActivity({ user_id, action, entity_type, entity_id, metadata }) {
  await pool.query(
    `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [user_id, action, entity_type, entity_id, metadata ? JSON.stringify(metadata) : null]
  );
}


async function getActivityLogs(limit = 50) {
  const result = await pool.query(
    `SELECT al.*, u.name as user_name, u.email as user_email
     FROM activity_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ORDER BY al.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

module.exports = {
  createPolicy,
  updatePolicyExtraction,
  findPolicyById,
  findAll,
  getSummary,
  updateStatus,
  softDelete,
  logActivity,
  getActivityLogs,
};
const { query } = require('../../config/database');
const { uploadToS3, getCloudFrontUrl } = require('../../services/aws/s3.service.js');
const { success, created, error, notFound } = require('../../utils/response/response');
const logger = require('../../config/logger');

/**
 * Calculate dynamic employee progress for a contest between start_date and end_date
 */
async function getEmployeeProgress(employeeId, contest) {
  if (!employeeId) return { current_value: 0, percentage: 0, qualified: false, remaining: contest.target_value };
  
  try {
    // Count approved applications created by / submitted by employee during contest duration
    const countSql = `
      SELECT COUNT(*) as count FROM (
        SELECT id FROM applications 
        WHERE (submitted_by = $1 OR partner_id IN (SELECT id FROM partner_profiles WHERE user_id = $1))
          AND status IN ('approved', 'disbursed', 'operational_verified', 'commission_received', 'sanctioned', 'super_admin_approved')
          AND created_at >= $2 AND created_at <= $3
        UNION ALL
        SELECT id FROM bank_card_applications 
        WHERE (created_by = $1 OR employee_code = (SELECT employee_id FROM users WHERE id = $1))
          AND status IN ('approved', 'disbursed', 'operational_verified', 'commission_received', 'sanctioned', 'super_admin_approved')
          AND created_at >= $2 AND created_at <= $3
      ) combined_apps
    `;
    const { rows } = await query(countSql, [employeeId, contest.start_date, contest.end_date]);
    const currentValue = parseInt(rows[0]?.count || 0);
    const targetValue = parseFloat(contest.target_value || 50);
    const percentage = targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : 0;
    const qualified = currentValue >= targetValue;
    const remaining = Math.max(0, targetValue - currentValue);

    return {
      current_value: currentValue,
      target_value: targetValue,
      percentage,
      qualified,
      remaining
    };
  } catch (err) {
    logger.error('Error calculating employee contest progress:', err);
    return { current_value: 0, target_value: contest.target_value, percentage: 0, qualified: false, remaining: contest.target_value };
  }
}

// GET /contests - Public / Employee List Contests
const listContests = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const employeeId = req.user?.id || req.query.employee_id;

    let sql = `SELECT * FROM contests WHERE 1=1`;
    const params = [];

    if (status) {
      params.push(status.toUpperCase());
      sql += ` AND status = $${params.length}`;
    }

    if (type) {
      params.push(type);
      sql += ` AND contest_type = $${params.length}`;
    }

    sql += ` ORDER BY start_date DESC, created_at DESC`;
    const { rows } = await query(sql, params);

    const contestsWithProgress = await Promise.all(
      rows.map(async (c) => {
        const progress = await getEmployeeProgress(employeeId, c);
        return {
          ...c,
          image_url: getCloudFrontUrl(c.image_url),
          progress
        };
      })
    );

    return success(res, contestsWithProgress);
  } catch (err) {
    next(err);
  }
};

// GET /contests/:id - Get Contest Details
const getContestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employeeId = req.user?.id || req.query.employee_id;

    const { rows } = await query(`SELECT * FROM contests WHERE id = $1`, [id]);
    if (rows.length === 0) return notFound(res, 'Contest not found');

    const contest = rows[0];
    const progress = await getEmployeeProgress(employeeId, contest);

    return success(res, {
      ...contest,
      image_url: getCloudFrontUrl(contest.image_url),
      progress
    });
  } catch (err) {
    next(err);
  }
};

// POST /contests - Create Contest (Admin/SuperAdmin)
const createContest = async (req, res, next) => {
  try {
    const {
      title,
      short_description,
      description,
      contest_type,
      target_value,
      target_unit,
      reward_type,
      reward_value,
      start_date,
      end_date,
      department_id,
      eligible_employees,
      status
    } = req.body;

    let image_url = req.body.image_url;
    let image_key = null;

    if (req.file) {
      const isS3Configured = !!process.env.AWS_S3_BUCKET;
      if (isS3Configured) {
        const { url, key } = await uploadToS3(req.file.buffer, req.file.originalname, 'contests');
        image_url = url;
        image_key = key;
      }
    }

    if (!image_url) {
      image_url = 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80';
    }

    const { rows: [createdRow] } = await query(
      `INSERT INTO contests (
        title, short_description, description, image_url, image_key,
        contest_type, target_value, target_unit, reward_type, reward_value,
        start_date, end_date, department_id, eligible_employees, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        title,
        short_description || title,
        description || short_description || title,
        image_url,
        image_key,
        contest_type || 'credit_card',
        target_value ? parseFloat(target_value) : 50,
        target_unit || 'Approved Applications',
        reward_type || 'Fixed Amount',
        reward_value ? parseFloat(reward_value) : 5000,
        start_date || new Date(),
        end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        department_id || 'Credit Card',
        eligible_employees || 'All eligible employees',
        (status || 'ACTIVE').toUpperCase(),
        req.user?.id || null
      ]
    );

    return created(res, createdRow, 'Contest created successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /contests/:id - Update Contest (Admin/SuperAdmin)
const updateContest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      short_description,
      description,
      contest_type,
      target_value,
      target_unit,
      reward_type,
      reward_value,
      start_date,
      end_date,
      department_id,
      eligible_employees,
      status
    } = req.body;

    const { rows: [existing] } = await query(`SELECT * FROM contests WHERE id = $1`, [id]);
    if (!existing) return notFound(res, 'Contest not found');

    let image_url = req.body.image_url || existing.image_url;
    let image_key = existing.image_key;

    if (req.file) {
      const isS3Configured = !!process.env.AWS_S3_BUCKET;
      if (isS3Configured) {
        const { url, key } = await uploadToS3(req.file.buffer, req.file.originalname, 'contests');
        image_url = url;
        image_key = key;
      }
    }

    const { rows: [updatedRow] } = await query(
      `UPDATE contests SET
        title = COALESCE($1, title),
        short_description = COALESCE($2, short_description),
        description = COALESCE($3, description),
        image_url = COALESCE($4, image_url),
        image_key = COALESCE($5, image_key),
        contest_type = COALESCE($6, contest_type),
        target_value = COALESCE($7, target_value),
        target_unit = COALESCE($8, target_unit),
        reward_type = COALESCE($9, reward_type),
        reward_value = COALESCE($10, reward_value),
        start_date = COALESCE($11, start_date),
        end_date = COALESCE($12, end_date),
        department_id = COALESCE($13, department_id),
        eligible_employees = COALESCE($14, eligible_employees),
        status = COALESCE($15, status),
        updated_by = $16,
        updated_at = NOW()
      WHERE id = $17 RETURNING *`,
      [
        title,
        short_description,
        description,
        image_url,
        image_key,
        contest_type,
        target_value ? parseFloat(target_value) : existing.target_value,
        target_unit,
        reward_type,
        reward_value ? parseFloat(reward_value) : existing.reward_value,
        start_date,
        end_date,
        department_id,
        eligible_employees,
        status ? status.toUpperCase() : existing.status,
        req.user?.id || null,
        id
      ]
    );

    return success(res, updatedRow, 'Contest updated successfully');
  } catch (err) {
    next(err);
  }
};

// DELETE /contests/:id - Delete Contest (Admin/SuperAdmin)
const deleteContest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [existing] } = await query(`SELECT * FROM contests WHERE id = $1`, [id]);
    if (!existing) return notFound(res, 'Contest not found');

    await query(`DELETE FROM contests WHERE id = $1`, [id]);
    return success(res, {}, 'Contest deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listContests,
  getContestById,
  createContest,
  updateContest,
  deleteContest
};

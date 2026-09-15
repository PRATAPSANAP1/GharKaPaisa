const { query } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Convert time string (e.g. "09:30 AM", "08:00 PM", "20:00") into minutes past midnight (0..1439).
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const str = String(timeStr).trim();
  const ampmMatch = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!ampmMatch) return 0;
  
  let hours = parseInt(ampmMatch[1], 10);
  const minutes = parseInt(ampmMatch[2], 10);
  const ampm = ampmMatch[3] ? ampmMatch[3].toUpperCase() : null;

  if (ampm) {
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
}

/**
 * Format minutes past midnight (e.g. 570) to 12-hour string (e.g. "09:30 AM").
 */
function minutesToTimeStr(totalMinutes) {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  let hours12 = hours % 12;
  if (hours12 === 0) hours12 = 12;
  const hStr = String(hours12).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  return `${hStr}:${mStr} ${ampm}`;
}

/**
 * Get current Date (YYYY-MM-DD) and current minutes past midnight in Asia/Kolkata timezone.
 */
function getKolkataTimeInfo() {
  const now = new Date();
  const optionsDate = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const optionsTime = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false };
  
  const formatterDate = new Intl.DateTimeFormat('en-CA', optionsDate); // YYYY-MM-DD
  const formatterTime = new Intl.DateTimeFormat('en-GB', optionsTime); // HH:mm
  
  const dateStr = formatterDate.format(now); // "YYYY-MM-DD"
  const timeStr = formatterTime.format(now); // "HH:mm"
  
  const [h, m] = timeStr.split(':').map(Number);
  const currentMinutes = h * 60 + m;
  
  return { dateStr, timeStr, currentMinutes };
}

/**
 * Core validation helper: Check if user is allowed to log in at current time in Asia/Kolkata.
 * 
 * Rules:
 * - SUPER_ADMIN is ALWAYS exempt.
 * - Restricted roles/designations (or configured users) undergo evaluation.
 * - Checks per-user working hours, designation hours, or default global hours (09:30 AM - 08:00 PM).
 * - Checks date-specific temporary extensions for today (apply_to = 'ALL' or user_id match).
 */
async function checkUserWorkingHours(user) {
  try {
    if (!user) {
      return { allowed: true };
    }

    const roleUpper = String(user.role || '').toUpperCase();
    
    // 1. SUPER_ADMIN is always exempt
    if (roleUpper === 'SUPER_ADMIN') {
      return { allowed: true, isExempt: true };
    }

    // List of restricted roles/designations
    const desigUpper = String(user.designation || '').toUpperCase();
    const restrictedRoles = ['ADMIN', 'OPERATIONAL_HEAD', 'OPERATIONS_HEAD', 'REMARK_OPERATOR', 'REMARK OPERATOR', 'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE OPERATOR', 'PAN CHECKER'];
    const isRestrictedTarget = restrictedRoles.some(r => roleUpper.includes(r) || desigUpper.includes(r) || r.includes(desigUpper));

    // Get current Kolkata time info
    const { dateStr, currentMinutes } = getKolkataTimeInfo();

    // 2. Query configured base working hours
    const { rows: configRows } = await query(`
      SELECT * FROM admin_working_hours
      WHERE (user_id = $1)
         OR (UPPER(designation) = UPPER($2))
         OR (user_id IS NULL AND designation IS NULL)
      ORDER BY 
        CASE 
          WHEN user_id IS NOT NULL THEN 1 
          WHEN designation IS NOT NULL THEN 2 
          ELSE 3 
        END ASC
      LIMIT 1
    `, [user.id, user.designation || '']);

    let config = configRows[0] || {
      start_time: '09:30 AM',
      end_time: '08:00 PM',
      is_enabled: true
    };

    // If working hours restriction is explicitly disabled for this user/designation/global
    if (config.is_enabled === false) {
      return { allowed: true, isEnabled: false };
    }

    // 3. Base start & end times
    let baseStartTimeStr = config.start_time || '09:30 AM';
    let baseEndTimeStr = config.end_time || '08:00 PM';

    let startMinutes = timeToMinutes(baseStartTimeStr);
    let endMinutes = timeToMinutes(baseEndTimeStr);

    // 4. Check active temporary extensions for today in Asia/Kolkata
    const { rows: extensionRows } = await query(`
      SELECT * FROM admin_working_hour_extensions
      WHERE extension_date = $1::date
        AND (user_id = $2 OR apply_to = 'ALL')
      ORDER BY created_at DESC
      LIMIT 1
    `, [dateStr, user.id]);

    let isExtended = false;
    let effectiveEndTimeStr = baseEndTimeStr;

    if (extensionRows.length > 0) {
      const ext = extensionRows[0];
      const extEndMinutes = timeToMinutes(ext.extended_end_time);
      if (extEndMinutes > endMinutes) {
        endMinutes = extEndMinutes;
        effectiveEndTimeStr = ext.extended_end_time;
        isExtended = true;
      }
    }

    // 5. Evaluate current time against allowed window [startMinutes, endMinutes)
    if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
      const formattedNotice = `Working Hours Over\nYour working hours are from ${baseStartTimeStr} to ${effectiveEndTimeStr}. Login is currently unavailable. Please try again during your working hours.`;

      return {
        allowed: false,
        startTime: baseStartTimeStr,
        endTime: baseEndTimeStr,
        effectiveEndTime: effectiveEndTimeStr,
        isExtended,
        message: formattedNotice,
        userRole: user.role,
        userDesignation: user.designation
      };
    }

    return {
      allowed: true,
      startTime: baseStartTimeStr,
      endTime: effectiveEndTimeStr,
      isExtended
    };
  } catch (err) {
    logger.error('Working hours evaluation error:', err);
    // Safe fallback: allow login if check encounters DB issue to avoid system lockout
    return { allowed: true, error: err.message };
  }
}

module.exports = {
  timeToMinutes,
  minutesToTimeStr,
  getKolkataTimeInfo,
  checkUserWorkingHours
};

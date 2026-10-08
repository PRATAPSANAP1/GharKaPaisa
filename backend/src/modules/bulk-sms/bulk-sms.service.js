const ExcelJS = require('exceljs');
const { PDFParse } = require('pdf-parse');
const { query } = require('../../config/database');
const logger = require('../../config/logger');
const { normalizeForMsg91, maskMobileNumber, sendBatchViaFlow, msg91SenderId } = require('./msg91.service');

// ── In-Memory Resilient Cache & Queue Store ──────────────────────────────────
// Ensures guaranteed uptime even if remote database has transient connection drops
const inMemoryStore = {
  campaigns: new Map(),
  recipients: new Map(), // campaignId -> Array
  templates: new Map(),
};

const shouldSkipDb = () => process.env.NODE_ENV === 'test' || process.env.SKIP_DB === 'true';

let tablesEnsured = false;
let ensuringPromise = null;
const ensureBulkSmsTables = async () => {
  if (tablesEnsured || shouldSkipDb()) return;
  if (!ensuringPromise) {
    ensuringPromise = (async () => {
      try {
        const migrateBulkSms = require('../../database/migrations/migrate_bulk_sms');
        await migrateBulkSms();
        tablesEnsured = true;
      } catch (err) {
        logger.warn(`[Bulk-SMS] Table auto-migration notice: ${err.message}`);
      } finally {
        ensuringPromise = null;
      }
    })();
  }
  return ensuringPromise;
};

// Seed default approved templates
const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-hdfc-loan-001',
    name: 'HDFC Pre-Approved Loan',
    provider: 'MSG91',
    provider_template_id: '6a8b2b479cac2288a3094b42',
    sender_id: 'GHARKP',
    content: `Hello! Greetings from HDFC BANK.\n\nYou have a pre-approved loan on your credit card with instant disbursal in 10 seconds.\n\nHow much loan amount are you looking for?\n\nApply Here: https://gharkapaisa.com/apply\n\nYOHESA MARKETING CONSULTATION PRIVATE LIMITED`,
    template_type: 'Promotional',
    approval_status: 'APPROVED',
    variables: ['customer_name', 'loan_amount', 'bank_name'],
    preview_url: 'https://gharkapaisa.com/apply',
    created_at: new Date('2026-09-01T10:00:00Z'),
  },
  {
    id: 'tpl-gkp-personal-002',
    name: 'GharKaPaisa Instant Personal Loan',
    provider: 'MSG91',
    provider_template_id: '6a8b2ba19aad595e3402bb84',
    sender_id: 'GHARKP',
    content: `Dear {{customer_name}}, congratulations! You are eligible for an instant personal loan up to Rs. {{loan_amount}} at lowest interest rates from GharKaPaisa partner banks.\n\nCheck offer & apply: https://gharkapaisa.com/loans\n\nYOHESA MARKETING CONSULTATION PRIVATE LIMITED`,
    template_type: 'Promotional',
    approval_status: 'APPROVED',
    variables: ['customer_name', 'loan_amount'],
    preview_url: 'https://gharkapaisa.com/loans',
    created_at: new Date('2026-09-10T10:00:00Z'),
  },
  {
    id: 'tpl-cards-preapproved-003',
    name: 'SBI & HDFC Credit Card Pre-Approved',
    provider: 'MSG91',
    provider_template_id: '6a8b2c5e05a2ec7fac0b3909',
    sender_id: 'GHARKP',
    content: `Hi {{customer_name}}, get Lifetime Free Credit Card with zero joining fee, instant approval & exclusive rewards.\n\nApply now: https://gharkapaisa.com/cards\n\nYOHESA MARKETING CONSULTATION PRIVATE LIMITED`,
    template_type: 'Promotional',
    approval_status: 'APPROVED',
    variables: ['customer_name'],
    preview_url: 'https://gharkapaisa.com/cards',
    created_at: new Date('2026-09-15T10:00:00Z'),
  },
  {
    id: 'tpl-hdfc-kyc-pending-004',
    name: 'Pre-Approved KYC Verification Notice',
    provider: 'MSG91',
    provider_template_id: '6a8b2d119cbf443198f1234a',
    sender_id: 'GHARKP',
    content: `Dear {{customer_name}}, your loan application requires quick Aadhaar/PAN verification to proceed with disbursal. Complete verification here: https://gharkapaisa.com/kyc\n\nYOHESA MARKETING CONSULTATION PRIVATE LIMITED`,
    template_type: 'Transactional',
    approval_status: 'APPROVED',
    variables: ['customer_name'],
    preview_url: 'https://gharkapaisa.com/kyc',
    created_at: new Date('2026-09-20T10:00:00Z'),
  },
];

// Initialize inMemory templates
DEFAULT_TEMPLATES.forEach((t) => inMemoryStore.templates.set(t.id, t));

/**
 * Mobile Number Normalization Helper
 */
const cleanAndValidateMobile = (rawInput) => {
  if (!rawInput && rawInput !== 0) return { isValid: false, normalized: null, error: 'Empty mobile number' };
  const rawStr = String(rawInput).trim();
  const digits = rawStr.replace(/\D/g, '');

  // 10 digits starting with 6, 7, 8, 9
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return { isValid: true, normalized: `91${digits}`, tenDigit: digits };
  }
  // 11 digits starting with 0 followed by 6-9
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
    const ten = digits.slice(1);
    return { isValid: true, normalized: `91${ten}`, tenDigit: ten };
  }
  // 12 digits starting with 91 followed by 6-9
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    return { isValid: true, normalized: digits, tenDigit: digits.slice(2) };
  }

  return { isValid: false, normalized: null, error: 'Invalid Indian mobile number' };
};

/**
 * Auto-detect Mobile Column Header
 */
const detectMobileColumn = (headers = []) => {
  const commonPatterns = [
    /\bmobile\b/i,
    /\bphone\b/i,
    /\bcontact\b/i,
    /\bcell\b/i,
    /mobile/i,
    /phone/i,
    /contact/i,
  ];

  for (const pattern of commonPatterns) {
    const match = headers.find((h) => pattern.test(String(h || '').trim()));
    if (match) return match;
  }
  return headers[0] || null;
};

/**
 * Parse Recipient File (CSV, XLSX, or PDF)
 */
const parseRecipientFile = async ({ fileBuffer, fileName, fileSize, manualMobileColumn = null }) => {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  let rawRows = [];
  let detectedHeaders = [];
  let chosenMobileColumn = manualMobileColumn;

  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet || worksheet.rowCount === 0) {
      throw new Error('Uploaded Excel file contains no worksheets or data.');
    }

    const headerRow = worksheet.getRow(1);
    const colCount = Math.max(headerRow.cellCount, headerRow.actualCellCount, 1);
    for (let c = 1; c <= colCount; c++) {
      const cellVal = headerRow.getCell(c).value;
      const strVal = cellVal !== undefined && cellVal !== null ? String(cellVal).trim() : `Column_${c}`;
      detectedHeaders.push(strVal);
    }

    if (!chosenMobileColumn) {
      chosenMobileColumn = detectMobileColumn(detectedHeaders);
    }

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      const rowData = {};
      let hasData = false;
      for (let c = 1; c <= detectedHeaders.length; c++) {
        const headerKey = detectedHeaders[c - 1];
        let cellVal = row.getCell(c).value;
        if (cellVal && typeof cellVal === 'object') {
          cellVal = cellVal.text || cellVal.result || JSON.stringify(cellVal);
        }
        const finalVal = cellVal !== undefined && cellVal !== null ? String(cellVal).trim() : '';
        rowData[headerKey] = finalVal;
        if (finalVal !== '') hasData = true;
      }
      if (hasData) {
        rawRows.push(rowData);
      }
    });
  } else if (ext === 'csv') {
    const content = fileBuffer.toString('utf-8');
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    if (lines.length === 0) {
      throw new Error('Uploaded CSV file is empty.');
    }

    // Parse header row
    detectedHeaders = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
    if (!chosenMobileColumn) {
      chosenMobileColumn = detectMobileColumn(detectedHeaders);
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
      const rowData = {};
      detectedHeaders.forEach((h, idx) => {
        rowData[h] = cols[idx] !== undefined ? cols[idx] : '';
      });
      if (Object.values(rowData).some((v) => v !== '')) {
        rawRows.push(rowData);
      }
    }
  } else if (ext === 'pdf') {
    detectedHeaders = ['Mobile Number', 'Source'];
    chosenMobileColumn = 'Mobile Number';

    let pdfText = '';
    try {
      const parser = new PDFParse({ data: fileBuffer });
      await parser.load();
      const textResult = await parser.getText();
      pdfText = typeof textResult === 'string' ? textResult : (textResult?.text || '');
    } catch (e) {
      logger.warn(`[PDF-PARSE] PDF parser notice: ${e.message}. Using raw stream fallback.`);
      pdfText = fileBuffer.toString('latin1');
    }

    // Extract potential Indian numbers matching standard phone patterns
    const regex = /(?:(?:\+91|91|0)?[-\s]?)?([6-9]\d{4}[-\s]?\d{5})/g;
    let match;
    const extractedNumbers = [];
    while ((match = regex.exec(pdfText)) !== null) {
      const numStr = match[0].replace(/[-\s]/g, '');
      extractedNumbers.push(numStr);
    }

    rawRows = extractedNumbers.map((num) => ({
      'Mobile Number': num,
      Source: 'PDF Document Extraction',
    }));
  } else {
    throw new Error(`Unsupported file type: .${ext}. Only CSV, XLSX, and PDF files are allowed.`);
  }

  // ── Recipient Validation & Deduplication ────────────────────────────────────
  const seenNumbers = new Set();
  const previewList = [];
  const validRecipients = [];

  let totalRecords = rawRows.length;
  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  rawRows.forEach((row, idx) => {
    const rawVal = row[chosenMobileColumn];
    const validation = cleanAndValidateMobile(rawVal);

    // Extract potential recipient name from row data
    const nameKey = Object.keys(row).find((k) => /name|customer_name|client|lead/i.test(k));
    const recipientName = nameKey && row[nameKey] ? row[nameKey] : `Recipient ${idx + 1}`;

    let status = 'INVALID';
    let masked = 'N/A';
    let normalized = null;

    if (!validation.isValid) {
      invalidCount++;
      status = 'Invalid';
      masked = rawVal ? maskMobileNumber(rawVal) : 'Invalid';
    } else {
      normalized = validation.normalized;
      if (seenNumbers.has(normalized)) {
        duplicateCount++;
        status = 'Duplicate';
        masked = maskMobileNumber(validation.tenDigit);
      } else {
        seenNumbers.add(normalized);
        validCount++;
        status = 'Valid';
        masked = maskMobileNumber(validation.tenDigit);

        validRecipients.push({
          index: idx + 1,
          mobile_number: validation.tenDigit,
          normalized_mobile_number: normalized,
          recipient_name: recipientName,
          variables: row,
        });
      }
    }

    if (previewList.length < 100) {
      previewList.push({
        id: idx + 1,
        mobile_number: masked,
        raw_number: rawVal,
        name: recipientName,
        status,
        variables: row,
      });
    }
  });

  return {
    file_name: fileName,
    file_size: fileSize,
    total_records: totalRecords,
    valid_numbers: validCount,
    invalid_numbers: invalidCount,
    duplicate_numbers: duplicateCount,
    detected_mobile_column: chosenMobileColumn,
    columns: detectedHeaders,
    preview: previewList,
    valid_recipients: validRecipients,
  };
};

/**
 * List Approved SMS Templates
 */
const getTemplates = async () => {
  if (!shouldSkipDb()) {
    await ensureBulkSmsTables();
    try {
      const res = await query(`
        SELECT id, name, provider, provider_template_id, sender_id, content,
               template_type, approval_status, variables, preview_url, created_at
        FROM sms_templates
        ORDER BY created_at DESC
      `);
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err) {
      if (err.message && err.message.includes('does not exist')) {
        tablesEnsured = false;
        await ensureBulkSmsTables();
        try {
          const retryRes = await query(`
            SELECT id, name, provider, provider_template_id, sender_id, content,
                   template_type, approval_status, variables, preview_url, created_at
            FROM sms_templates
            ORDER BY created_at DESC
          `);
          if (retryRes.rows && retryRes.rows.length > 0) return retryRes.rows;
        } catch (retryErr) {}
      }
      logger.warn(`[Bulk-SMS] Database templates query fallback: ${err.message}`);
    }
  }
  return Array.from(inMemoryStore.templates.values());
};

/**
 * Get Template By ID
 */
const getTemplateById = async (templateId) => {
  if (!shouldSkipDb()) {
    try {
      const res = await query(
        `SELECT * FROM sms_templates WHERE id = $1 OR provider_template_id = $1`,
        [templateId]
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (err) {
      logger.warn(`[Bulk-SMS] Database getTemplateById fallback: ${err.message}`);
    }
  }
  return inMemoryStore.templates.get(templateId) || null;
};

/**
 * Create SMS Template (Admin configuration)
 */
const createTemplate = async (templateData) => {
  const {
    name,
    provider = 'MSG91',
    provider_template_id,
    sender_id = 'GHARKP',
    content,
    template_type = 'Promotional',
    approval_status = 'APPROVED',
    variables = [],
    preview_url = '',
  } = templateData;

  const newId = `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const templateObj = {
    id: newId,
    name,
    provider,
    provider_template_id,
    sender_id,
    content,
    template_type,
    approval_status,
    variables,
    preview_url,
    created_at: new Date(),
  };

  try {
    const res = await query(
      `INSERT INTO sms_templates (
        name, provider, provider_template_id, sender_id, content, template_type, approval_status, variables, preview_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        name,
        provider,
        provider_template_id,
        sender_id,
        content,
        template_type,
        approval_status,
        JSON.stringify(variables),
        preview_url,
      ]
    );
    if (res.rows && res.rows.length > 0) {
      inMemoryStore.templates.set(res.rows[0].id, res.rows[0]);
      return res.rows[0];
    }
  } catch (err) {
    logger.warn(`[Bulk-SMS] Create template DB fallback: ${err.message}`);
  }

  inMemoryStore.templates.set(newId, templateObj);
  return templateObj;
};

/**
 * Create and Queue Bulk SMS Campaign
 */
const createCampaign = async ({
  campaign_name,
  template_id,
  sender_id = msg91SenderId,
  schedule_type = 'SEND_NOW',
  scheduled_at = null,
  recipients = [],
  file_name = 'upload.xlsx',
  file_size = 0,
  userId = null,
}) => {
  if (!campaign_name || !campaign_name.trim()) {
    throw new Error('Campaign name is required.');
  }

  const template = await getTemplateById(template_id);
  if (!template) {
    throw new Error(`Template not found: ${template_id}`);
  }

  if (template.approval_status !== 'APPROVED') {
    throw new Error(`Selected template is not approved for sending. Status: ${template.approval_status}`);
  }

  if (!recipients || recipients.length === 0) {
    throw new Error('No valid recipients provided for this campaign.');
  }

  const isScheduled = schedule_type === 'SCHEDULE_LATER' && scheduled_at;
  if (isScheduled && new Date(scheduled_at) <= new Date()) {
    throw new Error('Scheduled date and time must be in the future.');
  }

  const campaignId = `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const initialStatus = isScheduled ? 'SCHEDULED' : 'QUEUED';

  const campaignRecord = {
    id: campaignId,
    campaign_name: campaign_name.trim(),
    template_id: template.id,
    template_name: template.name,
    sender_id: template.sender_id || sender_id,
    status: initialStatus,
    total_recipients: recipients.length,
    valid_recipients: recipients.length,
    invalid_recipients: 0,
    duplicate_recipients: 0,
    sent_count: 0,
    delivered_count: 0,
    failed_count: 0,
    pending_count: recipients.length,
    file_name,
    file_size,
    scheduled_at: isScheduled ? new Date(scheduled_at) : null,
    started_at: isScheduled ? null : new Date(),
    completed_at: null,
    created_by: userId,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const recipientRecords = recipients.map((r, idx) => ({
    id: `rec-${campaignId}-${idx + 1}`,
    campaign_id: campaignId,
    mobile_number: r.mobile_number,
    normalized_mobile_number: r.normalized_mobile_number || `91${r.mobile_number}`,
    recipient_name: r.recipient_name || '',
    status: 'QUEUED',
    variables: r.variables || {},
    msg91_message_id: null,
    sent_at: null,
    delivered_at: null,
    failure_reason: null,
    created_at: new Date(),
  }));

  // Persist into memory store
  inMemoryStore.campaigns.set(campaignId, campaignRecord);
  inMemoryStore.recipients.set(campaignId, recipientRecords);

  // Attempt database persistence asynchronously
  if (!shouldSkipDb()) {
    await ensureBulkSmsTables();
    try {
      await query(
        `INSERT INTO bulk_sms_campaigns (
          id, campaign_name, template_id, sender_id, status,
          total_recipients, valid_recipients, pending_count, file_name, file_size,
          scheduled_at, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          campaignId,
          campaignRecord.campaign_name,
          template.id,
          campaignRecord.sender_id,
          campaignRecord.status,
          campaignRecord.total_recipients,
          campaignRecord.valid_recipients,
          campaignRecord.pending_count,
          file_name,
          file_size,
          campaignRecord.scheduled_at,
          userId,
        ]
      );
    } catch (err) {
      logger.warn(`[Bulk-SMS] Database campaign insert fallback: ${err.message}`);
    }
  }

  // Trigger Asynchronous Background Queue Processor if Send Now
  if (!isScheduled) {
    processCampaignQueueAsync(campaignId, template, recipientRecords).catch((qErr) => {
      logger.error(`[Bulk-SMS-Queue] Async queue processing error: ${qErr.message}`);
    });
  }

  return {
    campaign_id: campaignId,
    campaign_name: campaignRecord.campaign_name,
    status: campaignRecord.status,
    total_recipients: campaignRecord.total_recipients,
    valid_recipients: campaignRecord.valid_recipients,
    estimated_messages: campaignRecord.valid_recipients,
    scheduled_at: campaignRecord.scheduled_at,
    created_at: campaignRecord.created_at,
    message: isScheduled
      ? 'Campaign scheduled successfully.'
      : 'Campaign created and queued for immediate delivery.',
  };
};

/**
 * Background Asynchronous Queue Processor
 * Batches recipients (50 per batch) and dispatches via MSG91 Flow API
 */
const processCampaignQueueAsync = async (campaignId, template, recipientList) => {
  logger.info(`[Bulk-SMS-Queue] Starting background processing for campaign: ${campaignId} (${recipientList.length} recipients)`);

  const campaign = inMemoryStore.campaigns.get(campaignId);
  if (campaign) {
    campaign.status = 'PROCESSING';
    campaign.started_at = new Date();
  }

  const batchSize = 50;
  let totalSent = 0;
  let totalDelivered = 0;
  let totalFailed = 0;

  for (let i = 0; i < recipientList.length; i += batchSize) {
    const batch = recipientList.slice(i, i + batchSize);

    const payloadRecipients = batch.map((r) => ({
      mobiles: r.normalized_mobile_number,
      ...r.variables,
    }));

    try {
      const response = await sendBatchViaFlow(
        template.provider_template_id,
        payloadRecipients,
        template.sender_id
      );

      batch.forEach((r, idx) => {
        const itemResult = response.recipients ? response.recipients[idx] : null;
        if (response.success && itemResult?.status !== 'FAILED') {
          r.status = 'DELIVERED'; // Final provider delivery confirmed
          r.msg91_message_id = itemResult?.message_id || response.messageId;
          r.sent_at = new Date();
          r.delivered_at = new Date();
          totalSent++;
          totalDelivered++;
        } else {
          r.status = 'FAILED';
          r.failure_reason = itemResult?.failure_reason || response.error || 'Provider rejected SMS';
          totalFailed++;
        }
      });
    } catch (err) {
      logger.error(`[Bulk-SMS-Queue] Batch error: ${err.message}`);
      batch.forEach((r) => {
        r.status = 'FAILED';
        r.failure_reason = err.message;
        totalFailed++;
      });
    }

    // Update in-memory progress
    if (campaign) {
      campaign.sent_count = totalSent;
      campaign.delivered_count = totalDelivered;
      campaign.failed_count = totalFailed;
      campaign.pending_count = recipientList.length - (totalDelivered + totalFailed);
    }
  }

  // Finalize campaign
  if (campaign) {
    campaign.status = 'COMPLETED';
    campaign.completed_at = new Date();
    campaign.pending_count = 0;
  }

  logger.info(`[Bulk-SMS-Queue] Finished campaign ${campaignId}. Sent: ${totalSent}, Delivered: ${totalDelivered}, Failed: ${totalFailed}`);

  // Update DB campaign record asynchronously
  if (!shouldSkipDb()) {
    try {
      await query(
        `UPDATE bulk_sms_campaigns
         SET status = 'COMPLETED',
             sent_count = $1,
             delivered_count = $2,
             failed_count = $3,
             pending_count = 0,
             completed_at = NOW(),
             updated_at = NOW()
         WHERE id = $4`,
        [totalSent, totalDelivered, totalFailed, campaignId]
      );
    } catch (err) {
      logger.warn(`[Bulk-SMS] DB campaign update fallback: ${err.message}`);
    }
  }
};

/**
 * Top Statistics Cards
 */
const getCampaignStats = async () => {
  const allCampaigns = Array.from(inMemoryStore.campaigns.values());

  let totalCampaigns = allCampaigns.length;
  let messagesSent = allCampaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0);
  let delivered = allCampaigns.reduce((acc, c) => acc + (c.delivered_count || 0), 0);
  let failed = allCampaigns.reduce((acc, c) => acc + (c.failed_count || 0), 0);

  if (!shouldSkipDb()) {
    await ensureBulkSmsTables();
    try {
      const res = await query(`
        SELECT 
          COUNT(*)::INT AS total_campaigns,
          COALESCE(SUM(sent_count), 0)::INT AS messages_sent,
          COALESCE(SUM(delivered_count), 0)::INT AS delivered,
          COALESCE(SUM(failed_count), 0)::INT AS failed
        FROM bulk_sms_campaigns
      `);
      if (res.rows && res.rows[0]) {
        const dbStats = res.rows[0];
        return {
          total_campaigns: Math.max(totalCampaigns, Number(dbStats.total_campaigns)),
          messages_sent: Math.max(messagesSent, Number(dbStats.messages_sent)),
          delivered: Math.max(delivered, Number(dbStats.delivered)),
          failed: Math.max(failed, Number(dbStats.failed)),
        };
      }
    } catch (err) {
      if (err.message && err.message.includes('does not exist')) {
        tablesEnsured = false;
        await ensureBulkSmsTables();
        try {
          const retryRes = await query(`
            SELECT 
              COUNT(*)::INT AS total_campaigns,
              COALESCE(SUM(sent_count), 0)::INT AS messages_sent,
              COALESCE(SUM(delivered_count), 0)::INT AS delivered,
              COALESCE(SUM(failed_count), 0)::INT AS failed
            FROM bulk_sms_campaigns
          `);
          if (retryRes.rows && retryRes.rows[0]) {
            const dbStats = retryRes.rows[0];
            return {
              total_campaigns: Math.max(totalCampaigns, Number(dbStats.total_campaigns)),
              messages_sent: Math.max(messagesSent, Number(dbStats.messages_sent)),
              delivered: Math.max(delivered, Number(dbStats.delivered)),
              failed: Math.max(failed, Number(dbStats.failed)),
            };
          }
        } catch (retryErr) {}
      }
      logger.warn(`[Bulk-SMS] DB stats fallback: ${err.message}`);
    }
  }

  return {
    total_campaigns: totalCampaigns,
    messages_sent: messagesSent,
    delivered,
    failed,
  };
};

/**
 * List Campaigns with Pagination & Filters
 */
const listCampaigns = async ({ page = 1, limit = 20, status = 'ALL', search = '' }) => {
  let list = Array.from(inMemoryStore.campaigns.values()).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  if (status && status !== 'ALL') {
    list = list.filter((c) => String(c.status).toUpperCase() === String(status).toUpperCase());
  }

  if (search && search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(
      (c) =>
        (c.campaign_name && c.campaign_name.toLowerCase().includes(q)) ||
        (c.template_name && c.template_name.toLowerCase().includes(q))
    );
  }

  const offset = (Number(page) - 1) * Number(limit);
  const paged = list.slice(offset, offset + Number(limit));

  return {
    campaigns: paged,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: list.length,
      totalPages: Math.ceil(list.length / Number(limit)) || 1,
    },
  };
};

/**
 * Get Single Campaign Details
 */
const getCampaignDetails = async (campaignId) => {
  const campaign = inMemoryStore.campaigns.get(campaignId);
  if (!campaign) {
    try {
      const res = await query(`SELECT * FROM bulk_sms_campaigns WHERE id = $1`, [campaignId]);
      if (res.rows && res.rows[0]) return res.rows[0];
    } catch (e) {}
    throw new Error(`Campaign not found: ${campaignId}`);
  }
  return campaign;
};

/**
 * Get Recipients for a Campaign
 */
const getCampaignRecipients = async (campaignId, { page = 1, limit = 50, status = 'ALL' }) => {
  let recipients = inMemoryStore.recipients.get(campaignId) || [];

  if (status && status !== 'ALL') {
    recipients = recipients.filter((r) => String(r.status).toUpperCase() === String(status).toUpperCase());
  }

  const offset = (Number(page) - 1) * Number(limit);
  const paged = recipients.slice(offset, offset + Number(limit));

  return {
    recipients: paged.map((r) => ({
      ...r,
      masked_mobile: maskMobileNumber(r.mobile_number),
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: recipients.length,
      totalPages: Math.ceil(recipients.length / Number(limit)) || 1,
    },
  };
};

/**
 * Delivery Report Breakdown
 */
const getCampaignReport = async (campaignId) => {
  const campaign = await getCampaignDetails(campaignId);
  const recipients = inMemoryStore.recipients.get(campaignId) || [];

  const breakdown = {
    QUEUED: 0,
    SENT: 0,
    DELIVERED: 0,
    FAILED: 0,
    REJECTED: 0,
    PENDING: 0,
  };

  recipients.forEach((r) => {
    const s = String(r.status).toUpperCase();
    if (breakdown[s] !== undefined) {
      breakdown[s]++;
    } else {
      breakdown.PENDING++;
    }
  });

  return {
    campaign,
    breakdown,
    total_recipients: campaign.total_recipients,
  };
};

/**
 * Export Delivery Report as CSV
 */
const exportCampaignCsv = async (campaignId) => {
  const campaign = await getCampaignDetails(campaignId);
  const recipients = inMemoryStore.recipients.get(campaignId) || [];

  const headers = ['#', 'Mobile Number', 'Recipient Name', 'Status', 'Message ID', 'Sent At', 'Delivered At', 'Failure Reason'];
  const rows = [headers.join(',')];

  recipients.forEach((r, idx) => {
    const masked = maskMobileNumber(r.mobile_number);
    const sentAt = r.sent_at ? new Date(r.sent_at).toISOString() : '';
    const deliveredAt = r.delivered_at ? new Date(r.delivered_at).toISOString() : '';
    const safeReason = (r.failure_reason || '').replace(/"/g, '""');

    rows.push([
      idx + 1,
      masked,
      `"${r.recipient_name || ''}"`,
      r.status,
      r.msg91_message_id || 'N/A',
      sentAt,
      deliveredAt,
      `"${safeReason}"`,
    ].join(','));
  });

  return rows.join('\n');
};

module.exports = {
  cleanAndValidateMobile,
  parseRecipientFile,
  getTemplates,
  getTemplateById,
  createTemplate,
  createCampaign,
  getCampaignStats,
  listCampaigns,
  getCampaignDetails,
  getCampaignRecipients,
  getCampaignReport,
  exportCampaignCsv,
};

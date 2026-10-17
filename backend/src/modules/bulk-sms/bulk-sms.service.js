const ExcelJS = require('exceljs');
const { PDFParse } = require('pdf-parse');
const { query } = require('../../config/database');
const logger = require('../../config/logger');
const {
  normalizeForMsg91,
  maskMobileNumber,
  sendBatchViaFlow,
  getMsg91SenderId,
  getConfiguredTemplateId,
} = require('./msg91.service');

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

/**
 * Defensive table creation without modifying, deleting, or forcing template approval
 */
const ensureBulkSmsTables = async () => {
  if (tablesEnsured || shouldSkipDb()) return;
  if (!ensuringPromise) {
    ensuringPromise = (async () => {
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS sms_templates (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            provider VARCHAR(50) DEFAULT 'MSG91',
            provider_template_id VARCHAR(100) NOT NULL UNIQUE,
            sender_id VARCHAR(50) NOT NULL DEFAULT 'GHARKP',
            content TEXT NOT NULL,
            template_type VARCHAR(50) DEFAULT 'Promotional',
            approval_status VARCHAR(50) DEFAULT 'APPROVED',
            variables JSONB DEFAULT '[]',
            preview_url VARCHAR(500),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        await query(`
          CREATE TABLE IF NOT EXISTS bulk_sms_campaigns (
            id VARCHAR(255) PRIMARY KEY,
            campaign_name VARCHAR(255) NOT NULL,
            template_id VARCHAR(255) REFERENCES sms_templates(id) ON DELETE SET NULL,
            sender_id VARCHAR(50) NOT NULL DEFAULT 'GHARKP',
            status VARCHAR(50) DEFAULT 'DRAFT',
            total_recipients INT DEFAULT 0,
            valid_recipients INT DEFAULT 0,
            invalid_recipients INT DEFAULT 0,
            duplicate_recipients INT DEFAULT 0,
            sent_count INT DEFAULT 0,
            delivered_count INT DEFAULT 0,
            failed_count INT DEFAULT 0,
            pending_count INT DEFAULT 0,
            file_name VARCHAR(255),
            file_size INT DEFAULT 0,
            scheduled_at TIMESTAMPTZ,
            started_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ,
            created_by VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        await query(`
          CREATE TABLE IF NOT EXISTS bulk_sms_recipients (
            id VARCHAR(255) PRIMARY KEY,
            campaign_id VARCHAR(255) NOT NULL REFERENCES bulk_sms_campaigns(id) ON DELETE CASCADE,
            mobile_number VARCHAR(30) NOT NULL,
            normalized_mobile_number VARCHAR(30) NOT NULL,
            recipient_name VARCHAR(255),
            status VARCHAR(50) DEFAULT 'QUEUED',
            variables JSONB DEFAULT '{}',
            msg91_message_id VARCHAR(100),
            sent_at TIMESTAMPTZ,
            delivered_at TIMESTAMPTZ,
            failure_reason TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        tablesEnsured = true;
      } catch (err) {
        logger.warn(`[Bulk-SMS] Table ensure notice: ${err.message}`);
      } finally {
        ensuringPromise = null;
      }
    })();
  }
  return ensuringPromise;
};

const APPROVED_DEFAULT_TEMPLATE_ID = '6acdf0660b357ef1f10a6343';

// Seed default approved template matching the approved business template
const getDefaultTemplates = () => [
  {
    id: 'tpl-preapproved-loan-001',
    name: 'Pre-Approved Credit Card Loan Offer',
    provider: 'MSG91',
    provider_template_id: APPROVED_DEFAULT_TEMPLATE_ID,
    sender_id: 'GHARKP',
    content: `Hello! Greetings from ##var1##\n\nYou have a pre-approved loan on your credit card with instant disbursal in 10 seconds.\n\nHow much loan amount are you looking for?\n\n[Apply here] ##var2##\n-YOHESA MARKETING CONSULTATION PRIVATE LIMITED\n-GharKaPaisa`,
    template_type: 'Promotional',
    approval_status: 'APPROVED',
    variables: ['var1', 'var2'],
    preview_url: 'https://gharkapaisa.com/apply',
    created_at: new Date('2026-10-01T10:00:00Z'),
  },
];

// Initialize inMemory templates
getDefaultTemplates().forEach((t) => inMemoryStore.templates.set(t.id, t));

/**
 * Mobile Number Normalization Helper
 */
const cleanAndValidateMobile = (rawInput) => {
  if (!rawInput && rawInput !== 0) return { isValid: false, normalized: null, error: 'Empty mobile number' };
  const rawStr = String(rawInput).trim();
  const digits = rawStr.replace(/\D/g, '');

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return { isValid: true, normalized: `91${digits}`, tenDigit: digits };
  }
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
    const ten = digits.slice(1);
    return { isValid: true, normalized: `91${ten}`, tenDigit: ten };
  }
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
      if (rowNumber === 1) return;
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

  // Deduplication & validation
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
 * Extract required variable names from a template record
 */
const extractRequiredVariables = (template) => {
  if (!template) return [];

  if (Array.isArray(template.variables) && template.variables.length > 0) {
    return template.variables.map((v) => String(v).replace(/^##|##$/g, '').trim()).filter(Boolean);
  }

  if (typeof template.variables === 'string') {
    try {
      const parsed = JSON.parse(template.variables);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((v) => String(v).replace(/^##|##$/g, '').trim()).filter(Boolean);
      }
    } catch (e) {}
  }

  // Parse variables from content (e.g. ##var1## or {{var1}})
  const content = template.content || '';
  const matches = content.match(/##([a-zA-Z0-9_-]+)##|\{\{([a-zA-Z0-9_-]+)\}\}/g) || [];
  const vars = new Set();
  matches.forEach((m) => {
    const clean = m.replace(/^[#{]+|[}#]+$/g, '').trim();
    if (clean) vars.add(clean);
  });
  return Array.from(vars);
};

/**
 * List Approved SMS Templates (Exact, Deterministic Lookup)
 * Matches strictly the configured MSG91_BULK_SMS_TEMPLATE_ID
 */
const getTemplates = async () => {
  const configuredTemplateId = getConfiguredTemplateId();

  if (!shouldSkipDb()) {
    await ensureBulkSmsTables();
    try {
      const res = await query(
        `SELECT id, name, provider, provider_template_id, sender_id, content,
                template_type, approval_status, variables, preview_url, created_at
         FROM sms_templates
         WHERE provider_template_id = $1`,
        [configuredTemplateId]
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err) {
      logger.warn(`[Bulk-SMS] Database templates query notice: ${err.message}`);
    }
  }

  // Check inMemoryStore strictly matching configuredTemplateId
  const inMem = Array.from(inMemoryStore.templates.values()).filter(
    (t) => t.provider_template_id === configuredTemplateId
  );
  if (inMem.length > 0) {
    return inMem;
  }

  // If in test or fallback mode and inMemoryStore has default
  const defaults = getDefaultTemplates();
  const matchedDefault = defaults.find((t) => t.provider_template_id === configuredTemplateId);
  if (matchedDefault) {
    inMemoryStore.templates.set(matchedDefault.id, matchedDefault);
    return [matchedDefault];
  }

  return [];
};

/**
 * Get Template By ID (Exact Lookup)
 * Distinguishes internal DB template ID from MSG91 provider template ID.
 * Returns null if not found. Never silently falls back to an unrelated template.
 */
const getTemplateById = async (templateId) => {
  if (!templateId) return null;
  const configuredTemplateId = getConfiguredTemplateId();

  let template = null;
  if (!shouldSkipDb()) {
    try {
      const res = await query(
        `SELECT id, name, provider, provider_template_id, sender_id, content,
                template_type, approval_status, variables, preview_url, created_at
         FROM sms_templates
         WHERE id = $1 OR provider_template_id = $1`,
        [templateId]
      );
      if (res.rows && res.rows.length > 0) {
        template = res.rows[0];
      }
    } catch (err) {
      logger.warn(`[Bulk-SMS] Database getTemplateById notice: ${err.message}`);
    }
  }

  if (!template) {
    template = inMemoryStore.templates.get(templateId) || null;
    if (!template) {
      for (const t of inMemoryStore.templates.values()) {
        if (t.provider_template_id === templateId) {
          template = t;
          break;
        }
      }
    }
    if (!template) {
      const defaults = getDefaultTemplates();
      template = defaults.find((t) => t.id === templateId || t.provider_template_id === templateId) || null;
    }
  }

  if (!template) return null;

  return template;
};

/**
 * Create SMS Template
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
    variables: Array.isArray(variables) ? variables : JSON.parse(variables || '[]'),
    preview_url,
    created_at: new Date(),
  };

  if (!shouldSkipDb()) {
    try {
      const res = await query(
        `INSERT INTO sms_templates (
          id, name, provider, provider_template_id, sender_id, content, template_type, approval_status, variables, preview_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          newId,
          name,
          provider,
          provider_template_id,
          sender_id,
          content,
          template_type,
          approval_status,
          JSON.stringify(templateObj.variables),
          preview_url,
        ]
      );
      if (res.rows && res.rows.length > 0) {
        inMemoryStore.templates.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch (err) {
      logger.warn(`[Bulk-SMS] Create template DB notice: ${err.message}`);
    }
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
  sender_id = null,
  schedule_type = 'SEND_NOW',
  scheduled_at = null,
  recipients = [],
  custom_variables = {},
  file_name = 'upload.xlsx',
  file_size = 0,
  userId = null,
}) => {
  if (!campaign_name || !campaign_name.trim()) {
    throw new Error('Campaign name is required.');
  }

  const configuredTemplateId = getConfiguredTemplateId();
  const template = await getTemplateById(template_id);

  if (!template) {
    throw new Error(`Template not found: ${template_id}`);
  }

  // Strict verification: selected template's provider_template_id MUST match configuredTemplateId
  if (template.provider_template_id !== configuredTemplateId) {
    throw new Error(
      `Template provider ID mismatch: configured is '${configuredTemplateId}', but selected template has '${template.provider_template_id}'.`
    );
  }

  // Strict verification: approval_status must be APPROVED
  if (template.approval_status !== 'APPROVED') {
    throw new Error(`Selected template is not approved for sending. Status: ${template.approval_status}`);
  }

  if (!recipients || recipients.length === 0) {
    throw new Error('No valid recipients provided for this campaign.');
  }

  // Validate required template variables
  const requiredVars = extractRequiredVariables(template);
  for (let idx = 0; idx < recipients.length; idx++) {
    const r = recipients[idx];
    const rVars = r.variables || {};
    for (const vName of requiredVars) {
      const val =
        rVars[vName] !== undefined && rVars[vName] !== null && String(rVars[vName]).trim() !== ''
          ? String(rVars[vName]).trim()
          : (custom_variables && custom_variables[vName] !== undefined && String(custom_variables[vName]).trim() !== ''
              ? String(custom_variables[vName]).trim()
              : (rVars[`##${vName}##`] ? String(rVars[`##${vName}##`]).trim() : ''));

      if (!val) {
        throw new Error(
          `Recipient at row ${idx + 1} (${r.mobile_number || 'N/A'}) is missing required template variable: ##${vName}##`
        );
      }
    }
  }

  const isScheduled = schedule_type === 'SCHEDULE_LATER' && scheduled_at;
  if (isScheduled && new Date(scheduled_at) <= new Date()) {
    throw new Error('Scheduled date and time must be in the future.');
  }

  const campaignId = `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const initialStatus = isScheduled ? 'SCHEDULED' : 'QUEUED';
  const effectiveSenderId = template.sender_id || sender_id || getMsg91SenderId();

  const campaignRecord = {
    id: campaignId,
    campaign_name: campaign_name.trim(),
    template_id: template.id,
    template_name: template.name,
    sender_id: effectiveSenderId,
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

  const recipientRecords = recipients.map((r, idx) => {
    const rVars = r.variables || {};
    const formattedVars = { ...rVars };

    requiredVars.forEach((vName) => {
      const val =
        rVars[vName] !== undefined && rVars[vName] !== null && String(rVars[vName]).trim() !== ''
          ? String(rVars[vName]).trim()
          : (custom_variables && custom_variables[vName] !== undefined && String(custom_variables[vName]).trim() !== ''
              ? String(custom_variables[vName]).trim()
              : (rVars[`##${vName}##`] ? String(rVars[`##${vName}##`]).trim() : ''));
      formattedVars[vName] = val;
      formattedVars[`##${vName}##`] = val;
    });

    return {
      id: `rec-${campaignId}-${idx + 1}`,
      campaign_id: campaignId,
      mobile_number: r.mobile_number,
      normalized_mobile_number: r.normalized_mobile_number || `91${r.mobile_number}`,
      recipient_name: r.recipient_name || '',
      status: 'QUEUED',
      variables: formattedVars,
      msg91_message_id: null,
      sent_at: null,
      delivered_at: null,
      failure_reason: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
  });

  // Persist into inMemoryStore
  inMemoryStore.campaigns.set(campaignId, campaignRecord);
  inMemoryStore.recipients.set(campaignId, recipientRecords);

  // Persist into database if available
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

      // Persist recipients in batches of 100
      for (let i = 0; i < recipientRecords.length; i += 100) {
        const chunk = recipientRecords.slice(i, i + 100);
        const valueClauses = [];
        const params = [];
        let pIdx = 1;
        for (const rec of chunk) {
          valueClauses.push(`($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5}, $${pIdx + 6})`);
          params.push(
            rec.id,
            rec.campaign_id,
            rec.mobile_number,
            rec.normalized_mobile_number,
            rec.recipient_name,
            rec.status,
            JSON.stringify(rec.variables || {})
          );
          pIdx += 7;
        }
        await query(
          `INSERT INTO bulk_sms_recipients (
            id, campaign_id, mobile_number, normalized_mobile_number, recipient_name, status, variables
          ) VALUES ${valueClauses.join(', ')}`,
          params
        );
      }
    } catch (err) {
      logger.warn(`[Bulk-SMS] Database campaign/recipients insert notice: ${err.message}`);
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
 * Batches recipients (50 per batch) and dispatches via MSG91 Flow API.
 * Uses exact distinctions:
 * - SENT: provider accepted request.
 * - FAILED: provider rejected request.
 * - SIMULATED: test mock response (does NOT increment real sent/delivered counts).
 * - DELIVERED: set ONLY by verified delivery receipt.
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

    const payloadRecipients = batch.map((r) => {
      const vars = r.variables || {};
      return {
        mobiles: r.normalized_mobile_number,
        ...vars,
      };
    });

    try {
      const response = await sendBatchViaFlow(
        template.provider_template_id,
        payloadRecipients,
        template.sender_id
      );

      const isSimulated = Boolean(response.simulated);

      batch.forEach((r, idx) => {
        const itemResult = response.recipients ? response.recipients[idx] : null;

        if (isSimulated) {
          // Mock / Simulated response: NEVER mark as SENT or DELIVERED, and do not increment real sent/delivered counts
          r.status = 'SIMULATED';
          r.msg91_message_id = itemResult?.message_id || response.messageId;
          r.sent_at = null;
          r.delivered_at = null;
          r.failure_reason = null;
        } else if (response.success && itemResult?.status !== 'FAILED') {
          // Provider accepted: status is SENT (awaiting delivery receipt), NEVER DELIVERED
          r.status = 'SENT';
          r.msg91_message_id = itemResult?.message_id || response.messageId;
          r.sent_at = new Date();
          r.delivered_at = null;
          r.failure_reason = null;
          totalSent++;
        } else {
          // Provider rejected / failed
          r.status = 'FAILED';
          r.failure_reason = itemResult?.failure_reason || response.error || 'Provider rejected SMS';
          r.sent_at = null;
          r.delivered_at = null;
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
      campaign.delivered_count = totalDelivered; // remains 0 until verified DLR
      campaign.failed_count = totalFailed;
      campaign.pending_count = recipientList.length - (totalSent + totalFailed);
    }

    // Update database records
    if (!shouldSkipDb()) {
      try {
        for (const r of batch) {
          await query(
            `UPDATE bulk_sms_recipients
             SET status = $1,
                 msg91_message_id = $2,
                 sent_at = $3,
                 delivered_at = $4,
                 failure_reason = $5,
                 updated_at = NOW()
             WHERE id = $6`,
            [r.status, r.msg91_message_id, r.sent_at, r.delivered_at, r.failure_reason, r.id]
          );
        }
      } catch (dbErr) {
        logger.warn(`[Bulk-SMS] Database recipient batch update notice: ${dbErr.message}`);
      }
    }
  }

  // Finalize campaign
  if (campaign) {
    campaign.status = 'COMPLETED';
    campaign.completed_at = new Date();
    campaign.pending_count = 0;
  }

  logger.info(
    `[Bulk-SMS-Queue] Finished campaign ${campaignId}. Sent: ${totalSent}, Delivered: ${totalDelivered}, Failed: ${totalFailed}`
  );

  // Update DB campaign record
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
      logger.warn(`[Bulk-SMS] DB campaign update notice: ${err.message}`);
    }
  }
};

/**
 * Handle Verified MSG91 Delivery Receipt / Postback
 * Updates recipient status to DELIVERED or FAILED, and recalculates campaign aggregates.
 */
const handleDeliveryReceipt = async ({
  messageId,
  requestId,
  mobile,
  status,
  deliveredAt = new Date(),
  failureReason = null,
}) => {
  const targetId = messageId || requestId;
  if (!targetId && !mobile) {
    throw new Error('Delivery receipt must include a messageId/requestId or mobile number.');
  }

  const rawStatus = String(status || '').toUpperCase();
  const isDelivered = rawStatus === 'DELIVERED' || rawStatus === '1' || rawStatus === 'SUCCESS';
  const isFailed = rawStatus === 'FAILED' || rawStatus === '2' || rawStatus === 'UNDELIVERED' || rawStatus === 'REJECTED';

  const newStatus = isDelivered ? 'DELIVERED' : isFailed ? 'FAILED' : 'SENT';
  const normMobile = mobile ? normalizeForMsg91(mobile) : null;
  const tenDigit = mobile ? String(mobile).replace(/\D/g, '').slice(-10) : null;

  let updatedCount = 0;
  const affectedCampaignIds = new Set();

  // 1. Update In-Memory Store
  for (const [cId, recList] of inMemoryStore.recipients.entries()) {
    for (const r of recList) {
      const matchId = targetId && (r.msg91_message_id === targetId || String(r.msg91_message_id).includes(targetId));
      const matchMobile = normMobile && (r.normalized_mobile_number === normMobile || r.mobile_number === tenDigit);

      if (matchId || (matchMobile && (!targetId || r.msg91_message_id === targetId))) {
        r.status = newStatus;
        if (isDelivered) {
          r.delivered_at = new Date(deliveredAt);
        } else if (isFailed) {
          r.failure_reason = failureReason || 'Carrier undelivered';
        }
        updatedCount++;
        affectedCampaignIds.add(cId);
      }
    }
  }

  // Recalculate campaign stats in memory
  for (const cId of affectedCampaignIds) {
    const campaign = inMemoryStore.campaigns.get(cId);
    const recs = inMemoryStore.recipients.get(cId) || [];
    if (campaign) {
      campaign.delivered_count = recs.filter((r) => r.status === 'DELIVERED').length;
      campaign.failed_count = recs.filter((r) => r.status === 'FAILED').length;
      campaign.sent_count = recs.filter((r) => r.status === 'SENT' || r.status === 'DELIVERED').length;
    }
  }

  // 2. Update Database
  if (!shouldSkipDb()) {
    try {
      let updateSql = `
        UPDATE bulk_sms_recipients
        SET status = $1,
            delivered_at = $2,
            failure_reason = $3,
            updated_at = NOW()
        WHERE (msg91_message_id = $4 OR ($4 IS NULL AND normalized_mobile_number = $5))
        RETURNING campaign_id
      `;
      const res = await query(updateSql, [
        newStatus,
        isDelivered ? new Date(deliveredAt) : null,
        isFailed ? (failureReason || 'Carrier undelivered') : null,
        targetId || null,
        normMobile || null,
      ]);

      if (res.rows && res.rows.length > 0) {
        updatedCount = Math.max(updatedCount, res.rows.length);
        const dbCampaignIds = [...new Set(res.rows.map((r) => r.campaign_id))];
        for (const cId of dbCampaignIds) {
          await query(
            `UPDATE bulk_sms_campaigns
             SET delivered_count = (SELECT COUNT(*)::INT FROM bulk_sms_recipients WHERE campaign_id = $1 AND status = 'DELIVERED'),
                 failed_count = (SELECT COUNT(*)::INT FROM bulk_sms_recipients WHERE campaign_id = $1 AND status = 'FAILED'),
                 updated_at = NOW()
             WHERE id = $1`,
            [cId]
          );
        }
      }
    } catch (err) {
      logger.warn(`[Bulk-SMS] Database delivery receipt update notice: ${err.message}`);
    }
  }

  return {
    success: true,
    updated_status: newStatus,
    updated_count: updatedCount,
  };
};

/**
 * Top Statistics Cards
 */
const getCampaignStats = async () => {
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
          total_campaigns: Number(dbStats.total_campaigns),
          messages_sent: Number(dbStats.messages_sent),
          delivered: Number(dbStats.delivered),
          failed: Number(dbStats.failed),
        };
      }
    } catch (err) {
      logger.warn(`[Bulk-SMS] DB stats notice: ${err.message}`);
    }
  }

  const allCampaigns = Array.from(inMemoryStore.campaigns.values());
  return {
    total_campaigns: allCampaigns.length,
    messages_sent: allCampaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0),
    delivered: allCampaigns.reduce((acc, c) => acc + (c.delivered_count || 0), 0),
    failed: allCampaigns.reduce((acc, c) => acc + (c.failed_count || 0), 0),
  };
};

/**
 * List Campaigns with Pagination & Filters
 */
const listCampaigns = async ({ page = 1, limit = 20, status = 'ALL', search = '' }) => {
  if (!shouldSkipDb()) {
    try {
      let queryStr = `SELECT * FROM bulk_sms_campaigns WHERE 1=1`;
      const queryParams = [];

      if (status && status !== 'ALL') {
        queryParams.push(status.toUpperCase());
        queryStr += ` AND UPPER(status) = $${queryParams.length}`;
      }

      if (search && search.trim()) {
        queryParams.push(`%${search.trim().toLowerCase()}%`);
        queryStr += ` AND (LOWER(campaign_name) LIKE $${queryParams.length})`;
      }

      queryStr += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
      const offset = (Number(page) - 1) * Number(limit);
      queryParams.push(Number(limit), offset);

      const res = await query(queryStr, queryParams);
      const countRes = await query(`SELECT COUNT(*)::INT AS total FROM bulk_sms_campaigns`);

      if (res.rows && res.rows.length > 0) {
        return {
          campaigns: res.rows,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countRes.rows[0]?.total || res.rows.length,
            totalPages: Math.ceil((countRes.rows[0]?.total || res.rows.length) / Number(limit)) || 1,
          },
        };
      }
    } catch (e) {
      logger.warn(`[Bulk-SMS] DB listCampaigns notice: ${e.message}`);
    }
  }

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
  if (!shouldSkipDb()) {
    try {
      const res = await query(`SELECT * FROM bulk_sms_campaigns WHERE id = $1`, [campaignId]);
      if (res.rows && res.rows[0]) return res.rows[0];
    } catch (e) {}
  }
  const campaign = inMemoryStore.campaigns.get(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }
  return campaign;
};

/**
 * Get Recipients for a Campaign
 */
const getCampaignRecipients = async (campaignId, { page = 1, limit = 50, status = 'ALL' }) => {
  if (!shouldSkipDb()) {
    try {
      let queryStr = `SELECT * FROM bulk_sms_recipients WHERE campaign_id = $1`;
      const queryParams = [campaignId];
      if (status && status !== 'ALL') {
        queryParams.push(status.toUpperCase());
        queryStr += ` AND UPPER(status) = $${queryParams.length}`;
      }
      queryStr += ` ORDER BY created_at ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
      const offset = (Number(page) - 1) * Number(limit);
      queryParams.push(Number(limit), offset);

      const res = await query(queryStr, queryParams);
      const countRes = await query(
        `SELECT COUNT(*)::INT AS total FROM bulk_sms_recipients WHERE campaign_id = $1 ${
          status && status !== 'ALL' ? `AND UPPER(status) = '${status.toUpperCase()}'` : ''
        }`,
        [campaignId]
      );

      if (res.rows && res.rows.length > 0) {
        return {
          recipients: res.rows.map((r) => ({ ...r, masked_mobile: r.mobile_number })),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countRes.rows[0]?.total || res.rows.length,
            totalPages: Math.ceil((countRes.rows[0]?.total || res.rows.length) / Number(limit)) || 1,
          },
        };
      }
    } catch (e) {
      logger.warn(`[Bulk-SMS] DB getCampaignRecipients notice: ${e.message}`);
    }
  }

  let recipients = inMemoryStore.recipients.get(campaignId) || [];

  if (status && status !== 'ALL') {
    recipients = recipients.filter((r) => String(r.status).toUpperCase() === String(status).toUpperCase());
  }

  const offset = (Number(page) - 1) * Number(limit);
  const paged = recipients.slice(offset, offset + Number(limit));

  return {
    recipients: paged.map((r) => ({
      ...r,
      masked_mobile: r.mobile_number,
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

  const breakdown = {
    QUEUED: 0,
    SENT: 0,
    DELIVERED: 0,
    FAILED: 0,
    SIMULATED: 0,
    REJECTED: 0,
    PENDING: 0,
  };

  if (!shouldSkipDb()) {
    try {
      const res = await query(
        `SELECT status, COUNT(*)::INT AS count FROM bulk_sms_recipients WHERE campaign_id = $1 GROUP BY status`,
        [campaignId]
      );
      if (res.rows && res.rows.length > 0) {
        res.rows.forEach((r) => {
          const s = String(r.status).toUpperCase();
          if (breakdown[s] !== undefined) {
            breakdown[s] = Number(r.count);
          } else {
            breakdown.PENDING += Number(r.count);
          }
        });
        return {
          campaign,
          breakdown,
          total_recipients: campaign.total_recipients,
        };
      }
    } catch (e) {
      logger.warn(`[Bulk-SMS] DB getCampaignReport notice: ${e.message}`);
    }
  }

  const recipients = inMemoryStore.recipients.get(campaignId) || [];
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
  const recipientData = await getCampaignRecipients(campaignId, { limit: 100000 });
  const recipients = recipientData.recipients || [];

  const headers = ['#', 'Mobile Number', 'Recipient Name', 'Status', 'Message ID', 'Sent At', 'Delivered At', 'Failure Reason'];
  const rows = [headers.join(',')];

  recipients.forEach((r, idx) => {
    const sentAt = r.sent_at ? new Date(r.sent_at).toISOString() : '';
    const deliveredAt = r.delivered_at ? new Date(r.delivered_at).toISOString() : '';
    const safeReason = (r.failure_reason || '').replace(/"/g, '""');

    rows.push([
      idx + 1,
      r.mobile_number,
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

/**
 * Trigger immediate queue dispatch for a campaign (e.g. from Send Now)
 */
const triggerCampaignSendNow = async (campaignId) => {
  const campaign = await getCampaignDetails(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  if (campaign.status === 'COMPLETED' || campaign.status === 'PROCESSING') {
    throw new Error(`Campaign is already ${campaign.status.toLowerCase()}.`);
  }

  campaign.status = 'QUEUED';
  campaign.started_at = new Date();

  const template = await getTemplateById(campaign.template_id);
  const recipientData = await getCampaignRecipients(campaignId, { limit: 100000 });
  const recipientList = recipientData.recipients || [];

  processCampaignQueueAsync(campaign.id, template, recipientList).catch((qErr) => {
    logger.error(`[Bulk-SMS-Queue] Trigger send now error: ${qErr.message}`);
  });

  return campaign;
};

module.exports = {
  inMemoryStore,
  cleanAndValidateMobile,
  parseRecipientFile,
  extractRequiredVariables,
  getTemplates,
  getTemplateById,
  createTemplate,
  createCampaign,
  processCampaignQueueAsync,
  handleDeliveryReceipt,
  triggerCampaignSendNow,
  getCampaignStats,
  listCampaigns,
  getCampaignDetails,
  getCampaignRecipients,
  getCampaignReport,
  exportCampaignCsv,
};

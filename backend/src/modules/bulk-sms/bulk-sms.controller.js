const bulkSmsService = require('./bulk-sms.service');
const { logAction } = require('../admin/audit.service');
const logger = require('../../config/logger');

/**
 * POST /api/v1/admin/bulk-sms/upload
 * Parse and validate uploaded recipient file (CSV, XLSX, PDF)
 */
const uploadRecipients = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a CSV, XLSX, or PDF file.',
      });
    }

    const { manual_column } = req.body;
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;

    logger.info(`[Bulk-SMS] Parsing upload: ${fileName} (${fileSize} bytes)`);

    const result = await bulkSmsService.parseRecipientFile({
      fileBuffer,
      fileName,
      fileSize,
      manualMobileColumn: manual_column || null,
    });

    if (result.total_records === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded file does not contain any valid records.',
      });
    }

    await logAction(req, 'BULK_SMS_FILE_UPLOADED', null, {
      file_name: fileName,
      file_size: fileSize,
      total_records: result.total_records,
      valid_numbers: result.valid_numbers,
    });

    return res.status(200).json({
      success: true,
      message: 'File processed and recipients validated successfully.',
      data: result,
    });
  } catch (err) {
    logger.error(`[Bulk-SMS] Upload parsing error: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to process uploaded recipient file.',
    });
  }
};

/**
 * GET /api/v1/admin/bulk-sms/stats
 * Get Top Metric Cards
 */
const getStats = async (req, res) => {
  try {
    const stats = await bulkSmsService.getCampaignStats();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    logger.error(`[Bulk-SMS] Stats retrieval error: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bulk SMS statistics.',
    });
  }
};

/**
 * GET /api/v1/admin/bulk-sms/templates
 * List approved SMS templates
 */
const getTemplates = async (req, res) => {
  try {
    const templates = await bulkSmsService.getTemplates();
    return res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (err) {
    logger.error(`[Bulk-SMS] Templates retrieval error: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve SMS templates.',
    });
  }
};

/**
 * GET /api/v1/admin/bulk-sms/templates/:id
 * Get single SMS template
 */
const getTemplate = async (req, res) => {
  try {
    const template = await bulkSmsService.getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found.',
      });
    }
    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch template details.',
    });
  }
};

/**
 * POST /api/v1/admin/bulk-sms/templates
 * Create SMS Template
 */
const createTemplate = async (req, res) => {
  try {
    const { name, provider_template_id, sender_id, content, template_type, approval_status, variables, preview_url } = req.body;
    if (!name || !provider_template_id || !content) {
      return res.status(400).json({
        success: false,
        message: 'Name, MSG91 Template ID, and Content are required.',
      });
    }

    const created = await bulkSmsService.createTemplate({
      name,
      provider_template_id,
      sender_id,
      content,
      template_type,
      approval_status: approval_status || 'APPROVED',
      variables,
      preview_url,
    });

    await logAction(req, 'BULK_SMS_TEMPLATE_CREATED', created.id, {
      template_name: name,
      provider_template_id,
    });

    return res.status(201).json({
      success: true,
      message: 'SMS template saved successfully.',
      data: created,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to save SMS template.',
    });
  }
};

/**
 * POST /api/v1/admin/bulk-sms/campaigns
 * Create and dispatch or schedule Bulk SMS Campaign
 */
const createCampaign = async (req, res) => {
  try {
    const {
      campaign_name,
      template_id,
      sender_id,
      schedule_type,
      scheduled_at,
      recipients,
      file_name,
      file_size,
      compliance_confirmed,
    } = req.body;

    if (!compliance_confirmed) {
      return res.status(400).json({
        success: false,
        message: 'You must confirm that this campaign uses an approved SMS template and that recipients are authorized.',
      });
    }

    const campaign = await bulkSmsService.createCampaign({
      campaign_name,
      template_id,
      sender_id,
      schedule_type: schedule_type || 'SEND_NOW',
      scheduled_at,
      recipients,
      file_name,
      file_size,
      userId: req.user?.id || null,
    });

    await logAction(req, 'BULK_SMS_CAMPAIGN_CREATED', campaign.campaign_id, {
      campaign_name,
      template_id,
      recipients_count: campaign.valid_recipients,
      schedule_type,
    });

    return res.status(201).json({
      success: true,
      message: campaign.message,
      data: campaign,
    });
  } catch (err) {
    logger.error(`[Bulk-SMS] Campaign creation error: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to create bulk SMS campaign.',
    });
  }
};

/**
 * GET /api/v1/admin/bulk-sms/campaigns
 * List Campaigns with Pagination & Filters
 */
const listCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'ALL', search = '' } = req.query;
    const result = await bulkSmsService.listCampaigns({ page, limit, status, search });
    return res.status(200).json({
      success: true,
      data: result.campaigns,
      pagination: result.pagination,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve campaign history.',
    });
  }
};

/**
 * GET /api/v1/admin/bulk-sms/campaigns/:id
 * Get Single Campaign Details
 */
const getCampaign = async (req, res) => {
  try {
    const campaign = await bulkSmsService.getCampaignDetails(req.params.id);
    return res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message || 'Campaign not found.',
    });
  }
};

/**
 * GET /api/v1/admin/bulk-sms/campaigns/:id/recipients
 * Get Campaign Recipients List
 */
const getCampaignRecipients = async (req, res) => {
  try {
    const { page = 1, limit = 50, status = 'ALL' } = req.query;
    const result = await bulkSmsService.getCampaignRecipients(req.params.id, { page, limit, status });
    return res.status(200).json({
      success: true,
      data: result.recipients,
      pagination: result.pagination,
    });
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message || 'Failed to retrieve recipients.',
    });
  }
};

/**
 * GET /api/v1/admin/bulk-sms/campaigns/:id/report
 * Get Campaign Delivery Breakdown
 */
const getCampaignReport = async (req, res) => {
  try {
    const report = await bulkSmsService.getCampaignReport(req.params.id);
    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message || 'Failed to fetch delivery report.',
    });
  }
};

/**
 * GET /api/v1/admin/bulk-sms/campaigns/:id/export
 * Export Campaign Delivery Report as CSV
 */
const exportCampaignReport = async (req, res) => {
  try {
    const csvData = await bulkSmsService.exportCampaignCsv(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="campaign_${req.params.id}_delivery_report.csv"`);
    return res.status(200).send(csvData);
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message || 'Failed to export delivery report.',
    });
  }
};

/**
 * POST /api/v1/admin/bulk-sms/campaigns/:id/send
 * Trigger Send Now for a campaign
 */
const triggerSendNow = async (req, res) => {
  try {
    const campaign = await bulkSmsService.getCampaignDetails(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    if (campaign.status === 'COMPLETED' || campaign.status === 'PROCESSING') {
      return res.status(400).json({ success: false, message: `Campaign is already ${campaign.status.toLowerCase()}.` });
    }

    campaign.status = 'QUEUED';
    campaign.started_at = new Date();

    await logAction(req, 'BULK_SMS_CAMPAIGN_SENT_NOW', req.params.id, {
      campaign_name: campaign.campaign_name,
    });

    return res.status(200).json({
      success: true,
      message: 'Campaign has been queued for immediate sending.',
      data: campaign,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to dispatch campaign.',
    });
  }
};

/**
 * POST /api/v1/admin/bulk-sms/campaigns/:id/schedule
 * Reschedule campaign
 */
const rescheduleCampaign = async (req, res) => {
  try {
    const { scheduled_at } = req.body;
    if (!scheduled_at || new Date(scheduled_at) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date and time must be in the future.',
      });
    }

    const campaign = await bulkSmsService.getCampaignDetails(req.params.id);
    campaign.scheduled_at = new Date(scheduled_at);
    campaign.status = 'SCHEDULED';

    await logAction(req, 'BULK_SMS_CAMPAIGN_RESCHEDULED', req.params.id, {
      scheduled_at,
    });

    return res.status(200).json({
      success: true,
      message: 'Campaign schedule updated successfully.',
      data: campaign,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to reschedule campaign.',
    });
  }
};

module.exports = {
  uploadRecipients,
  getStats,
  getTemplates,
  getTemplate,
  createTemplate,
  createCampaign,
  listCampaigns,
  getCampaign,
  getCampaignRecipients,
  getCampaignReport,
  exportCampaignReport,
  triggerSendNow,
  rescheduleCampaign,
};

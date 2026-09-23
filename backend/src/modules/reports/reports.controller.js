const {
  getEmployeeReportData,
  getEmployeeCustomerDetailedReportData,
  getCustomerReportData,
  getAdminReportData,
  getPartnerReportData,
  getApplicationReportData,
  getCompleteSystemSummaryMetrics
} = require('./reportQueries');

const {
  generateEmployeeExcel,
  generateCustomerExcel,
  generateAdminExcel,
  generatePartnerExcel,
  generateApplicationExcel,
  generateCompleteSystemExcel
} = require('./reports.service');

function getTodayFilenamePrefix(prefix) {
  const dateStr = new Date().toISOString().split('T')[0];
  return `${prefix}-report-${dateStr}.xlsx`;
}

// ── JSON PREVIEW ENDPOINTS ──────────────────────────────────────

async function getEmployeeReport(req, res) {
  try {
    const filters = req.query;
    const variant = filters.variant || 'summary';

    let data = [];
    if (variant === 'detailed') {
      data = await getEmployeeCustomerDetailedReportData(filters);
    } else {
      data = await getEmployeeReportData(filters, true);
    }

    return res.json({
      success: true,
      count: data.length,
      variant,
      data
    });
  } catch (err) {
    console.error('getEmployeeReport Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to fetch employee report data' });
  }
}

async function getCustomerReport(req, res) {
  try {
    const filters = req.query;
    const data = await getCustomerReportData(filters, true);
    return res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    console.error('getCustomerReport Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to fetch customer report data' });
  }
}

async function getAdminReport(req, res) {
  try {
    const filters = req.query;
    const data = await getAdminReportData(filters);
    return res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    console.error('getAdminReport Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to fetch admin report data' });
  }
}

async function getPartnerReport(req, res) {
  try {
    const filters = req.query;
    const data = await getPartnerReportData(filters);
    return res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    console.error('getPartnerReport Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to fetch partner report data' });
  }
}

async function getApplicationReport(req, res) {
  try {
    const filters = req.query;
    const data = await getApplicationReportData(filters);
    return res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    console.error('getApplicationReport Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to fetch application report data' });
  }
}

async function getCompleteSystemReport(req, res) {
  try {
    const metrics = await getCompleteSystemSummaryMetrics();
    const appData = await getApplicationReportData(req.query);
    return res.json({
      success: true,
      metrics,
      count: appData.length,
      data: appData
    });
  } catch (err) {
    console.error('getCompleteSystemReport Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to fetch complete system report data' });
  }
}

// ── EXCEL EXPORT ENDPOINTS ──────────────────────────────────────

async function exportEmployeeReport(req, res) {
  try {
    const filters = req.query;
    const variant = filters.variant || 'summary';
    const workbook = await generateEmployeeExcel(filters, variant);

    const filename = getTodayFilenamePrefix(`employee-${variant}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('exportEmployeeReport Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export employee report' });
  }
}

async function exportCustomerReport(req, res) {
  try {
    const filters = req.query;
    const workbook = await generateCustomerExcel(filters);

    const filename = getTodayFilenamePrefix('customer');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('exportCustomerReport Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export customer report' });
  }
}

async function exportAdminReport(req, res) {
  try {
    const filters = req.query;
    const workbook = await generateAdminExcel(filters);

    const filename = getTodayFilenamePrefix('admin');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('exportAdminReport Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export admin report' });
  }
}

async function exportPartnerReport(req, res) {
  try {
    const filters = req.query;
    const workbook = await generatePartnerExcel(filters);

    const filename = getTodayFilenamePrefix('partner');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('exportPartnerReport Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export partner report' });
  }
}

async function exportApplicationReport(req, res) {
  try {
    const filters = req.query;
    const workbook = await generateApplicationExcel(filters);

    const filename = getTodayFilenamePrefix('application');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('exportApplicationReport Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export application report' });
  }
}

async function exportCompleteSystemReport(req, res) {
  try {
    const filters = req.query;
    const workbook = await generateCompleteSystemExcel(filters);

    const filename = getTodayFilenamePrefix('complete-system');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('exportCompleteSystemReport Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export complete system report' });
  }
}

module.exports = {
  getEmployeeReport,
  getCustomerReport,
  getAdminReport,
  getPartnerReport,
  getApplicationReport,
  getCompleteSystemReport,
  exportEmployeeReport,
  exportCustomerReport,
  exportAdminReport,
  exportPartnerReport,
  exportApplicationReport,
  exportCompleteSystemReport
};

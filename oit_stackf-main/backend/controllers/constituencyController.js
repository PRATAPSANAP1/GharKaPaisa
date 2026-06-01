const constituencyModel = require('../models/constituencyModel');

const getConstituency = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ error: 'Constituency ID is required' });
    }

    const data = await constituencyModel.getConstituencyData(id);

    // Basic validation of returned data
    if (!data.records_2009 && !data.records_2024) {
      console.warn(`No data found for constituency ID: ${id}`);
    }

    res.json({
      constituency_number: parseInt(id),
      ...data
    });
  } catch (error) {
    console.error(`[API ERROR] Fetching constituency ${id}:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

const getHealth = (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
};

module.exports = {
  getConstituency,
  getHealth
};

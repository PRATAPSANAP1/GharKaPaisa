const { getCandidateModel } = require('./Candidate');

const getConstituencyData = async (constituencyId) => {
  const id = parseInt(constituencyId);
  
  if (isNaN(id)) {
    throw new Error('Invalid constituency ID');
  }

  // Helper function to fetch from multiple collections and merge
  const fetchFromCollections = async (year, count, percentageField = 'votes_percentage') => {
    let allRecords = [];
    
    try {
      const promises = [];
      for (let i = 1; i <= count; i++) {
        const collectionName = `oit_stack_mh_mla_${year}_00${i}`;
        const Model = getCandidateModel(collectionName);
        promises.push(Model.find({ 
          constituency_number: id, 
          candidate_name: { $ne: null } 
        }).lean());
      }

      const results = await Promise.all(promises);
      
      results.forEach(records => {
        const normalized = records.map(r => ({
          ...r,
          votes_percentage: r[percentageField] || r.votes_percentage || 0
        }));
        allRecords = allRecords.concat(normalized);
      });

      // De-duplicate records by candidate name and party
      const uniqueMap = new Map();
      
      for (const record of allRecords) {
        const key = `${record.candidate_name}-${record.party}`.toLowerCase().trim();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, record);
        } else {
          // If duplicate exists, keep the one with higher total votes
          const existing = uniqueMap.get(key);
          if ((record.total || 0) > (existing.total || 0)) {
            uniqueMap.set(key, record);
          }
        }
      }

      allRecords = Array.from(uniqueMap.values());

      // Sort by total descending and add rank
      return allRecords
        .sort((a, b) => (b.total || 0) - (a.total || 0))
        .map((record, index) => ({
          ...record,
          rank_no: index + 1
        }));
    } catch (err) {
      console.error(`Error fetching data for year ${year}:`, err);
      return []; // Return empty array on failure for a specific year
    }
  };

  try {
    console.log(`Fetching data for constituency: ${id}`);

    const [rows2009, rows2014, rows2019, rows2024] = await Promise.all([
      fetchFromCollections(2009, 10),
      fetchFromCollections(2014, 15),
      fetchFromCollections(2019, 10),
      fetchFromCollections(2024, 15, 'votes_polled_valid_nota')
    ]);

    return {
      records_2009: rows2009,
      records_2014: rows2014,
      records_2019: rows2019,
      records_2024: rows2024
    };
  } catch (error) {
    console.error('Critical error in constituencyModel:', error);
    throw error;
  }
};

module.exports = {
  getConstituencyData
};

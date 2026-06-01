const Voter = require('../models/Voter');

exports.getVoters = async (req, res) => {
    try {
        const { segment } = req.query;
        let query = {};

        // 1. Get total count in voters collection to check if it's empty
        const totalVotersCount = await Voter.countDocuments({});
        console.log(`[Voters API] Total documents in 'voters' collection: ${totalVotersCount}`);

        // 2. Fetch a sample document to print its keys
        const sampleVoter = await Voter.findOne({});
        let availableFields = [];
        if (sampleVoter) {
            availableFields = Object.keys(sampleVoter.toObject()).filter(k => k !== '_id' && k !== '__v');
            console.log(`[Voters API] Sample voter keys found in DB:`, availableFields);
            console.log(`[Voters API] Sample voter data:`, JSON.stringify(sampleVoter));
        } else {
            console.log(`[Voters API] WARNING: The 'voters' collection is completely empty!`);
        }

        // 3. Try to find with segment filter
        let voters = [];
        let isFiltered = false;

        if (segment) {
            console.log(`[Voters API] Searching for segment matching: "${segment}"`);
            
            // We search multiple likely field names (segment, ward, area, etc.) based on standard setups
            query = {
                $or: [
                    { segment: { $regex: segment, $options: 'i' } },
                    { ward: { $regex: segment, $options: 'i' } },
                    { area: { $regex: segment, $options: 'i' } }
                ]
            };
            
            voters = await Voter.find(query).limit(100);
            if (voters.length > 0) {
                isFiltered = true;
                console.log(`[Voters API] Found ${voters.length} matching voters for segment "${segment}"`);
            }
        }

        // 4. Fallback: If no voters found with the filter, return the first 100 voters in the DB
        if (voters.length === 0 && totalVotersCount > 0) {
            console.log(`[Voters API] No voters matched the filter "${segment}". Falling back to returning first 100 voters.`);
            voters = await Voter.find({}).limit(100);
        }

        res.status(200).json({
            success: true,
            count: voters.length,
            totalInDb: totalVotersCount,
            isFiltered,
            availableFields,
            data: voters
        });
    } catch (error) {
        console.error('[Voters API] Error fetching voters:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error while fetching voters'
        });
    }
};

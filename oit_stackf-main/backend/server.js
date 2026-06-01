require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const constituencyRoutes = require('./routes/constituencyRoutes');
const voterRoutes = require('./routes/voterRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api', constituencyRoutes);
app.use('/api', voterRoutes);

// Catch-all route to serve the frontend index.html for any other request
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/api/voters", async(req, res)=>{

    try{

        const boothNumber = req.query.boothNumber;

        let filter = {};

        if(boothNumber){

            filter.boothNumber = Number(boothNumber);

        }

        const voters = await Voter.find(filter);

        res.json(voters);

    }
    catch(error){

        res.status(500).json({
            message : error.message
        });

    }

});
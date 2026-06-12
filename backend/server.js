const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Test PostgreSQL Database Connection on Startup
db.query('SELECT NOW()')
  .then(res => console.log(`PostgreSQL connected. Server time from DB: ${res.rows[0].now}`))
  .catch(err => console.error('Database connection test failed:', err.message));

app.get('/', (req, res) => {
  res.send('Gharkapaisa Backend Running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

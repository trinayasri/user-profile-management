const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded profile images
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/users', require('./routes/users'));

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback route to serve index.html for Single Page Application routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/user-profile-db';
const PORT = process.env.PORT || 5000;

console.log('Connecting to MongoDB at:', MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    console.log('\n======================================================');
    console.log('WARNING: MongoDB server is not running or accessible.');
    console.log('Please make sure MongoDB service is started locally,');
    console.log('or update the MONGO_URI in your .env file.');
    console.log('======================================================\n');
    process.exit(1);
  });

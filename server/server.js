const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
require('dotenv').config();

// Import routes
const downloadRoutes = require('./routes/download');
const streamRoutes = require('./routes/stream');
const cacheRoutes = require('./routes/cache');
const spotifyRoutes = require('./routes/spotify');
const authRoutes = require('./routes/auth');
const playlistRoutes = require('./routes/playlists');
const friendsRoutes = require('./routes/friends');
const userRoutes = require('./routes/user');

// Import services
const { cleanupOldFiles } = require('./services/cleanup');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ensure directories exist
const downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });
const uploadsDir = path.join(__dirname, 'uploads', 'playlist-covers');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/user', userRoutes);


// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-json-db'
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found', message: `Route ${req.originalUrl} not found` });
});

// Scheduled cleanup is disabled
/*
cron.schedule('0 2 * * *', () => {
  console.log('🧹 Running scheduled cleanup...');
  cleanupOldFiles();
});
*/
console.log('🧹 Automatic cache cleanup is disabled.');


app.listen(PORT, () => {
  console.log(`🎵 Spotify Clone Server (JSON DB) v2 running on port ${PORT}`);
  console.log(`📁 Downloads directory: ${path.resolve(downloadsDir)}`);
});

module.exports = app;
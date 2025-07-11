const express = require('express');
const fs = require('fs');
const path = require('path');
const { getCacheInfo, clearCache, deleteTrack } = require('../services/cache');
const router = express.Router();

// Get cache information
router.get('/', async (req, res) => {
  try {
    const cacheInfo = await getCacheInfo();
    res.json(cacheInfo);
  } catch (error) {
    console.error('❌ Cache info error:', error);
    res.status(500).json({
      error: 'Failed to get cache information',
      message: error.message
    });
  }
});

// Get cached tracks list
router.get('/tracks', async (req, res) => {
  try {
    const downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
    const files = fs.readdirSync(downloadsDir);
    
    const tracks = files
      .filter(file => /\.(m4a|mp3|webm|ogg)$/.test(file))
      .map(file => {
        const filePath = path.join(downloadsDir, file);
        const stats = fs.statSync(filePath);
        const downloadId = file.replace(/\.(m4a|mp3|webm|ogg)$/, '');
        
        return {
          downloadId,
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          extension: path.extname(file).substring(1)
        };
      })
      .sort((a, b) => b.created - a.created);

    res.json({
      tracks,
      totalTracks: tracks.length,
      totalSize: tracks.reduce((sum, track) => sum + track.size, 0)
    });
  } catch (error) {
    console.error('❌ Get tracks error:', error);
    res.status(500).json({
      error: 'Failed to get cached tracks',
      message: error.message
    });
  }
});

// Delete specific track
router.delete('/tracks/:downloadId', async (req, res) => {
  try {
    const { downloadId } = req.params;
    const result = await deleteTrack(downloadId);

    if (!result.success) {
      return res.status(404).json({
        error: 'Track not found',
        downloadId
      });
    }

    res.json({
      success: true,
      message: 'Track deleted successfully',
      downloadId,
      freedSpace: result.freedSpace
    });
  } catch (error) {
    console.error('❌ Delete track error:', error);
    res.status(500).json({
      error: 'Failed to delete track',
      message: error.message
    });
  }
});

// Clear entire cache
router.delete('/', async (req, res) => {
  try {
    const result = await clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      deletedFiles: result.deletedFiles,
      freedSpace: result.freedSpace
    });
  } catch (error) {
    console.error('❌ Clear cache error:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

module.exports = router;
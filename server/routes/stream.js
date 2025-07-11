const express = require('express');
const fs = require('fs');
const path = require('path');
const { getDownloadStatus } = require('../services/downloader'); 
const router = express.Router();

// Stream audio file
router.get('/:downloadId', async (req, res) => {
  try {
    const { downloadId } = req.params;

    const downloadInfo = await getDownloadStatus(downloadId);

    // FIX: Check for the outputPath property which is now correctly set by the downloader
    if (!downloadInfo || downloadInfo.status !== 'completed' || !downloadInfo.outputPath) {
      return res.status(404).json({
        error: 'Audio file not ready or not found.',
        downloadId
      });
    }

    const filePath = downloadInfo.outputPath;
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ DB entry exists, but file is missing from disk: ${filePath}`);
        return res.status(404).json({ error: 'File missing from disk.' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const contentType = 'audio/mp4'; 
    res.set({
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    });

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      
      res.status(206).set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize
      });
      return file.pipe(res);
    } else {
      res.set({ 'Content-Length': fileSize });
      return fs.createReadStream(filePath).pipe(res);
    }

  } catch (error) {
    console.error('❌ Streaming error:', error);
    res.status(500).json({ error: 'Failed to stream audio' });
  }
});

module.exports = router;
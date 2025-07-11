const express = require('express');
const { v4: uuidv4 } = require('uuid'); // --- NEW: Import uuid
const {
    getCompletedDownloads,
    downloadTrack, 
    getDownloadStatus, 
    cancelDownload,
    getAllTrackStatuses // --- FIX: Ensure this is imported
} = require('../services/downloader');
const router = express.Router();

// Get all completed downloads
router.get('/completed', async (req, res) => {
    try {
        const downloads = await getCompletedDownloads();
        console.log(`[SERVER] Sending ${downloads.length} completed tracks to client.`);
        res.status(200).json(downloads);
    } catch (error) {
        console.error("[SERVER] Error in /completed route:", error);
        res.status(500).json({ error: 'Failed to get completed downloads' });
    }
});

// --- NEW: Add the missing /all route for the poller ---
router.get('/all', async (req, res) => {
  try {
    const allStatuses = await getAllTrackStatuses();
    res.status(200).json(allStatuses);
  } catch (error) {
    console.error('[SERVER] Error getting all download statuses:', error);
    res.status(500).json({ error: 'Failed to get all download statuses' });
  }
});

// --- NEW: Route for direct YouTube search and download ---
router.post('/youtube-search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== 'string' || query.trim().length < 2) {
            return res.status(400).json({ error: 'A valid search query is required.' });
        }

        console.log(`🎬 YouTube direct search for: "${query}"`);

        // Create a temporary track object for the downloader
        const tempTrack = {
            id: `yt-${uuidv4()}`, // Unique ID for tracking
            name: query,
            artist: 'YouTube Search',
            imageUrl: null, // No image for direct searches
        };

        const result = await downloadTrack(tempTrack);
        
        // Respond with the track object and download details
        res.status(202).json({
            ...result,
            track: {
              spotifyId: tempTrack.id,
              name: tempTrack.name,
              artist: tempTrack.artist,
              imageUrl: tempTrack.imageUrl,
            }
        });

    } catch (error) {
        console.error('❌ YouTube search route error:', error);
        res.status(500).json({ error: 'Failed to start YouTube search and download', message: error.message });
    }
});

// Start a new download from a Spotify track
router.post('/', async (req, res) => {
  try {
    const { spotifyTrack } = req.body;
    
    if (!spotifyTrack || !spotifyTrack.id || !spotifyTrack.name || !spotifyTrack.artist) {
        return res.status(400).json({ error: 'Invalid track data provided' });
    }

    console.log(`🎵 Download request for: ${spotifyTrack.name}`);
    const result = await downloadTrack(spotifyTrack);
    
    res.status(202).json(result);

  } catch (error) {
    console.error('❌ Download route error:', error);
    res.status(500).json({ error: 'Failed to start download', message: error.message });
  }
});

// Get status of a specific download
router.get('/status/:downloadId', async (req, res) => {
  try {
    const { downloadId } = req.params;
    const status = await getDownloadStatus(downloadId);
    if (!status) {
      return res.status(404).json({ error: 'Download not found' });
    }
    res.status(200).json(status);
  } catch (error) {
    console.error(`Error getting status for ${req.params.downloadId}:`, error);
    res.status(500).json({ error: 'Failed to get download status' });
  }
});

// Cancel a download in progress
router.delete('/:downloadId', async (req, res) => {
    try {
        const { downloadId } = req.params;
        const success = await cancelDownload(downloadId);
        if (success) {
            res.status(200).json({ message: 'Download cancellation initiated.' });
        } else {
            res.status(404).json({ error: 'Active download not found to cancel.' });
        }
    } catch (error) {
        console.error(`Error cancelling download ${req.params.downloadId}:`, error);
        res.status(500).json({ error: 'Failed to cancel download' });
    }
});

module.exports = router;
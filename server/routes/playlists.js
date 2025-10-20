const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../services/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { spawn } = require('child_process');
const spotify = require('../services/spotify');
const { downloadTrack } = require('../services/downloader');
const axios = require('axios');

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/playlist-covers/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, req.params.playlistId + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed!'), false),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to protect routes and attach user to request
const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const db = readDB();
      const user = db.users.find(u => u.id === decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Get user's playlists
router.get('/', protect, (req, res) => {
    const db = readDB();
    const userPlaylists = db.playlists.filter(p => p.userId === req.user.id);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(userPlaylists);
});

// Create a new playlist
router.post('/', protect, (req, res) => {
    const { name, description = '' } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Playlist name is required.' });
    }
    const db = readDB();
    const newPlaylist = {
        _id: uuidv4(),
        name,
        description,
        userId: req.user.id,
        tracks: [],
        createdAt: new Date().toISOString()
    };
    db.playlists.push(newPlaylist);
    writeDB(db);
    res.status(201).json(newPlaylist);
});

// Add track to a playlist
router.post('/:playlistId/tracks', protect, (req, res) => {
    const { playlistId } = req.params;
    const trackData = req.body;

    if (!trackData || !trackData.spotifyId) {
        return res.status(400).json({ message: 'Track data with a spotifyId is required.' });
    }

    const db = readDB();
    const playlistIndex = db.playlists.findIndex(p => p._id === playlistId);

    if (playlistIndex === -1) {
        return res.status(404).json({ message: 'Playlist not found.' });
    }

    if (db.playlists[playlistIndex].userId !== req.user.id) {
        return res.status(403).json({ message: 'User not authorized to modify this playlist.' });
    }

    const trackExists = db.playlists[playlistIndex].tracks.some(t => t.spotifyId === trackData.spotifyId);
    if (trackExists) {
        return res.status(400).json({ message: 'Track already exists in this playlist.' });
    }

    db.playlists[playlistIndex].tracks.push(trackData);
    writeDB(db);

    res.status(200).json(db.playlists[playlistIndex]);
});

// NEW ENDPOINT for rolling buffer download
router.post('/:playlistId/download-track', protect, async (req, res) => {
    const { playlistId } = req.params;
    const { spotifyId } = req.body;

    const db = readDB();
    const playlistIndex = db.playlists.findIndex(p => p._id === playlistId);
    if (playlistIndex === -1) return res.status(404).json({ message: 'Playlist not found.' });

    const trackIndex = db.playlists[playlistIndex].tracks.findIndex(t => t.spotifyId === spotifyId);
    if (trackIndex === -1) return res.status(404).json({ message: 'Track not found in playlist.' });

    const trackToDownload = db.playlists[playlistIndex].tracks[trackIndex];
    
    // Trigger download
    const { downloadId } = await downloadTrack({
        id: trackToDownload.spotifyId,
        name: trackToDownload.name,
        artist: trackToDownload.artist,
        imageUrl: trackToDownload.imageUrl,
        duration_ms: trackToDownload.duration_ms,
    });
    
    // Update the track in the playlist with the new downloadId
    db.playlists[playlistIndex].tracks[trackIndex].downloadId = downloadId;
    writeDB(db);

    console.log(`[Rolling Buffer] Triggered download for "${trackToDownload.name}" in playlist "${db.playlists[playlistIndex].name}".`);
    res.status(202).json({
        message: "Download triggered",
        downloadId: downloadId,
        spotifyId: spotifyId,
    });
});


// Update playlist image
router.put('/:playlistId/image', protect, upload.single('image'), (req, res) => {
    const { playlistId } = req.params;
    
    if (!req.file) {
        return res.status(400).json({ message: 'No image file uploaded.' });
    }

    const db = readDB();
    const playlistIndex = db.playlists.findIndex(p => p._id === playlistId);

    if (playlistIndex === -1) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Playlist not found.' });
    }

    if (db.playlists[playlistIndex].userId !== req.user.id) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'User not authorized to modify this playlist.' });
    }

    const oldImagePath = db.playlists[playlistIndex].customImageUrl;
    if (oldImagePath) {
        const fullOldPath = path.join(__dirname, '..', oldImagePath);
        if (fs.existsSync(fullOldPath)) fs.unlinkSync(fullOldPath);
    }
    
    db.playlists[playlistIndex].customImageUrl = `/uploads/playlist-covers/${req.file.filename}`;
    writeDB(db);
    res.status(200).json(db.playlists[playlistIndex]);
});

// Import Playlist Route
router.post('/import', protect, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required.' });

    try {
        const isSpotify = url.includes('spotify.com/playlist/');
        const isYoutube = url.includes('youtube.com/') && url.includes('list=');

        let allTracks = [];
        let playlistName = 'Imported Playlist';
        let playlistDescription = 'Imported Playlist';
        let coverImageUrl = null;

        if (isSpotify) {
            const playlistId = url.split('playlist/')[1].split('?')[0];
            const spotifyPlaylist = await spotify.getPlaylist(playlistId);
            playlistName = spotifyPlaylist.name;
            playlistDescription = spotifyPlaylist.description || `Imported from Spotify.`;
            coverImageUrl = spotifyPlaylist.images[0]?.url;
            // --- THIS IS THE FIX ---
            // Stricter filtering for invalid Spotify tracks
            allTracks = spotifyPlaylist.tracks.items.map(item => {
                const track = item.track;
                if (!track || !track.id || !track.name) return null; // Skip if track is null or missing essential info
                return {
                    spotifyId: track.id, name: track.name, artist: track.artists.map(a => a.name).join(', '),
                    albumName: track.album.name, imageUrl: track.album.images[0]?.url,
                    duration_ms: track.duration_ms,
                };
            }).filter(Boolean); // filter(Boolean) removes the null entries

        } else if (isYoutube) {
            const ytPlaylist = await new Promise((resolve, reject) => {
                const ytdlp = spawn('yt-dlp', ['-J', '--flat-playlist', url]);
                let jsonData = '', errorData = '';
                ytdlp.stdout.on('data', data => jsonData += data.toString());
                ytdlp.stderr.on('data', data => errorData += data.toString());
                ytdlp.on('close', code => code === 0 ? resolve(JSON.parse(jsonData)) : reject(new Error(errorData)));
            });
            playlistName = ytPlaylist.title || 'Imported YouTube Playlist';
            playlistDescription = `Imported from YouTube.`;
            coverImageUrl = ytPlaylist.thumbnail;
            // --- THIS IS THE FIX ---
            // Stricter filtering for invalid YouTube entries
            allTracks = ytPlaylist.entries.map(entry => {
                if (!entry || !entry.id || !entry.title) return null; // Skip if entry is null or missing essential info
                return {
                    spotifyId: `yt-${entry.id}`, name: entry.title, artist: entry.uploader || 'YouTube',
                    albumName: 'YouTube', imageUrl: entry.thumbnail,
                    duration_ms: (entry.duration || 0) * 1000,
                };
            }).filter(Boolean); // filter(Boolean) removes the null entries
        } else {
            return res.status(400).json({ message: 'Invalid or unsupported URL.' });
        }

        const db = readDB();
        const tempId = uuidv4();
        let localImagePath = null;

        if (coverImageUrl) {
            try {
                const response = await axios.get(coverImageUrl, { responseType: 'stream' });
                const extension = path.extname(new URL(coverImageUrl).pathname) || '.jpg';
                const filename = `${tempId}-${Date.now()}${extension}`;
                const imagePath = path.join(__dirname, '..', 'uploads', 'playlist-covers', filename);
                const writer = fs.createWriteStream(imagePath);
                response.data.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', () => { localImagePath = `/uploads/playlist-covers/${filename}`; resolve(); });
                    writer.on('error', reject);
                });
            } catch (imgError) { console.error(`[Importer] Failed to download cover for ${playlistName}: ${imgError.message}`); }
        }

        const newPlaylist = {
            _id: tempId, name: playlistName, description: playlistDescription,
            userId: req.user.id, tracks: [], createdAt: new Date().toISOString(), customImageUrl: localImagePath,
        };

        const tracksToDownload = allTracks.slice(0, 5);
        const tracksToDefer = allTracks.slice(5);

        const downloadedTrackPromises = tracksToDownload.map(async (track) => {
            const { downloadId } = await downloadTrack({
                id: track.spotifyId, name: track.name, artist: track.artist,
                imageUrl: track.imageUrl, duration_ms: track.duration_ms,
            });
            return { ...track, downloadId };
        });

        const downloadedTracks = await Promise.all(downloadedTrackPromises);
        const deferredTracks = tracksToDefer.map(track => ({ ...track, downloadId: null }));

        newPlaylist.tracks = [...downloadedTracks, ...deferredTracks];
        db.playlists.push(newPlaylist);
        writeDB(db);

        console.log(`[Importer] Import for "${newPlaylist.name}" complete. Queued ${downloadedTracks.length} tracks for download.`);
        res.status(201).json(newPlaylist);

    } catch (error) {
        console.error('[Importer] General import error:', error);
        res.status(500).json({ message: 'An error occurred during the import process.', error: error.message });
    }
});

module.exports = router;

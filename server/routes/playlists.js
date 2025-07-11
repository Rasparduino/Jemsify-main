const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../services/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

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

module.exports = router;
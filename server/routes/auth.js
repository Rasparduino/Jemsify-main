const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../services/db');
const router = express.Router();

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

// Register a new user
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ message: 'Please provide a valid email and a password of at least 6 characters.' });
  }

  const db = readDB();
  const userExists = db.users.find(user => user.email === email);
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = {
    id: uuidv4(),
    email,
    password: hashedPassword,
    recentlyPlayed: [] // Initialize with an empty array
  };

  db.users.push(newUser);
  writeDB(db);

  const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, user: { id: newUser.id, email: newUser.email } });
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(user => user.email === email);

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// Get user's recently played tracks
router.get('/recently-played', protect, (req, res) => {
    // req.user is attached by the 'protect' middleware
    const recentlyPlayed = req.user.recentlyPlayed || [];
    
    // Set the Content-Type header and send a valid JSON response.
    // If recentlyPlayed is empty, this will correctly send `[]`.
    res.status(200).json(recentlyPlayed);
});

// --- Liked Songs Routes ---

// Get user's liked songs
router.get('/liked-songs', protect, (req, res) => {
    const likedTracks = req.user.likedTracks || [];
    res.status(200).json(likedTracks);
});

// Add a song to liked songs
router.post('/liked-songs', protect, (req, res) => {
    const track = req.body;
    if (!track || !track.spotifyId) {
        return res.status(400).json({ message: 'Valid track data is required.' });
    }

    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found.' });

    let likedTracks = db.users[userIndex].likedTracks || [];
    
    if (!likedTracks.some(t => t.spotifyId === track.spotifyId)) {
        likedTracks.unshift(track); // Add to the top
        db.users[userIndex].likedTracks = likedTracks;
        writeDB(db);
    }
    
    res.status(200).json(db.users[userIndex].likedTracks);
});

// Remove a song from liked songs
router.delete('/liked-songs/:spotifyId', protect, (req, res) => {
    const { spotifyId } = req.params;
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found.' });

    db.users[userIndex].likedTracks = (db.users[userIndex].likedTracks || []).filter(t => t.spotifyId !== spotifyId);
    writeDB(db);
    
    res.status(200).json(db.users[userIndex].likedTracks);
});

// Add a track to recently played
router.post('/recently-played', protect, (req, res) => {
    const track = req.body;
    if (!track || !track.spotifyId) {
        return res.status(400).json({ message: 'Valid track data is required.' });
    }

    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found.' });
    }
    
    let recentlyPlayed = db.users[userIndex].recentlyPlayed || [];
    
    // Remove existing instance of the track to move it to the front
    recentlyPlayed = recentlyPlayed.filter(t => t.spotifyId !== track.spotifyId);
    
    // Add the new track to the beginning of the array
    recentlyPlayed.unshift(track);
    
    // Keep the list at a maximum of 20 items
    db.users[userIndex].recentlyPlayed = recentlyPlayed.slice(0, 20);
    
    writeDB(db);
    
    res.status(200).json(db.users[userIndex].recentlyPlayed);
});

module.exports = router;

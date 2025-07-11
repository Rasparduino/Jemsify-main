const express = require('express');
const jwt = require('jsonwebtoken');
const { readDB, writeDB } = require('../services/db');
const router = express.Router();

const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const db = readDB();
            req.user = db.users.find(u => u.id === decoded.id);
            if (!req.user) return res.status(401).json({ message: 'User not found' });
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// PUT to update user's now playing status
router.put('/now-playing', protect, (req, res) => {
    const { track } = req.body;
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === req.user.id);
    
    db.users[userIndex].nowPlaying = track ? { ...track, timestamp: new Date().toISOString() } : null;
    
    writeDB(db);
    res.status(200).json({ message: 'Status updated' });
});

module.exports = router;
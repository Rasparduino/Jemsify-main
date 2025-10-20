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

// GET current user's friends and their status
router.get('/', protect, (req, res) => {
    const db = readDB();
    const user = db.users.find(u => u.id === req.user.id);
    const friends = (user.friends || []).map(friendId => {
        const friendData = db.users.find(u => u.id === friendId);
        return {
            id: friendData.id,
            email: friendData.email,
            nowPlaying: friendData.nowPlaying || null
        };
    });
    res.json(friends);
});

// POST to add a new friend by email
router.post('/add', protect, (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const db = readDB();
    const friendToAdd = db.users.find(u => u.email === email);
    if (!friendToAdd) return res.status(404).json({ message: 'User with that email not found' });
    if (friendToAdd.id === req.user.id) return res.status(400).json({ message: 'You cannot add yourself as a friend' });

    const userIndex = db.users.findIndex(u => u.id === req.user.id);
    const user = db.users[userIndex];
    
    if (!user.friends) user.friends = [];
    if (user.friends.includes(friendToAdd.id)) return res.status(400).json({ message: 'You are already friends with this user' });

    user.friends.push(friendToAdd.id);
    writeDB(db);
    res.status(201).json({ message: 'Friend added successfully' });
});

module.exports = router;

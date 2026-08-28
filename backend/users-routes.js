// router using express module

const express = require('express');
const { getDB } = require('./db');

const router = express.Router();

// GET users based on username
router.get('/', async (req, res, next) => {
    try {
        // check user data
        const db = await getDB();
        const users = await db.all('SELECT * FROM users ORDER BY id DESC');
        res.json(users);
    } catch (err) {
        next(err); 
    }
});


// POST users based on username
router.post('/', async (req, res, next) => {
    try {
        const { username } = req.body;
        // check username 
        if (!username || typeof username !== 'string' || username.trim() === '' ) {
            return res.status(400).json({ error: 'Provide valid username'});
        }

        // Create a username
        const db = await getDB();
        const result = await db.run('INSERT INTO users (username) VALUES (?)', username.trim());
        const created = await db.get('SELECT * FROM users WHERE id = ?', result.lastID);
        res.status(201).json(created);
    } catch (err) {
        next(err)
    }
});

module.exports = router; 

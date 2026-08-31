// router using express module

const express = require('express');
const { getDB } = require('./db');

const router = express.Router();

// GET /  --> all data from users based on username
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

// GET /api/employers --> for dropdown
router.get('/api/employers', async (req, res, next) => {
    try{
        const db = await getDB();
        const rows = await db.all(
            "SELECT username FROM users WHERE role = 'Employer' ORDER BY username"
        );
        res.json(rows);
    } catch (err) { 
        next(err)
    }
});


// POST / --> add a record to users table
router.post('/', async (req, res, next) => {
    try {
        const { username } = req.body;
        const { password } = req.body;

        // check username 
        if (!username || typeof username !== 'string' || username.trim() === '' ) {
            return res.status(400).json({ error: 'Provide valid username'});
        }

        // check role
        if (role != 'employer' && role !== 'employee') {
            return res.status(400).json({ error: "role must be 'employer' or 'employee'"});
        }

        const db = await getDB();
        let employerValue = null;

        // check employer_username is valid and save it as employerValue
        if (role === 'employee') {
            if (!employer_name) {
                return res.status(400).json({ error: 'an employee must have an employer'});
            }

            const emp = await db.get(
                "SELECT username FROM users WHERE username = ? AND role = 'employer'", employer_username
            );

            if(!emp) {
                return res.status(400).json({ error: "employer must be an existing user who has a role of 'employer'"})
            } 
            employerValue = employer_username; 
        }

        const result = await db.run(
            "INSERT INTO users (username, role, employer_username) VALUES (?, ?, ?)",
            username.trim(), role, employerValue
        );

        const created = await db.get(
            "SELECT id, username, role, employer_username FROM users WHERE id = ?",
            result.lastID
        );

        res.status(201).json(created);
    } catch (err) { next(err); }
});


module.exports = router; 

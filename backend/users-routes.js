// router using express module

const express = require('express');
const bcrypt = require('bcryptjs');  
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

// GET /employers --> for dropdown
router.get('/employers', async (req, res, next) => {
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
        const { username, password, role, employer_username } = req.body;

        // check username 
        if (!username || typeof username !== 'string' || username.trim() === '' ) {
            return res.status(400).json({ error: 'Provide valid username'});
        }

        // check password
        if (!password || typeof password !== 'string' || password.trim() == '') {
            return res.status(400).json({ error: 'Provide a valid password'})
        }

        // check role
        if (role != 'Employer' && role !== 'Employee') {
            return res.status(400).json({ error: "role must be 'employer' or 'employee'"});
        }

        const db = await getDB();
        let employerValue = null;

        // check employer_username is valid and save it as employerValue
        if (role === 'Employee') {
            if (!employer_username) {
                return res.status(400).json({ error: 'an employee must have an employer'});
            }
            const emp = await db.get(
                "SELECT username FROM users WHERE username = ? AND role = 'Employer'", employer_username
            );
            if(!emp) {
                return res.status(400).json({ error: "employer must be an existing user who has a role of 'employer'"});
            } 
            employerValue = employer_username; 
        }

        const password_hash = await bcrypt.hash(password, 10);

        const result = await db.run(
            "INSERT INTO users (username, password_hash, role, employer_username) VALUES (?, ?, ?, ?)",
            username.trim(), password_hash, role, employerValue
        );

        // make sure password or password_hash is not included
        const created = await db.get(
            "SELECT id, username, role, employer_username FROM users WHERE id = ?",
            result.lastID
        );

        res.status(201).json(created);
    } catch (err) { next(err); }
});

// PUT /:id --> update a user
router.put('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid user id'});

        const { username, password, role, employer_username } = req.body

        if (!username || typeof username !== 'string' || username.trim() === '') {
            return res.status(400).json({ error: 'provide valid username'})
        }
        if (role !== 'Employer' && role !== 'Employee') {
            return res.status(400).json({ error: "role must be Employee or Employer"});
        }

        // begin data management
        const db = await getDB();

        const existing = await db.get("SELECT id FROM users WHERE id = ?", id);
        if (!existing) return res.status(404).json({ error: 'user not found'});

        let employerValue = null;
        if (role === 'Employee') {
            if (!employer_username) return res.status(404).json({ error: 'employer should have employee'});
            const emp = await db.get(
                "SELECT username FROM users WHERE username = ? AND role = 'Employer'", employer_username
            );
            if (!emp) return res.status(400).json({ error: "employer must be already exist with an employer"});
            employerValue = employer_username;
        }

        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            await db.run(
                'UPDATE users SET username = ?, password_hash = ?, role = ?, employer_username = ? WHERE id = ?',
                username.trim(), password_hash, role, employerValue, id
            );
        } else {
            await db.run(
                'UPDATE users SET username = ?, role = ?, employer_username = ? WHERE id = ?', 
                username.trim(), role, employerValue, id
            );
        }



        // for messages
        const updated = await db.get(
            "SELECT id, username, role, employer_username FROM users WHERE id = ?", id 
        );
        res.json(updated);

    } catch (err) { next(err); }
});


// DELETE /:id --> remove usr
router.delete('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        // check that a user number is used
        if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid user id"});

        // user cannot delete itself
        if ( id === req.user.sub) return res.status(400).json({error: 'user cannot delete own account'});

        // begin data management
        const db = await getDB();
        const result = await db.run("DELETE FROM users WHERE id = ?", id);
        if (result.changes === 0 ) return res.status(404).json({ error: "user not found"});
        res.status(204).end();

    } catch (err) { next(err); }
});


module.exports = router; 

// router using express module

const express = require('express');
const bcrypt = require('bcryptjs');  
const mongoose = require('mongoose');
const UsersModel = require('./models/Users');

const router = express.Router();

// id validation check
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);



// GET /  --> all data from users based on username
router.get('/', async (req, res, next) => {
    try {
        // check user data
        const users = await UsersModel.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        next(err); 
    }
});

// GET /employers --> for dropdown
router.get('/employers', async (req, res, next) => {
    try{
        const rows = await UsersModel.find({ role: 'Employer' }).select('username').sort({ username: 1 });
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
        if (!password || typeof password !== 'string' || password.trim() === '') {
            return res.status(400).json({ error: 'Provide a valid password'})
        }

        // check role
        if (role !== 'Employer' && role !== 'Employee') {
            return res.status(400).json({ error: "role must be 'Employer' or 'Employee'"});
        }

        // check if username already exists
        if (await UsersModel.exists({ username: username.trim() })) {
            return res.status(409).json({ error: 'username already taken' });
        }

        let employerValue = null;

        // check employer_username is valid and save it as employerValue
        if (role === 'Employee') {
            if (!employer_username) {
                return res.status(400).json({ error: 'an employee must have an employer'});
            }
            const emp = await UsersModel.findOne({ username: employer_username, role: 'Employer' });
            if(!emp) {
                return res.status(400).json({ error: "employer must be an existing user who has a role of 'employer'"});
            } 
            employerValue = employer_username; 
        }

        const password_hash = await bcrypt.hash(password, 10);
        const created = await UsersModel.create({
            username: username.trim(),
            password_hash,
            role,
            employer_username: employerValue,
        });

        res.status(201).json(created);
    } catch (err) { next(err); }
});

// PUT /:id --> update a user
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ error: 'invalid user id' });

        const { username, password, role, employer_username } = req.body;
        if (!username || typeof username !== 'string' || username.trim() === '') {
            return res.status(400).json({ error: 'provide valid username' });
        }
        if (role !== 'Employer' && role !== 'Employee') {
            return res.status(400).json({ error: 'role must be Employee or Employer' });
        }

        const user = await UsersModel.findById(id);
        if (!user) return res.status(404).json({ error: 'user not found' });

        let employerValue = null;
        if (role === 'Employee') {
            if (!employer_username) return res.status(400).json({ error: 'an employee must have an employer' });
            const emp = await UsersModel.findOne({ username: employer_username, role: 'Employer' });
            if (!emp) return res.status(400).json({ error: "employer must be an existing user with role 'Employer'" });
            employerValue = employer_username;
        }

        // change the fields on the document, then save it
        user.username = username.trim();
        user.role = role;
        user.employer_username = employerValue;
        if (password) user.password_hash = await bcrypt.hash(password, 10);
        await user.save();

        res.json(user);
    } catch (err) { next(err); }
});


// DELETE /:id --> remove usr
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ error: 'invalid user id' });

        // user cannot delete itself (sub is the logged-in user's id, from the JWT)
        if (id === req.user.sub) return res.status(400).json({ error: 'user cannot delete own account' });

        const deleted = await UsersModel.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ error: 'user not found' });
        res.status(204).end();
    } catch (err) { next(err); }
});



module.exports = router; 

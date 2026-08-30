// define routes to support authentication feature

// ensure .env is loaded in memory
require('dotenv').config();


// imports
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDB } = require('./db');

const SECRET = process.env.JWT_SECRET;


// POST API call -- login
async function login(req, res, next) {
    try {
        const { username, password } = req.body
        const db = await getDB();
        const user = await db.get('SELECT * FROM users WHERE username = ?', username)
    
        // are the credentials corect? If not, send a message
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: "Invalid username and/or password. Please try again."});
        }

        // token based on user's ID, username, role, JWT_Password (in .env)
        const token = jwt.sign(
            { sub: user.id, username: user.username, role: user.role }, 
            SECRET, 
            // set an expiry time frame
            { expiresIn: '1h'}
        );
        // create a toekn json with  credentials 
        res.json({token, user: {username: user.username, role: user.role } });
    } catch (error) {
        // more details to help debug
        console.error('login error:', error);
        next(error); }
}


// create a token and add req.user if token is valid
function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    // give an error message if there's no token 
    if (!token) return res.status(401).json({ error: 'Missing token' });

    // check if toekn is valid, give message if it's not.
    try {
        req.user = jwt.verify(token, SECRET);
        next()
    } catch (err) {
        return res.status(401).json({error: 'Token not valid or is expired'});
    }
}

// create a function that checks if there's a role
function requireRole(role) {
    return (req, res, next) => {
        if(req.user && req.user.role === role) return next();
        return res.status(403).json({error: 'Forbiddden' });
    };
}

 module.exports = { login, requireAuth, requireRole}
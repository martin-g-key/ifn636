// Entry point for backend

// use .env file for secrets
require('dotenv').config(); 

// modules 
//const fs = require('fs');
//const path = require('path');
const express = require('express');
const cors = require ('cors');
// modules -- authentication
const {login, requireAuth, requireRole } = require('./auth');

// mongoDB connection
const { connectDB } = require('./config/db');
const usersRouter = require('./users-routes');

// start up express
const app = express();
const PORT = process.env.PORT || 5001;

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next(); 
});


// Functions to be used on every request, before handler
app.use(cors());
app.use(express.json());



// ------ routes ------ 
// authentication routes
app.post('/api/login', login);
app.use('/api/users', requireAuth, requireRole('Employer'), usersRouter);



// routes -- hello world
app.get('/', (req, res) => {
    res.send("API is running. Try /api/health or /api/users :)")
});

// routes -- health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
});


// Mongo DB connection
if (require.main === module) {
    connectDB();
    
    // if the file is run directly, start the server
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}




// error handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
});

module.exports = app;
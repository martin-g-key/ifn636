// Entry point for backend

// use .env file for secrets
require('dotenv').config(); 

// modules 
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require ('cors');

// app functions
const { initDB } = require('./db');
const usersRouter = require('./users-routes');

// start up express
const app = express()
const PORT = process.env.PORT || 3001;

// Functions to be used on every request, before handler
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next(); 
});

// ------ routes ------ 
// routes -- hello world
app.get('/', (req, res) => {
    res.send("API is running. Try /api/health or /api/users :)")
});

// routes -- health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
});

app.use('/api/users', usersRouter)

// error handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
});

// start up 
// check that the data sub directory exists before running sqlite
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true});

// 
if(require.main === module) {
    initDB().then(() => {
        app.listen(PORT, () => {
            console.log(`backend listening on http://localhost:${PORT}`);
        });
    });
}

module.exports = app;
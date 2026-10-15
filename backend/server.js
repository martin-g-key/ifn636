// Entry point for backend

// use .env file for secrets
require('dotenv').config();
const os = require('os');

// modules 
//const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require ('cors');
// modules -- authentication
const {login, requireAuth, requireRole } = require('./auth');

// mongoDB connection
const { connectDB } = require('./config/db');
const usersRouter = require('./users-routes');
const tripsRouter = require('./trips-routes');
const expensesRouter = require('./expense-routes');
const expenseReportsRouter = require('./expense-report-routes');

// start up express
const app = express();
const PORT = process.env.PORT || 5001;

// server id for load balancing / multiple ec2 instances 
const SERVER_ID = process.env.SERVER_ID || os.hostname();

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next(); 
});


// Functions to be used on every request, before handler
app.use(cors());
app.use(express.json());

// the pipeline builds the react app into frontend/dist, so serve it from here
// rather than running a second web server next to this one
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(distPath));


// ------ routes ------ 
// authentication routes
app.post('/api/login', login);
app.use('/api/users', requireAuth, requireRole('Employer'), usersRouter);
app.use('/api/trips', requireAuth, tripsRouter);
// Expense creation is restricted to employees; authentication supplies req.user.
app.use('/api/expenses', requireAuth, requireRole('Employee'), expensesRouter);

// reporting is open to both roles, the router scopes what each one sees
app.use('/api/reports', requireAuth, expenseReportsRouter);


// routes -- hello world
app.get('/', (req, res) => {
    res.send("API is running. Try /api/health or /api/users :)")
});

// routes -- health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server: SERVER_ID})
});


// react router handles the paths inside the app, so anything that is not an
// api call gets index.html and the browser works out which page to show.
// without this a refresh on /expense-reports returns a 404.
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
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
    // Incorrectly formatted JSON is a client input error,
    // not an internal server failure.
    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
});

module.exports = app;
// set up a database for the application using sqllite
require('dotenv').config();

const path = require('path');
const sqlite3 = require('sqlite3'); // database 
const { open } = require('sqlite'); // wrapper

// add for authentication
const bcrypt = require('bcryptjs');


// data base connection 
let dbPromise = null;

function getDB() {
    // create a connection if there is no connection allready
    if (!dbPromise) {
        dbPromise = open({
            filename: process.env.DB_PATH || path.join(__dirname, 'data', 'app.db'),
            driver: sqlite3.Database, 
        });
    }
    return dbPromise;
}

// create a table if it doesn't already exist
async function initDB() {
    const db = await getDB();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id  INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT NOT NULL,
            password_hash   TEXT NOT NULL,
            role    TEXT NOT NULL CHECK (role IN ('employer', 'employee')),
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `);

    // add a generic admin user
    await seedEmployer(db);

    return db
    
}

// run inside initDB after table is created. 
async function seedEmployer(db) {
    const existing = await db.get('SELECT id FROM users WHERE username = ?', 'employer');
    if (!existing) {

        // use an admin password and username from .env
        // use a standaard salt factor of 10 
        const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
        const test_username = process.env.ADMIN_USERNAME;

        await db.run(
            'INSERT INTO users (username, password_hash, role) VALUES (?,?,?)', 
            test_username, hash, 'employer'
        );
        console.log('Seeded admin acct')
    }

}


module.exports = { getDB, initDB };
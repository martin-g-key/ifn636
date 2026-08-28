// set up a database for the application using sqllite
const path = require('path');
const sqlite3 = require('sqlite3'); // database 
const { open } = require('sqlite'); // wrapper

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
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `);
    return db
}

module.exports = { getDB, initDB };
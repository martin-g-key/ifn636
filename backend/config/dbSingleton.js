const mongoose = require('mongoose');

class DatabaseConnection {
    constructor() {
        // Keep one connection manager instance per Node.js process.
        if (DatabaseConnection.instance) {
            return DatabaseConnection.instance;
        }

        this.connectionPromise = null;
        DatabaseConnection.instance = this;
    }

    // Return the existing manager, creating it only on the first call.
    static getInstance() {
        return DatabaseConnection.instance || new DatabaseConnection();
    }

    connect(uri) {
        if (mongoose.connection.readyState === 1) {
            return Promise.resolve(mongoose.connection);
        }

        // Concurrent callers share the same in-progress connection attempt.
        if (!this.connectionPromise) {
            this.connectionPromise = mongoose.connect(uri)
                .then(() => mongoose.connection)
                .finally(() => {
                    this.connectionPromise = null;
                });
        }

        return this.connectionPromise;
    }
}

module.exports = DatabaseConnection;

// configure connection to 
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const UsersModel = require('../models/Users');

// seed Employer User 
async function seedEmployer() {
    const username = process.env.ADMIN_USERNAME;
    const existing = await UsersModel.findOne({ username });

    if (!existing) {
        const password_hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

        await UsersModel.create({
            username,
            password_hash,
            role: "Employer",
            employer_username: username, 
        });
        console.log("Seeded admin acct");
    }
}


// define connectDB function that also calls seedEmployer
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB conection established");
        await seedEmployer();
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    };
}

module.exports = {connectDB, seedEmployer};
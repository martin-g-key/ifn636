// Seed test data: 2 employees under the admin, and 4 trips each for the admin + both employees.
//
// Per person:  prior FY 2025–26  -> 1 Business, 1 Private
//              current FY 2026–27 -> 1 Business, 1 Private
//
// Run from the backend/ folder:   node seed-test-data.js
//
// Safe to re-run: employees are created or updated (not duplicated), and the
// admin's and employees' existing trips are DELETED and replaced each time.
// Don't run this against a database with real trips in it.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UsersModel = require('./models/Users');
const TripsModel = require('./models/Trips');

const EMPLOYEE_PASSWORD = process.env.TEST_EMPLOYEE_PASSWORD;
const EMPLOYEES = [process.env.TEST_EMPLOYEE_A_USERNAME, process.env.TEST_EMPLOYEE_B_USERNAME];

// Each person's trips, oldest first. Odometers carry on from one trip to the next,
// like a real logbook. distance_km and fin_year are NOT set here: the model's
// pre('validate') hook works them out.
function tripsFor(startOdometer) {
    const plan = [
        { trip_date: '2025-08-14', km: 120, purpose: 'Business' }, // FY 2025–26
        { trip_date: '2026-02-21', km: 45,  purpose: 'Private' },  // FY 2025–26
        { trip_date: '2026-07-09', km: 210, purpose: 'Business' }, // FY 2026–27
        { trip_date: '2026-09-26', km: 60,  purpose: 'Private' },  // FY 2026–27
    ];
    let odo = startOdometer;
    return plan.map(({ trip_date, km, purpose }) => {
        const trip = { trip_date, start_odometer: odo, end_odometer: odo + km, purpose };
        odo += km + 300; // some untracked driving between logged trips
        return trip;
    });
}

(async () => {
    const { MONGODB_URI, ADMIN_USERNAME } = process.env;
    if (!MONGODB_URI || !ADMIN_USERNAME) throw new Error('MONGODB_URI or ADMIN_USERNAME missing from .env');

    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    console.log(`Connected to database "${mongoose.connection.name}"`);

    // 1. The admin must already exist (the server's seedEmployer() creates it).
    const admin = await UsersModel.findOne({ username: ADMIN_USERNAME, role: 'Employer' });
    if (!admin) throw new Error(`Admin "${ADMIN_USERNAME}" not found - start the backend once (npm start) to create it`);

    // 2. Create or update the two employees, both reporting to the admin.
    const password_hash = await bcrypt.hash(EMPLOYEE_PASSWORD, 10);
    const employees = [];
    for (const username of EMPLOYEES) {
        const emp = await UsersModel.findOneAndUpdate(
            { username },
            { username, password_hash, role: 'Employee', employer_username: admin.username },
            { upsert: true, new: true, runValidators: true }
        );
        employees.push(emp);
    }
    console.log(`Employees ready: ${EMPLOYEES.join(', ')} (password: ${EMPLOYEE_PASSWORD})`);

    // 3. Replace everyone's trips.
    const people = [
        { user: admin,        startOdometer: 15000 },
        { user: employees[0], startOdometer: 42000 },
        { user: employees[1], startOdometer: 87000 },
    ];
    const { deletedCount } = await TripsModel.deleteMany({ user_id: { $in: people.map((p) => p.user._id) } });
    console.log(`Removed ${deletedCount} existing trip(s) for these users`);

    for (const { user, startOdometer } of people) {
        // create() saves each document individually, so validation and the
        // pre('validate') hook (distance_km, fin_year) run for every trip.
        const created = await TripsModel.create(
            tripsFor(startOdometer).map((t) => ({ ...t, user_id: user._id }))
        );
        console.log(`\n${user.username} (${user.role}):`);
        for (const t of created) {
            const fy = `${t.fin_year - 1}–${String(t.fin_year).slice(-2)}`;
            console.log(`  ${t.trip_date.toISOString().slice(0, 10)}  FY ${fy}  ${t.purpose.padEnd(8)}  ${t.start_odometer} → ${t.end_odometer}  (${t.distance_km} km)`);
        }
    }

    console.log('\n✅ Done. 12 trips created.');
    await mongoose.disconnect();
})().catch(async (err) => {
    console.error('\nError:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});

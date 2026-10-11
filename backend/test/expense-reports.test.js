// Testing using Mocha, Chai, Supertest

process.env.JWT_SECRET = 'test_JWT_SECRET';

const { expect } = require('chai');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../server');
const UsersModel = require('../models/Users');
const Expense = require('../models/Expense');

// build a token the same way auth.js does, so requireAuth accepts it
function tokenFor(user) {
    return jwt.sign(
        { sub: user._id.toString(), username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

describe('Expense reports API', () => {
    let mongo;
    let boss, amy, outsider;
    let bossToken, amyToken;

    before(async function () {
        this.timeout(120000); // first run downloads a MongoDB binary
        mongo = await MongoMemoryServer.create();
        await mongoose.connect(mongo.getUri());

        boss = await UsersModel.create({
            username: 'boss', password_hash: 'x', role: 'Employer', employer_username: 'boss',
        });
        amy = await UsersModel.create({
            username: 'amy', password_hash: 'x', role: 'Employee', employer_username: 'boss',
        });
        const ben = await UsersModel.create({
            username: 'ben', password_hash: 'x', role: 'Employee', employer_username: 'boss',
        });
        // works for a different employer, should never show up in boss's reports
        outsider = await UsersModel.create({
            username: 'outsider', password_hash: 'x', role: 'Employee', employer_username: 'someone-else',
        });

        await Expense.create([
            { user_id: amy._id,      expense_date: '2026-08-15', amount: 45.5, purpose: 'Business',    fin_year: '2026-27', status: 'Approved' },
            { user_id: amy._id,      expense_date: '2026-09-02', amount: 120,  purpose: 'Private', fin_year: '2026-27', status: 'Submitted' },
            { user_id: amy._id,      expense_date: '2025-10-01', amount: 99,   purpose: 'Business',    fin_year: '2025-26', status: 'Approved' },
            { user_id: ben._id,      expense_date: '2026-07-20', amount: 60,   purpose: 'Business',    fin_year: '2026-27', status: 'Approved' },
            { user_id: outsider._id, expense_date: '2026-08-01', amount: 999,  purpose: 'Business',    fin_year: '2026-27', status: 'Approved' },
        ]);

        bossToken = tokenFor(boss);
        amyToken = tokenFor(amy);
    });

    after(async () => {
        await mongoose.disconnect();
        await mongo.stop();
    });

    // --- authentication ---

    it('rejects a request with no token', async () => {
        const res = await request(app).get('/api/reports/expenses');
        expect(res.status).to.equal(401);
    });

    // --- IA-29 role based filtering ---

    it('an employee only sees their own expenses', async () => {
        const res = await request(app)
            .get('/api/reports/expenses')
            .set('Authorization', `Bearer ${amyToken}`);

        expect(res.status).to.equal(200);
        expect(res.body).to.have.lengthOf(3);
    });

    it('an employer only sees their own employees', async () => {
        const res = await request(app)
            .get('/api/reports/expenses')
            .set('Authorization', `Bearer ${bossToken}`);

        expect(res.status).to.equal(200);
        const ids = res.body.map((e) => String(e.user_id));
        expect(ids).to.not.include(String(outsider._id));
    });

    it('an employer never sees private expenses', async () => {
        const res = await request(app)
            .get('/api/reports/expenses')
            .set('Authorization', `Bearer ${bossToken}`);

        expect(res.body.every((e) => e.purpose === 'Business')).to.equal(true);
    });

    // --- IA-30 financial year filter ---

    it('filters by financial year', async () => {
        const res = await request(app)
            .get('/api/reports/expenses?fin_year=2026-27')
            .set('Authorization', `Bearer ${amyToken}`);

        expect(res.status).to.equal(200);
        expect(res.body).to.have.lengthOf(2);
        expect(res.body.every((e) => e.fin_year === '2026-27')).to.equal(true);
    });

    it('lists the financial years that have data', async () => {
        const res = await request(app)
            .get('/api/reports/financial-years')
            .set('Authorization', `Bearer ${amyToken}`);

        expect(res.status).to.equal(200);
        expect(res.body).to.include('2026-27');
        expect(res.body).to.include('2025-26');
    });

    // --- IA-31 export ---

    it('exports as CSV with a header row', async () => {
        const res = await request(app)
            .get('/api/reports/expenses/export?format=csv&fin_year=2026-27')
            .set('Authorization', `Bearer ${amyToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.include('text/csv');

        const lines = res.text.trim().split('\n');
        expect(lines[0]).to.equal('Date,Amount,Purpose,Status,Financial Year');
        expect(lines).to.have.lengthOf(3); // header plus two expenses
    });

    it('sends the CSV as a download', async () => {
        const res = await request(app)
            .get('/api/reports/expenses/export?format=csv')
            .set('Authorization', `Bearer ${amyToken}`);

        expect(res.headers['content-disposition']).to.include('expenses.csv');
    });

    it('formats dates as dd/mm/yyyy and amounts to two decimals', async () => {
        const res = await request(app)
            .get('/api/reports/expenses/export?format=csv&fin_year=2026-27')
            .set('Authorization', `Bearer ${amyToken}`);

        expect(res.text).to.include('15/08/2026');
        expect(res.text).to.include('45.50');
    });

    it('exports as JSON when asked', async () => {
        const res = await request(app)
            .get('/api/reports/expenses/export?format=json')
            .set('Authorization', `Bearer ${amyToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.include('application/json');
        expect(() => JSON.parse(res.text)).to.not.throw();
    });

    it('rejects a format it does not support', async () => {
        const res = await request(app)
            .get('/api/reports/expenses/export?format=pdf')
            .set('Authorization', `Bearer ${amyToken}`);

        expect(res.status).to.equal(400);
        expect(res.body.error).to.include('pdf');
    });

    it('defaults to CSV when no format is given', async () => {
        const res = await request(app)
            .get('/api/reports/expenses/export')
            .set('Authorization', `Bearer ${amyToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.include('text/csv');
    });
});

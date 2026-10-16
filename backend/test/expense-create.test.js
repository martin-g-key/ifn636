process.env.JWT_SECRET = 'test_JWT_SECRET';

const { expect } = require('chai');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../server');
const UsersModel = require('../models/Users');
const Expense = require('../models/Expense');

// Make tokens use the same claims the auth middleware checks.
function tokenFor(user) {
    return jwt.sign(
        { sub: user._id.toString(), username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function todayInBrisbane() {
    // Ensure valid-date tests follow the API's Brisbane calendar date.
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Australia/Brisbane',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function nextDate(date) {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    parsed.setUTCDate(parsed.getUTCDate() + 1);
    return parsed.toISOString().slice(0, 10);
}

function previousDate(date) {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    parsed.setUTCDate(parsed.getUTCDate() - 1);
    return parsed.toISOString().slice(0, 10);
}

describe('Create expense API (IA-26)', () => {
    let mongo;
    let employee;
    let secondEmployee;
    let employer;
    let employeeToken;
    let secondEmployeeToken;
    let employerToken;
    const expenseDate = todayInBrisbane();

    before(async function () {
        this.timeout(120000);
        // Use an in-memory DB to avoid touching real data.
        mongo = await MongoMemoryServer.create();
        await mongoose.connect(mongo.getUri());

        employer = await UsersModel.create({
            username: 'expense-employer',
            password_hash: 'test-hash',
            role: 'Employer',
            employer_username: 'expense-employer',
        });
        employee = await UsersModel.create({
            username: 'expense-employee',
            password_hash: 'test-hash',
            role: 'Employee',
            employer_username: employer.username,
        });
        secondEmployee = await UsersModel.create({
            username: 'expense-second-employee',
            password_hash: 'test-hash',
            role: 'Employee',
            employer_username: employer.username,
        });

        employeeToken = tokenFor(employee);
        secondEmployeeToken = tokenFor(secondEmployee);
        employerToken = tokenFor(employer);
    });

    after(async () => {
        await mongoose.disconnect();
        await mongo.stop();
    });

    it('requires authentication', async () => {
        const res = await request(app)
            .post('/api/expenses')
            .send({ expense_date: expenseDate, amount: 12.34, purpose: 'Business' });

        expect(res.status).to.equal(401);
    });

    it('returns 400 for an empty request body', async () => {
        const res = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${employeeToken}`)
            .send({});

        expect(res.status).to.equal(400);
    });

    it('returns 400 for malformed JSON', async () => {
        const res = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${employeeToken}`)
            .set('Content-Type', 'application/json')
            .send('{"expense_date":');

        expect(res.status).to.equal(400);
        expect(res.body.error).to.equal('Invalid JSON body');
    });

    it('allows only employees to create expenses', async () => {
        const res = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${employerToken}`)
            .send({ expense_date: expenseDate, amount: 12.34, purpose: 'Business' });

        expect(res.status).to.equal(403);
    });

    it('requires authentication to view expenses', async () => {
        const res = await request(app).get('/api/expenses');

        expect(res.status).to.equal(401);
    });

    it('rejects an invalid JWT when viewing expenses', async () => {
        const res = await request(app)
            .get('/api/expenses')
            .set('Authorization', 'Bearer invalid-token');

        expect(res.status).to.equal(401);
    });

    it('returns an empty list when the employee has no expenses', async () => {
        const res = await request(app)
            .get('/api/expenses')
            .set('Authorization', `Bearer ${secondEmployeeToken}`);

        expect(res.status).to.equal(200);
        expect(res.body).to.deep.equal([]);
    });

    it('creates an employee-owned Submitted expense and derives the financial year', async () => {
        const res = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${employeeToken}`)
            .send({
                expense_date: expenseDate,
                amount: 12.34,
                purpose: 'Business',
                // Client values must not replace the authenticated owner or initial status.
                user_id: employer._id.toString(),
                status: 'Approved',
            });

        expect(res.status).to.equal(201);
        expect(res.body).to.include({
            amount: 1234,
            purpose: 'Business',
            status: 'Submitted',
            user_id: employee._id.toString(),
        });
        expect(res.body.fin_year).to.match(/^\d{4}-\d{2}$/);

        await Expense.create({
            user_id: employee._id,
            expense_date: previousDate(expenseDate),
            amount: 900,
            purpose: 'Private',
        });
        await Expense.create({
            user_id: secondEmployee._id,
            expense_date: expenseDate,
            amount: 5000,
            purpose: 'Business',
        });
    });

    it('returns only the employee expenses, newest first', async () => {
        const res = await request(app)
            .get('/api/expenses')
            .set('Authorization', `Bearer ${employeeToken}`);

        expect(res.status).to.equal(200);
        expect(res.body).to.have.lengthOf(2);
        expect(res.body[0].purpose).to.equal('Business');
        expect(res.body[0].status).to.equal('Submitted');
        expect(new Date(res.body[0].expense_date).getTime())
            .to.be.greaterThan(new Date(res.body[1].expense_date).getTime());
        expect(res.body.every((expense) => expense.user_id === employee._id.toString())).to.equal(true);
    });

    for (const [description, body] of [
        ['a missing expense date', { amount: 12.34, purpose: 'Business' }],
        ['an invalid calendar date', { expense_date: '2026-02-30', amount: 12.34, purpose: 'Business' }],
        ['a future date', { expense_date: nextDate(expenseDate), amount: 12.34, purpose: 'Business' }],
        ['a missing amount', { expense_date: expenseDate, purpose: 'Business' }],
        ['a zero amount', { expense_date: expenseDate, amount: 0, purpose: 'Business' }],
        ['a negative amount', { expense_date: expenseDate, amount: -1, purpose: 'Business' }],
        ['an amount with more than two decimal places', { expense_date: expenseDate, amount: 1.234, purpose: 'Business' }],
        ['a missing purpose', { expense_date: expenseDate, amount: 12.34 }],
        ['a purpose outside the accepted values', { expense_date: expenseDate, amount: 12.34, purpose: 'Work' }],
    ]) {
        // Apply the same 400 test to each invalid input case.
        it(`returns 400 for ${description}`, async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send(body);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('error');
        });
    }
});

process.env.JWT_SECRET = 'test_JWT_SECRET';

const { expect } = require('chai');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../server');
const UsersModel = require('../models/Users');
const Expense = require('../models/Expense');

function tokenFor(user) {
    return jwt.sign(
        { sub: user._id.toString(), username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function todayInBrisbane() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Australia/Brisbane',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function dateOffset(date, days) {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    parsed.setUTCDate(parsed.getUTCDate() + days);
    return parsed.toISOString().slice(0, 10);
}

describe('Update expense API (IA-27)', () => {
    let mongo;
    let employee;
    let otherEmployee;
    let employer;
    let employeeToken;
    let otherEmployeeToken;
    let employerToken;
    const today = todayInBrisbane();
    const yesterday = dateOffset(today, -1);

    before(async function () {
        this.timeout(120000);
        mongo = await MongoMemoryServer.create();
        await mongoose.connect(mongo.getUri());

        employer = await UsersModel.create({
            username: 'edit-expense-employer',
            password_hash: 'test-hash',
            role: 'Employer',
            employer_username: 'edit-expense-employer',
        });
        employee = await UsersModel.create({
            username: 'edit-expense-employee',
            password_hash: 'test-hash',
            role: 'Employee',
            employer_username: employer.username,
        });
        otherEmployee = await UsersModel.create({
            username: 'edit-expense-other',
            password_hash: 'test-hash',
            role: 'Employee',
            employer_username: employer.username,
        });

        employeeToken = tokenFor(employee);
        otherEmployeeToken = tokenFor(otherEmployee);
        employerToken = tokenFor(employer);
    });

    after(async () => {
        await mongoose.disconnect();
        await mongo.stop();
    });

    async function createExpense(status = 'Submitted', user = employee) {
        return Expense.create({
            user_id: user._id,
            expense_date: yesterday,
            amount: 1250,
            purpose: 'Business',
            status,
        });
    }

    const validUpdate = {
        expense_date: today,
        amount: 4550,
        purpose: 'Private',
    };

    it('updates the owner’s Submitted expense and refreshes updated_at', async () => {
        const expense = await createExpense();
        const previousUpdatedAt = new Date(Date.now() - 60000);
        await Expense.updateOne(
            { _id: expense._id },
            { $set: { updated_at: previousUpdatedAt } },
            { timestamps: false }
        );

        const response = await request(app)
            .put(`/api/expenses/${expense._id}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .send({
                ...validUpdate,
                user_id: otherEmployee._id.toString(),
                status: 'Approved',
            })
            .expect(200);

        expect(response.body).to.include({
            amount: 4550,
            purpose: 'Private',
            status: 'Submitted',
            user_id: employee._id.toString(),
        });
        expect(new Date(response.body.expense_date).toISOString().slice(0, 10)).to.equal(today);
        expect(new Date(response.body.updated_at).getTime()).to.be.greaterThan(previousUpdatedAt.getTime());
    });

    it('resets a Rejected expense to Submitted when it is edited', async () => {
        const expense = await createExpense('Rejected');

        const response = await request(app)
            .put(`/api/expenses/${expense._id}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .send(validUpdate)
            .expect(200);

        expect(response.body.status).to.equal('Submitted');
    });

    it('does not allow editing another employee’s expense or an unknown expense', async () => {
        const expense = await createExpense();

        await request(app)
            .put(`/api/expenses/${expense._id}`)
            .set('Authorization', `Bearer ${otherEmployeeToken}`)
            .send(validUpdate)
            .expect(404);

        await request(app)
            .put(`/${new mongoose.Types.ObjectId()}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .send(validUpdate)
            .expect(404);

        await request(app)
            .put('/not-an-object-id')
            .set('Authorization', `Bearer ${employeeToken}`)
            .send(validUpdate)
            .expect(404);
    });

    it('allows only employees to edit expenses', async () => {
        const expense = await createExpense();

        await request(app)
            .put(`/api/expenses/${expense._id}`)
            .set('Authorization', `Bearer ${employerToken}`)
            .send(validUpdate)
            .expect(403);

        await request(app)
            .put(`/api/expenses/${expense._id}`)
            .send(validUpdate)
            .expect(401);
    });

    for (const status of ['Approved', 'Paid']) {
        it(`does not allow editing an expense with status ${status}`, async () => {
            const expense = await createExpense(status);

            await request(app)
                .put(`/api/expenses/${expense._id}`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .send(validUpdate)
                .expect(403);
        });
    }

    for (const [description, body] of [
        ['missing required fields', {}],
        ['an invalid date', { ...validUpdate, expense_date: '2026-02-30' }],
        ['a future date', { ...validUpdate, expense_date: dateOffset(today, 1) }],
        ['a zero amount', { ...validUpdate, amount: 0 }],
        ['a negative amount', { ...validUpdate, amount: -1 }],
        ['fractional cents', { ...validUpdate, amount: 4550.5 }],
        ['an unsupported purpose', { ...validUpdate, purpose: 'Work' }],
    ]) {
        it(`rejects updates with ${description}`, async () => {
            const expense = await createExpense();

            await request(app)
                .put(`/api/expenses/${expense._id}`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .send(body)
                .expect(400);
        });
    }
});

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

describe('Mark expense as paid API (IA-33)', () => {
    let mongo;
    let employer;
    let otherEmployer;
    let employee;
    let employerToken;
    let employeeToken;

    before(async function () {
        this.timeout(120000);
        mongo = await MongoMemoryServer.create();
        await mongoose.connect(mongo.getUri());

        employer = await UsersModel.create({
            username: 'payment-employer',
            password_hash: 'test-hash',
            role: 'Employer',
            employer_username: 'payment-employer',
        });
        otherEmployer = await UsersModel.create({
            username: 'other-payment-employer',
            password_hash: 'test-hash',
            role: 'Employer',
            employer_username: 'other-payment-employer',
        });
        employee = await UsersModel.create({
            username: 'payment-employee',
            password_hash: 'test-hash',
            role: 'Employee',
            employer_username: employer.username,
        });

        employerToken = tokenFor(employer);
        employeeToken = tokenFor(employee);
    });

    after(async () => {
        await mongoose.disconnect();
        await mongo.stop();
    });

    async function createExpense({ user = employee, purpose = 'Business', status = 'Approved' } = {}) {
        return Expense.create({
            user_id: user._id,
            expense_date: '2026-08-15',
            amount: 4550,
            purpose,
            status,
        });
    }

    it('requires an Employer role to mark an expense as paid', async () => {
        const expense = await createExpense();

        await request(app)
            .post(`/api/expenses/${expense._id}/pay`)
            .expect(401);
        await request(app)
            .post(`/api/expenses/${expense._id}/pay`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(403);
    });

    it('marks an approved employee business expense as Paid and sets paid_at', async () => {
        const expense = await createExpense();

        const response = await request(app)
            .post(`/api/expenses/${expense._id}/pay`)
            .set('Authorization', `Bearer ${employerToken}`)
            .expect(200);

        expect(response.body.status).to.equal('Paid');
        expect(new Date(response.body.paid_at).getTime()).to.be.closeTo(Date.now(), 5000);

        const saved = await Expense.findById(expense._id);
        expect(saved.status).to.equal('Paid');
        expect(saved.paid_at.getTime()).to.be.closeTo(Date.now(), 5000);
    });

    for (const status of ['Submitted', 'Rejected', 'Paid']) {
        it(`does not allow marking a ${status} expense as paid`, async () => {
            const expense = await createExpense({ status });

            await request(app)
                .post(`/api/expenses/${expense._id}/pay`)
                .set('Authorization', `Bearer ${employerToken}`)
                .expect(409);
        });
    }

    it('does not expose private or another employer’s expenses', async () => {
        const privateExpense = await createExpense({ purpose: 'Private' });
        const otherEmployee = await UsersModel.create({
            username: 'other-payment-employee',
            password_hash: 'test-hash',
            role: 'Employee',
            employer_username: otherEmployer.username,
        });
        const otherExpense = await createExpense({ user: otherEmployee });

        await request(app)
            .post(`/api/expenses/${privateExpense._id}/pay`)
            .set('Authorization', `Bearer ${employerToken}`)
            .expect(404);
        await request(app)
            .post(`/api/expenses/${otherExpense._id}/pay`)
            .set('Authorization', `Bearer ${employerToken}`)
            .expect(404);
    });

    it('returns not found for malformed or unknown expense IDs', async () => {
        await request(app)
            .post('/api/expenses/not-an-object-id/pay')
            .set('Authorization', `Bearer ${employerToken}`)
            .expect(404);
        await request(app)
            .post(`/api/expenses/${new mongoose.Types.ObjectId()}/pay`)
            .set('Authorization', `Bearer ${employerToken}`)
            .expect(404);
    });
});

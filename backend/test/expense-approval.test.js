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

describe('Approve or reject expense API (IA-32)', () => {
    let mongo;
    let employer;
    let otherEmployer;
    let employee;
    let employerToken;
    let employeeToken;
    let otherEmployerToken;

    before(async function () {
        this.timeout(120000);
        mongo = await MongoMemoryServer.create();
        await mongoose.connect(mongo.getUri());

        employer = await UsersModel.create({
            username: 'approval-employer',
            password_hash: 'test-hash',
            role: 'Employer',
            employer_username: 'approval-employer',
        });
        otherEmployer = await UsersModel.create({
            username: 'other-approval-employer',
            password_hash: 'test-hash',
            role: 'Employer',
            employer_username: 'other-approval-employer',
        });
        employee = await UsersModel.create({
            username: 'approval-employee',
            password_hash: 'test-hash',
            role: 'Employee',
            employer_username: employer.username,
        });

        employerToken = tokenFor(employer);
        employeeToken = tokenFor(employee);
        otherEmployerToken = tokenFor(otherEmployer);
    });

    after(async () => {
        await mongoose.disconnect();
        await mongo.stop();
    });

    async function createExpense({ user = employee, purpose = 'Business', status = 'Submitted' } = {}) {
        return Expense.create({
            user_id: user._id,
            expense_date: '2026-08-15',
            amount: 4550,
            purpose,
            status,
        });
    }

    it('requires an Employer role to approve or reject', async () => {
        const expense = await createExpense();

        await request(app)
            .post(`/api/expenses/${expense._id}/approve`)
            .expect(401);
        await request(app)
            .post(`/api/expenses/${expense._id}/approve`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(403);
    });

    it('approves a submitted business expense belonging to the employer’s employee', async () => {
        const expense = await createExpense();

        const response = await request(app)
            .post(`/api/expenses/${expense._id}/approve`)
            .set('Authorization', `Bearer ${employerToken}`)
            .expect(200);

        expect(response.body.status).to.equal('Approved');
        expect(new Date(response.body.approved_at).getTime()).to.be.closeTo(Date.now(), 5000);
        const saved = await Expense.findById(expense._id);
        expect(saved.status).to.equal('Approved');
    });

    it('rejects a submitted business expense belonging to the employer’s employee', async () => {
        const expense = await createExpense();

        const response = await request(app)
            .post(`/api/expenses/${expense._id}/reject`)
            .set('Authorization', `Bearer ${employerToken}`)
            .expect(200);

        expect(response.body.status).to.equal('Rejected');
        expect(response.body.approved_at).to.equal(null);
    });

    it('does not expose private or another employer’s expenses to this employer', async () => {
        const privateExpense = await createExpense({ purpose: 'Private' });
        const otherEmployee = await UsersModel.create({
            username: 'other-approval-employee',
            password_hash: 'test-hash',
            role: 'Employee',
            employer_username: otherEmployer.username,
        });
        const otherExpense = await createExpense({ user: otherEmployee });

        await request(app)
            .post(`/api/expenses/${privateExpense._id}/approve`)
            .set('Authorization', `Bearer ${employerToken}`)
            .expect(404);
        await request(app)
            .post(`/api/expenses/${otherExpense._id}/reject`)
            .set('Authorization', `Bearer ${employerToken}`)
            .expect(404);
    });

    it('only allows Submitted expenses to be decided', async () => {
        const expense = await createExpense({ status: 'Approved' });

        await request(app)
            .post(`/api/expenses/${expense._id}/reject`)
            .set('Authorization', `Bearer ${employerToken}`)
            .expect(409);
    });

    it('returns not found for malformed or unknown expense IDs', async () => {
        await request(app)
            .post('/api/expenses/not-an-object-id/approve')
            .set('Authorization', `Bearer ${employerToken}`)
            .expect(404);
        await request(app)
            .post(`/api/expenses/${new mongoose.Types.ObjectId()}/reject`)
            .set('Authorization', `Bearer ${employerToken}`)
            .expect(404);
    });
});

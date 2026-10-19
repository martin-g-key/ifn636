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

describe('Delete expense API (IA-28)', () => {
    let mongo;
    let employee;
    let otherEmployee;
    let employer;
    let employeeToken;
    let otherEmployeeToken;
    let employerToken;

    before(async function () {
        this.timeout(120000);
        mongo = await MongoMemoryServer.create();
        await mongoose.connect(mongo.getUri());

        employer = await UsersModel.create({
            username: 'delete-expense-employer',
            password_hash: 'test-hash',
            role: 'Employer',
            employer_username: 'delete-expense-employer',
        });
        employee = await UsersModel.create({
            username: 'delete-expense-employee',
            password_hash: 'test-hash',
            role: 'Employee',
            employer_username: employer.username,
        });
        otherEmployee = await UsersModel.create({
            username: 'delete-expense-other',
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

    async function createExpense(user = employee) {
        return Expense.create({
            user_id: user._id,
            expense_date: '2026-10-18',
            amount: 4550,
            purpose: 'Business',
            status: 'Submitted',
        });
    }

    it('allows an employee to delete their own expense', async () => {
        const expense = await createExpense();

        await request(app)
            .delete(`/api/expenses/${expense._id}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(204);

        expect(await Expense.findById(expense._id)).to.equal(null);
    });

    it('does not allow an employee to delete another employee’s expense', async () => {
        const expense = await createExpense();

        await request(app)
            .delete(`/api/expenses/${expense._id}`)
            .set('Authorization', `Bearer ${otherEmployeeToken}`)
            .expect(404);

        expect(await Expense.findById(expense._id)).to.exist;
    });

    it('allows only authenticated employees to delete expenses', async () => {
        const expense = await createExpense();

        await request(app)
            .delete(`/api/expenses/${expense._id}`)
            .expect(401);

        await request(app)
            .delete(`/api/expenses/${expense._id}`)
            .set('Authorization', `Bearer ${employerToken}`)
            .expect(403);

        expect(await Expense.findById(expense._id)).to.exist;
    });

    it('returns 404 for an invalid or unknown expense id', async () => {
        await request(app)
            .delete('/api/expenses/not-an-object-id')
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(404);

        await request(app)
            .delete(`/api/expenses/${new mongoose.Types.ObjectId()}`)
            .set('Authorization', `Bearer ${employeeToken}`)
            .expect(404);
    });
});

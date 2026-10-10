const { expect } = require('chai');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/Users');
const Expense = require('../models/Expense');

describe('Expense model', function () {
    let mongo;
    let user;

    before(async function () {
        this.timeout(120000); // Download MongoDB
        mongo = await MongoMemoryServer.create();
        await mongoose.connect(mongo.getUri());

        user = await User.create({
            username: 'expense-test-user',
            password_hash: 'test-hash',
            role: 'Employee',
            employer_username: 'test-employer',
        });
    });

    after(async () => {
        await mongoose.disconnect();
        await mongo.stop();
    });

    async function expectValidationFailure(expense) {
        try {
            await expense.validate();
        } catch (error) {
            expect(error).to.be.instanceOf(mongoose.Error.ValidationError);
            return;
        }

        expect.fail('Expected expense validation to fail');
    }

    it('defines a compound index for report queries', () => {
        const indexes = Expense.schema.indexes();

        expect(indexes).to.deep.include([
            { user_id: 1, fin_year: 1 },
            {},
        ]);
    });

    it('creates a valid expense and applies defaults and timestamps', async () => {
        const expense = await Expense.create({
            user_id: user._id,
            expense_date: new Date('2026-05-01'),
            amount: 1235,
            purpose: 'Business',
        });

        expect(expense.amount).to.equal(1235);
        expect(expense.status).to.equal('Submitted');
        expect(expense.created_at).to.be.instanceOf(Date);
        expect(expense.updated_at).to.be.instanceOf(Date);
        expect(expense.fin_year).to.equal(2026);

        const json = expense.toJSON();
        expect(json.expense_id).to.equal(expense._id.toString());
        expect(json).to.not.have.property('_id');
    });

    it('rejects a negative amount', async () => {
        await expectValidationFailure(new Expense({
            user_id: user._id,
            expense_date: new Date('2026-05-01'),
            amount: -1,
            purpose: 'Business',
            fin_year: 2026,
        }));
    });

    it('rejects a fractional amount of cents', async () => {
        await expectValidationFailure(new Expense({
            user_id: user._id,
            expense_date: new Date('2026-05-01'),
            amount: 12.5,
            purpose: 'Business',
        }));
    });

    it('rejects a purpose outside the allowed values', async () => {
        await expectValidationFailure(new Expense({
            user_id: user._id,
            expense_date: new Date('2026-05-01'),
            amount: 12,
            purpose: 'Travel',
            fin_year: 2026,
        }));
    });

    it('rejects a status outside the allowed values', async () => {
        await expectValidationFailure(new Expense({
            user_id: user._id,
            expense_date: new Date('2026-05-01'),
            amount: 12,
            purpose: 'Business',
            fin_year: 2026,
            status: 'Pending',
        }));
    });

    it('rejects a user_id that does not exist', async () => {
        await expectValidationFailure(new Expense({
            user_id: new mongoose.Types.ObjectId(),
            expense_date: new Date('2026-05-01'),
            amount: 12,
            purpose: 'Business',
            fin_year: 2026,
        }));
    });

    it('sets fin_year from expense_date and overrides a supplied value', async () => {
        const expense = new Expense({
            user_id: user._id,
            expense_date: new Date('2026-07-01'),
            amount: 12,
            purpose: 'Business',
            fin_year: 2099,
        });

        await expense.validate();

        expect(expense.fin_year).to.equal(2027);
    });
});
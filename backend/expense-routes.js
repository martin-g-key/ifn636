const express = require('express');
const mongoose = require('mongoose');
const Expense = require('./models/Expense');
const UsersModel = require('./models/Users');
const { requireRole } = require('./auth');

const router = express.Router();

function todayInBrisbane() {
    // Apply the project's Australian business time zone 
    // when validating and rejecting future dates.
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Australia/Brisbane',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function isValidExpenseDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value &&
        value <= todayInBrisbane();
}

function isValidAmount(value) {
    return typeof value === 'number' &&
        Number.isFinite(value) &&
        value > 0 &&
        Number.isInteger(value);
}

router.put('/:id', requireRole('Employee'), async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: 'Expense not found' });
    }

    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? req.body
        : {};
    const { expense_date, amount, purpose } = body;

    if (!isValidExpenseDate(expense_date)) {
        return res.status(400).json({ error: 'expense_date must be a valid date no later than today' });
    }
    if (!isValidAmount(amount)) {
        return res.status(400).json({ error: 'amount must be a positive whole number of Australian cents' });
    }
    if (purpose !== 'Business' && purpose !== 'Private') {
        return res.status(400).json({ error: "purpose must be 'Business' or 'Private'" });
    }

    try {
        const expense = await Expense.findOne({
            _id: req.params.id,
            user_id: req.user.sub,
        });
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        if (expense.status !== 'Submitted' && expense.status !== 'Rejected') {
            return res.status(403).json({ error: 'Only Submitted or Rejected expenses can be edited' });
        }

        expense.expense_date = expense_date;
        expense.amount = amount;
        expense.purpose = purpose;
        if (expense.status === 'Rejected') {
            expense.status = 'Submitted';
        }

        await expense.save();
        res.json(expense);
    } catch (err) {
        next(err);
    }
});

async function transitionEmployerExpense(req, res, next, fromStatus, toStatus, timestampField, errorMessage) {
    if (!mongoose.isValidObjectId(req.params.expense_id)) {
        return res.status(404).json({ error: 'Expense not found' });
    }

    try {
        const employees = await UsersModel.find({
            employer_username: req.user.username,
            role: 'Employee',
        }).select('_id');
        const employeeIds = employees.map((employee) => employee._id);
        const scope = {
            _id: req.params.expense_id,
            user_id: { $in: employeeIds },
            purpose: 'Business',
        };
        const expense = await Expense.findOne(scope);

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        if (expense.status !== fromStatus) {
            return res.status(409).json({ error: errorMessage });
        }

        const updates = { status: toStatus };
        if (timestampField) {
            updates[timestampField] = new Date();
        }
        const updatedExpense = await Expense.findOneAndUpdate(
            { ...scope, status: fromStatus },
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        );

        if (!updatedExpense) {
            return res.status(409).json({ error: errorMessage });
        }

        return res.json(updatedExpense);
    } catch (err) {
        return next(err);
    }
}

router.post('/:expense_id/approve', requireRole('Employer'), (req, res, next) =>
    transitionEmployerExpense(
        req, res, next, 'Submitted', 'Approved', 'approved_at',
        'Only Submitted expenses can be approved or rejected'
    ));

router.post('/:expense_id/reject', requireRole('Employer'), (req, res, next) =>
    transitionEmployerExpense(
        req, res, next, 'Submitted', 'Rejected', null,
        'Only Submitted expenses can be approved or rejected'
    ));

router.post('/:expense_id/pay', requireRole('Employer'), (req, res, next) =>
    transitionEmployerExpense(
        req, res, next, 'Approved', 'Paid', 'paid_at',
        'Only Approved expenses can be marked as paid'
    ));

router.post('/', requireRole('Employee'), async (req, res, next) => {
    // Ignore client-supplied ownership and status,
    // those are controlled by auth and workflow.
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? req.body
        : {};
    const { expense_date, amount, purpose } = body;

    if (!isValidExpenseDate(expense_date)) {
        return res.status(400).json({ error: 'expense_date must be a valid date no later than today' });
    }
    if (!isValidAmount(amount)) {
        return res.status(400).json({ error: 'amount must be a positive whole number of Australian cents' });
    }
    if (purpose !== 'Business' && purpose !== 'Private') {
        return res.status(400).json({ error: "purpose must be 'Business' or 'Private'" });
    }

    try {
        const expense = await Expense.create({
            user_id: req.user.sub,
            expense_date,
            amount,
            purpose,
            status: 'Submitted',
        });
        res.status(201).json(expense);
    } catch (err) {
        next(err);
    }
});

module.exports = router;

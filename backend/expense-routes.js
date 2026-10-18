const express = require('express');
const Expense = require('./models/Expense');
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

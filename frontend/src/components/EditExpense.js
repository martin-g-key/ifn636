import React, { useState } from 'react';
import { updateExpense } from '../api';

function today() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Australia/Brisbane',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function expenseDateValue(value) {
    return new Date(value).toISOString().slice(0, 10);
}

export default function EditExpense({ expense, onUpdated, onCancel }) {
    const [expenseDate, setExpenseDate] = useState(expenseDateValue(expense.expense_date));
    const [amount, setAmount] = useState((Number(expense.amount) / 100).toFixed(2));
    const [purpose, setPurpose] = useState(expense.purpose);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSaving(true);

        try {
            const updated = await updateExpense(expense.expense_id, {
                expense_date: expenseDate,
                amount: Math.round(Number(amount) * 100),
                purpose,
            });
            await onUpdated(updated);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>Edit Expense</h3>
            <label htmlFor="edit_expense_date">Expense Date</label>
            <input
                id="edit_expense_date"
                type="date"
                value={expenseDate}
                max={today()}
                required
                onChange={(event) => setExpenseDate(event.target.value)}
            />

            <label htmlFor="edit_expense_amount">Amount ($)</label>
            <input
                id="edit_expense_amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                required
                onChange={(event) => setAmount(event.target.value)}
            />

            <label htmlFor="edit_expense_purpose">Purpose</label>
            <select
                id="edit_expense_purpose"
                value={purpose}
                required
                onChange={(event) => setPurpose(event.target.value)}
            >
                <option value="Business">Business</option>
                <option value="Private">Private</option>
            </select>

            <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={onCancel} disabled={saving}>Cancel</button>
            {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}

import React, { useState } from 'react';
import { createExpense } from '../api';

function today() {
    // Keep the date input's default consistent with
    // the backend's Brisbane‑timezone date validation.
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Australia/Brisbane',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

export default function AddExpense({ onCreated, onCancel }) {
    const [expenseDate, setExpenseDate] = useState(today());
    const [amount, setAmount] = useState('');
    const [purpose, setPurpose] = useState('Business');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSaving(true);

        try {
            // The form is in Australian dollars; the API accepts whole cents.
            const created = await createExpense({
                expense_date: expenseDate,
                amount: Math.round(Number(amount) * 100),
                purpose,
            });
            onCreated(created);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor="expense_date">Expense Date</label>
            <input
                id="expense_date"
                type="date"
                value={expenseDate}
                max={today()}
                required
                onChange={(event) => setExpenseDate(event.target.value)}
            />

            <label htmlFor="expense_amount">Amount ($)</label>
            <input
                id="expense_amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                required
                onChange={(event) => setAmount(event.target.value)}
            />

            <label htmlFor="expense_purpose">Purpose</label>
            <select
                id="expense_purpose"
                value={purpose}
                required
                onChange={(event) => setPurpose(event.target.value)}
            >
                <option value="Business">Business</option>
                <option value="Private">Private</option>
            </select>

            <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Submit Expense'}
            </button>
            <button type="button" onClick={onCancel} disabled={saving}>Cancel</button>
            {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}

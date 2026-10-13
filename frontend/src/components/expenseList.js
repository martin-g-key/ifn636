import React from 'react';

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-AU', { timeZone: 'UTC' });
}

// amounts are stored as whole cents, so 4550 is $45.50
function formatAmount(cents) {
    return (Number(cents || 0) / 100).toFixed(2);
}

export default function ExpenseList({ expenses }) {
    if (expenses.length === 0) return <p>No expenses for that financial year.</p>;

    return (
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Amount ($)</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Financial year</th>
                </tr>
            </thead>
            <tbody>
                {expenses.map((expense) => (
                    <tr key={expense.expense_id}>
                        <td>{formatDate(expense.expense_date)}</td>
                        <td>{formatAmount(expense.amount)}</td>
                        <td>{expense.purpose}</td>
                        <td>{expense.status}</td>
                        <td>{expense.fin_year}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

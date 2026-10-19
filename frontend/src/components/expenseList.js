import React from 'react';

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-AU', { timeZone: 'UTC' });
}

// amounts are stored as whole cents, so 4550 is $45.50
function formatAmount(cents) {
    return (Number(cents || 0) / 100).toFixed(2);
}

export default function ExpenseList({
    expenses,
    onEdit,
    onApprove,
    onReject,
    onPay,
    onDelete,
    updatingExpenseId,
    deletingExpenseId,
}) {
    if (expenses.length === 0) return <p>No expenses for that financial year.</p>;

    const hasActions = onEdit || onApprove || onReject || onPay || onDelete;

    return (
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Amount ($)</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Financial year</th>
                    {hasActions && <th>Actions</th>}
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
                        {hasActions && (
                            <td>
                                {(expense.status === 'Submitted' || expense.status === 'Rejected') && (
                                    onEdit && <button type="button" onClick={() => onEdit(expense)}>
                                        Edit Expense
                                    </button>
                                )}
                                {expense.status === 'Submitted' && onApprove && (
                                    <button
                                        type="button"
                                        disabled={updatingExpenseId === expense.expense_id}
                                        onClick={() => onApprove(expense)}
                                    >
                                        {updatingExpenseId === expense.expense_id ? 'Updating...' : 'Approve'}
                                    </button>
                                )}
                                {expense.status === 'Submitted' && onReject && (
                                    <button
                                        type="button"
                                        disabled={updatingExpenseId === expense.expense_id}
                                        onClick={() => onReject(expense)}
                                    >
                                        {updatingExpenseId === expense.expense_id ? 'Updating...' : 'Reject'}
                                    </button>
                                )}
                                {expense.status === 'Approved' && onPay && (
                                    <button
                                        type="button"
                                        disabled={updatingExpenseId === expense.expense_id}
                                        onClick={() => onPay(expense)}
                                    >
                                        {updatingExpenseId === expense.expense_id ? 'Updating...' : 'Paid'}
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        type="button"
                                        disabled={deletingExpenseId === expense.expense_id}
                                        onClick={() => onDelete(expense)}
                                    >
                                        {deletingExpenseId === expense.expense_id ? 'Deleting...' : 'Delete Expense'}
                                    </button>
                                )}
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

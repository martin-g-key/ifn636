import React, { useEffect, useState } from 'react';
import AddExpense from '../components/AddExpense';
import EditExpense from '../components/EditExpense';
import ExpenseList from '../components/expenseList';
import { decideExpense, fetchExpenses } from '../api';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [updatingExpenseId, setUpdatingExpenseId] = useState(null);
    const isEmployee = typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('role') === 'Employee';
    const isEmployer = typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('role') === 'Employer';

    useEffect(() => {
        let ignore = false;
        fetchExpenses()
            .then((data) => {
                if (!ignore) setExpenses(data);
            })
            .catch((err) => {
                if (!ignore) setError(err.message);
            })
            .finally(() => {
                if (!ignore) setLoading(false);
            });

        return () => { ignore = true; };
    }, []);

    const refreshExpenses = async (successMessage) => {
        setLoading(true);
        setError(null);
        try {
            setExpenses(await fetchExpenses());
            setSubmitted(successMessage);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExpenseUpdated = async () => {
        setEditingExpense(null);
        await refreshExpenses(false);
    };

    const handleExpenseCreated = async () => {
        setShowAddForm(false);
        await refreshExpenses(true);
    };

    const handleExpenseDecision = async (expense, decision) => {
        setUpdatingExpenseId(expense.expense_id);
        setError(null);
        try {
            await decideExpense(expense.expense_id, decision);
            setExpenses(await fetchExpenses());
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingExpenseId(null);
        }
    };

    return (
        <div>
            <h2>Expenses</h2>
            {isEmployee && !showAddForm && !editingExpense && (
                <button
                    type="button"
                    onClick={() => {
                        setSubmitted(false);
                        setShowAddForm(true);
                    }}
                >
                    {submitted ? 'Add another Expense' : 'Add Expense'}
                </button>
            )}
            {isEmployee && showAddForm && (
                <AddExpense
                    onCreated={handleExpenseCreated}
                    onCancel={() => setShowAddForm(false)}
                />
            )}
            {isEmployee && editingExpense && (
                <EditExpense
                    expense={editingExpense}
                    onUpdated={handleExpenseUpdated}
                    onCancel={() => setEditingExpense(null)}
                />
            )}
            {submitted && <p role="status">Expense submitted successfully.</p>}
            {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
            {loading ? (
                <p>Loading...</p>
            ) : (
                <ExpenseList
                    expenses={expenses}
                    onEdit={isEmployee ? setEditingExpense : undefined}
                    onApprove={isEmployer
                        ? (expense) => handleExpenseDecision(expense, 'approve')
                        : undefined}
                    onReject={isEmployer
                        ? (expense) => handleExpenseDecision(expense, 'reject')
                        : undefined}
                    updatingExpenseId={updatingExpenseId}
                />
            )}
        </div>
    );
}
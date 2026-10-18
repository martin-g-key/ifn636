import React, { useState } from 'react';
import AddExpense from '../components/AddExpense';

export default function ExpensesPage() {
    const [showAddForm, setShowAddForm] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const isEmployee = typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('role') === 'Employee';

    return (
        <div>
            <h2>Expenses</h2>
            {isEmployee ? (
                <>
                    {!showAddForm && (
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
                    {showAddForm && (
                        <AddExpense
                            onCreated={() => {
                                setShowAddForm(false);
                                setSubmitted(true);
                            }}
                            onCancel={() => setShowAddForm(false)}
                        />
                    )}
                    {submitted && <p role="status">Expense submitted successfully.</p>}
                </>
            ) : (
                <p>Expense submission is available to employees.</p>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import ExpenseList from '../components/expenseList';
import { fetchExpenseReport, fetchFinancialYears, downloadExpenseReport } from '../api';

// australian financial year runs july to june, so anything from july onwards
// belongs to the year that is starting. same rule the Expense model uses.
function currentFinYear() {
    const now = new Date();
    const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

export default function ExpenseReportPage() {
    const [years, setYears] = useState([]);
    const [finYear, setFinYear] = useState(null);   // null means the years haven't loaded yet
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);

    // runs once when the page loads
    useEffect(() => {
        fetchFinancialYears()
            .then((data) => {
                setYears(data);
                // start on the current financial year, but only if there is data in it
                setFinYear(data.includes(currentFinYear()) ? currentFinYear() : '');
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // runs again every time the dropdown changes
    useEffect(() => {
        if (finYear === null) return;

        setLoading(true);
        setError(null);
        fetchExpenseReport(finYear)
            .then((data) => setExpenses(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [finYear]);

    const handleDownload = () => {
        setDownloading(true);
        setError(null);
        downloadExpenseReport(finYear)
            .catch((err) => setError(err.message))
            .finally(() => setDownloading(false));
    };

    return (
        <div>
            <h2>Expense reports</h2>

            <label htmlFor="fin_year">Financial year</label>

            {/* pico stretches a bare select across the whole page, role=group keeps
                the dropdown and the button together on one line */}
            <div role="group">
                <select
                    id="fin_year"
                    value={finYear === null ? '' : finYear}
                    onChange={(e) => setFinYear(e.target.value)}
                >
                    <option value="">All years</option>
                    {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>

                <button onClick={handleDownload} disabled={downloading || loading}>
                    {downloading ? 'Preparing...' : 'Download CSV'}
                </button>
            </div>

            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {loading ? <p>Loading...</p> : <ExpenseList expenses={expenses} />}
        </div>
    );
}

// Mocha Chai testing for the expense report page and table

const React = require('react');
const { expect } = require('chai');
const { renderToString } = require('react-dom/server');

const ExpenseList = require('../src/components/expenseList').default;
const AddExpense = require('../src/components/AddExpense').default;
const ExpenseReportPage = require('../src/pages/ExpenseReportPage').default;
const { fetchExpenseReport } = require('../src/api');

describe('expenseList component', () => {
    it('shows a message when the financial year has no expenses', () => {
        const html = renderToString(React.createElement(ExpenseList, { expenses: [] }));

        expect(html).to.contain('No expenses for that financial year');
    });

    it('renders a row for each expense passed via props', () => {
        const expenses = [
            { expense_id: '1', expense_date: '2026-08-15', amount: 4550, purpose: 'Business', status: 'Approved', fin_year: '2026-27' },
            { expense_id: '2', expense_date: '2026-09-02', amount: 12000, purpose: 'Private', status: 'Submitted', fin_year: '2026-27' },
        ];

        const html = renderToString(React.createElement(ExpenseList, { expenses }));

        expect(html).to.contain('Business');
        expect(html).to.contain('Private');
        expect(html).to.contain('Approved');
        expect(html).to.contain('2026-27');
    });

    it('renders expenses in the order returned by the API', () => {
        const expenses = [
            { expense_id: '1', expense_date: '2026-08-15', amount: 4550, purpose: 'Private', status: 'Approved', fin_year: '2026-27' },
            { expense_id: '2', expense_date: '2026-09-02', amount: 12000, purpose: 'Business', status: 'Submitted', fin_year: '2026-27' },
        ];

        const html = renderToString(React.createElement(ExpenseList, { expenses }));

        expect(html.indexOf('Private')).to.be.lessThan(html.indexOf('Business'));
        expect(expenses[0].purpose).to.equal('Private');
    });

    // the backend stores cents, so the table has to divide before it shows a dollar amount
    it('shows cents as a dollar amount with two decimal places', () => {
        const expenses = [
            { expense_id: '1', expense_date: '2026-08-15', amount: 4550, purpose: 'Business', status: 'Approved', fin_year: '2026-27' },
        ];

        const html = renderToString(React.createElement(ExpenseList, { expenses }));

        expect(html).to.contain('45.50');
        expect(html).to.not.contain('4550');
    });
});

describe('expense report page', () => {
    it('renders the financial year dropdown and the download button', () => {
        const html = renderToString(React.createElement(ExpenseReportPage));

        expect(html).to.contain('Financial year');
        expect(html).to.contain('All years');
        expect(html).to.contain('Download CSV');
    });

    describe('fetchExpenseReport API selection', () => {
        it('uses the reports endpoint and filters employee expenses by financial year', async () => {
            const originalSessionStorage = global.sessionStorage;
            const originalFetch = global.fetch;
            const expenses = [
                { expense_id: '1', fin_year: '2025-26' },
                { expense_id: '2', fin_year: '2026-27' },
            ];
            let requestedUrl;
            global.sessionStorage = { getItem: (key) => key === 'role' ? 'Employee' : null };
            global.fetch = async (url) => {
                requestedUrl = url;
                return { ok: true, json: async () => expenses };
            };

            try {
                const result = await fetchExpenseReport('2026-27');

                expect(requestedUrl).to.contain('/api/reports/expenses');
                expect(result).to.deep.equal([expenses[1]]);
            } finally {
                global.sessionStorage = originalSessionStorage;
                global.fetch = originalFetch;
            }
        });
    });

    it('shows Add Expense to employees only', () => {
        const originalSessionStorage = global.sessionStorage;
        global.sessionStorage = {
            getItem: (key) => key === 'role' ? 'Employee' : null,
        };
        const employeeHtml = renderToString(React.createElement(ExpenseReportPage));

        global.sessionStorage = {
            getItem: (key) => key === 'role' ? 'Employer' : null,
        };
        const employerHtml = renderToString(React.createElement(ExpenseReportPage));
        global.sessionStorage = originalSessionStorage;

        expect(employeeHtml).to.contain('Add Expense');
        expect(employerHtml).to.not.contain('Add Expense');
    });

    it('renders the add-expense form fields', () => {
        const html = renderToString(React.createElement(AddExpense, {
            onCreated: () => {},
            onCancel: () => {},
        }));

        expect(html).to.contain('Expense Date');
        expect(html).to.contain('Amount ($)');
        expect(html).to.contain('Business');
        expect(html).to.contain('Private');
    });
});

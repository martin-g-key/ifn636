// Mocha Chai testing for the expense report page and table

const React = require('react');
const { expect } = require('chai');
const { renderToString } = require('react-dom/server');

const ExpenseList = require('../src/components/expenseList').default;
const ExpenseReportPage = require('../src/pages/ExpenseReportPage').default;

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
});

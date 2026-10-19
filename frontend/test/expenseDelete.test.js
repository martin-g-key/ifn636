const React = require('react');
const { expect } = require('chai');
const { renderToString } = require('react-dom/server');

const ExpenseList = require('../src/components/expenseList').default;
const { deleteExpense } = require('../src/api');

describe('expense deletion', () => {
    const expenses = [
        { expense_id: '1', expense_date: '2026-08-15', amount: 4550, purpose: 'Business', status: 'Submitted', fin_year: '2026-27' },
        { expense_id: '2', expense_date: '2026-08-16', amount: 4550, purpose: 'Private', status: 'Approved', fin_year: '2026-27' },
        { expense_id: '3', expense_date: '2026-08-17', amount: 4550, purpose: 'Business', status: 'Paid', fin_year: '2026-27' },
    ];

    it('renders a delete action for each expense when the caller allows deletion', () => {
        const html = renderToString(React.createElement(ExpenseList, {
            expenses,
            onDelete: () => {},
        }));

        expect(html.match(/>Delete Expense<\/button>/g)).to.have.lengthOf(expenses.length);
    });

    it('does not render delete actions when no delete callback is provided', () => {
        const html = renderToString(React.createElement(ExpenseList, { expenses }));

        expect(html).to.not.contain('Delete Expense');
    });

    it('sends an authenticated DELETE request and accepts an empty success response', async () => {
        const originalSessionStorage = global.sessionStorage;
        const originalFetch = global.fetch;
        let requestUrl;
        let requestOptions;
        global.sessionStorage = { getItem: (key) => key === 'token' ? 'test-token' : null };
        global.fetch = async (url, options) => {
            requestUrl = url;
            requestOptions = options;
            return { ok: true, status: 204 };
        };

        try {
            await deleteExpense('expense/1');

            expect(requestUrl).to.contain('/api/expenses/expense%2F1');
            expect(requestOptions.method).to.equal('DELETE');
            expect(requestOptions.headers.Authorization).to.equal('Bearer test-token');
        } finally {
            global.sessionStorage = originalSessionStorage;
            global.fetch = originalFetch;
        }
    });

    it('reports the API error when deletion fails', async () => {
        const originalSessionStorage = global.sessionStorage;
        const originalFetch = global.fetch;
        global.sessionStorage = { getItem: () => null };
        global.fetch = async () => ({
            ok: false,
            json: async () => ({ error: 'Expense not found' }),
        });

        try {
            let error;
            try {
                await deleteExpense('missing');
            } catch (err) {
                error = err;
            }

            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.equal('Expense not found');
        } finally {
            global.sessionStorage = originalSessionStorage;
            global.fetch = originalFetch;
        }
    });
});

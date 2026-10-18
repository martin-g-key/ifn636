const React = require('react');
const { expect } = require('chai');
const { renderToString } = require('react-dom/server');

const ExpenseList = require('../src/components/expenseList').default;
const EditExpense = require('../src/components/EditExpense').default;
const { updateExpense } = require('../src/api');

describe('expense editing', () => {
    it('shows edit actions only for Submitted and Rejected expenses', () => {
        const expenses = [
            { expense_id: '1', expense_date: '2026-08-15', amount: 4550, purpose: 'Business', status: 'Submitted', fin_year: '2026-27' },
            { expense_id: '2', expense_date: '2026-08-16', amount: 4550, purpose: 'Private', status: 'Rejected', fin_year: '2026-27' },
            { expense_id: '3', expense_date: '2026-08-17', amount: 4550, purpose: 'Business', status: 'Approved', fin_year: '2026-27' },
            { expense_id: '4', expense_date: '2026-08-18', amount: 4550, purpose: 'Business', status: 'Paid', fin_year: '2026-27' },
        ];

        const html = renderToString(React.createElement(ExpenseList, {
            expenses,
            onEdit: () => {},
        }));

        expect(html.match(/Edit Expense/g)).to.have.lengthOf(2);
    });

    it('does not render edit actions when the caller does not provide edit permission', () => {
        const html = renderToString(React.createElement(ExpenseList, {
            expenses: [
                { expense_id: '1', expense_date: '2026-08-15', amount: 4550, purpose: 'Business', status: 'Submitted', fin_year: '2026-27' },
            ],
        }));

        expect(html).to.not.contain('Edit Expense');
    });

    it('pre-fills the form with the expense date, amount, and purpose', () => {
        const html = renderToString(React.createElement(EditExpense, {
            expense: {
                expense_id: '123',
                expense_date: '2026-08-15T00:00:00.000Z',
                amount: 4550,
                purpose: 'Private',
            },
            onUpdated: () => {},
            onCancel: () => {},
        }));

        expect(html).to.contain('value="2026-08-15"');
        expect(html).to.contain('value="45.50"');
        expect(html).to.contain('<option value="Private" selected="">Private</option>');
    });

    it('sends a cents-based update to the expense endpoint with the saved JWT', async () => {
        const originalSessionStorage = global.sessionStorage;
        const originalFetch = global.fetch;
        let requestUrl;
        let requestOptions;
        global.sessionStorage = { getItem: (key) => key === 'token' ? 'test-token' : null };
        global.fetch = async (url, options) => {
            requestUrl = url;
            requestOptions = options;
            return {
                ok: true,
                json: async () => ({ expense_id: 'expense/1', amount: 4550 }),
            };
        };

        try {
            const updated = await updateExpense('expense/1', {
                expense_date: '2026-08-15',
                amount: 4550,
                purpose: 'Private',
            });

            expect(requestUrl).to.contain('/api/expenses/expense%2F1');
            expect(requestOptions.method).to.equal('PUT');
            expect(requestOptions.headers.Authorization).to.equal('Bearer test-token');
            expect(JSON.parse(requestOptions.body)).to.deep.equal({
                expense_date: '2026-08-15',
                amount: 4550,
                purpose: 'Private',
            });
            expect(updated.amount).to.equal(4550);
        } finally {
            global.sessionStorage = originalSessionStorage;
            global.fetch = originalFetch;
        }
    });
});

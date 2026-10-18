const React = require('react');
const { expect } = require('chai');
const { renderToString } = require('react-dom/server');

const ExpenseList = require('../src/components/expenseList').default;
const { decideExpense } = require('../src/api');

describe('expense payment action', () => {
    const expenses = [
        { expense_id: '1', expense_date: '2026-08-15', amount: 4550, purpose: 'Business', status: 'Approved', fin_year: '2026-27' },
        { expense_id: '2', expense_date: '2026-08-16', amount: 4550, purpose: 'Business', status: 'Submitted', fin_year: '2026-27' },
        { expense_id: '3', expense_date: '2026-08-17', amount: 4550, purpose: 'Business', status: 'Paid', fin_year: '2026-27' },
    ];

    it('renders the Paid action only for Approved expenses when a callback is provided', () => {
        const html = renderToString(React.createElement(ExpenseList, {
            expenses,
            onPay: () => {},
        }));

        expect(html.match(/>Paid<\/button>/g)).to.have.lengthOf(1);
    });

    it('does not render a payment action when no callback is provided', () => {
        const html = renderToString(React.createElement(ExpenseList, { expenses }));

        expect(html).to.not.match(/>Paid<\/button>/);
    });

    it('sends an authenticated POST request to the pay endpoint', async () => {
        const originalSessionStorage = global.sessionStorage;
        const originalFetch = global.fetch;
        let requestUrl;
        let requestOptions;
        global.sessionStorage = { getItem: (key) => key === 'token' ? 'test-token' : null };
        global.fetch = async (url, options) => {
            requestUrl = url;
            requestOptions = options;
            return { ok: true, json: async () => ({ status: 'Paid' }) };
        };

        try {
            const result = await decideExpense('expense/1', 'pay');

            expect(requestUrl).to.contain('/api/expenses/expense%2F1/pay');
            expect(requestOptions.method).to.equal('POST');
            expect(requestOptions.headers.Authorization).to.equal('Bearer test-token');
            expect(result.status).to.equal('Paid');
        } finally {
            global.sessionStorage = originalSessionStorage;
            global.fetch = originalFetch;
        }
    });
});

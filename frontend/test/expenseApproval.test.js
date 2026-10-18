const React = require('react');
const { expect } = require('chai');
const { renderToString } = require('react-dom/server');

const ExpenseList = require('../src/components/expenseList').default;
const { decideExpense } = require('../src/api');

describe('expense approval actions', () => {
    const expenses = [
        { expense_id: '1', expense_date: '2026-08-15', amount: 4550, purpose: 'Business', status: 'Submitted', fin_year: '2026-27' },
        { expense_id: '2', expense_date: '2026-08-16', amount: 4550, purpose: 'Business', status: 'Approved', fin_year: '2026-27' },
    ];

    it('renders Approve and Reject only for Submitted expenses when callbacks are provided', () => {
        const html = renderToString(React.createElement(ExpenseList, {
            expenses,
            onApprove: () => {},
            onReject: () => {},
        }));

        expect(html.match(/>Approve<\/button>/g)).to.have.lengthOf(1);
        expect(html.match(/>Reject<\/button>/g)).to.have.lengthOf(1);
    });

    it('does not render approval actions when callbacks are not provided', () => {
        const html = renderToString(React.createElement(ExpenseList, { expenses }));

        expect(html).to.not.match(/>Approve<\/button>/);
        expect(html).to.not.match(/>Reject<\/button>/);
    });

    for (const decision of ['approve', 'reject']) {
        it(`sends an authenticated ${decision} request`, async () => {
            const originalSessionStorage = global.sessionStorage;
            const originalFetch = global.fetch;
            let requestUrl;
            let requestOptions;
            global.sessionStorage = { getItem: (key) => key === 'token' ? 'test-token' : null };
            global.fetch = async (url, options) => {
                requestUrl = url;
                requestOptions = options;
                return { ok: true, json: async () => ({ status: decision === 'approve' ? 'Approved' : 'Rejected' }) };
            };

            try {
                const result = await decideExpense('expense/1', decision);

                expect(requestUrl).to.contain(`/api/expenses/expense%2F1/${decision}`);
                expect(requestOptions.method).to.equal('POST');
                expect(requestOptions.headers.Authorization).to.equal('Bearer test-token');
                expect(result.status).to.equal(decision === 'approve' ? 'Approved' : 'Rejected');
            } finally {
                global.sessionStorage = originalSessionStorage;
                global.fetch = originalFetch;
            }
        });
    }
});

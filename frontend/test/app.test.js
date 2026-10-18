const React = require('react');
const { expect } = require('chai');
const { renderToString } = require('react-dom/server');

const App = require('../src/App').default;

describe('App authentication', () => {
    it('shows the login page when there is no JWT', () => {
        const originalSessionStorage = global.sessionStorage;
        global.sessionStorage = { getItem: () => null };

        try {
            const html = renderToString(React.createElement(App));

            expect(html).to.contain('Log in');
            expect(html).to.not.contain('Expenses');
        } finally {
            global.sessionStorage = originalSessionStorage;
        }
    });
});

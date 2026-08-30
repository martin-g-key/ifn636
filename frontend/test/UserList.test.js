// Mocha Chai and Sinon testing for React

// import modules & functions
const React = require('react');
const { expect } = require('chai');
const { renderToString } = require('react-dom/server');
//const userList = require('../src/components/userList').default;


const userList = require('../src/components/userList').default;
console.log('Component is:', typeof userList, userList);

// testing
describe('userList component', () => {
  it('shows a friendly message when there are no users', () => {
    



    const html = renderToString(React.createElement(userList, { users: [] }));
    
    expect(html).to.contain('No users yet');
  });

  it('renders eacth username passed via props', () => {
    
    const users = [
        {id: 1, username: 'Vida.Lahey' },
        {id: 2, username: 'Jean.Broome-Norton' },
    ];


    const html = renderToString(React.createElement(userList, {
        users }));

        expect(html).to.contain('Vida.Lahey')
        expect(html).to.contain('Jean.Broome-Norton')
    });
});

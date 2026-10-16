const { expect } = require('chai');
const sinon = require('sinon');
const Users = require('../models/Users');
const Visibility = require('../services/TripVisibility');
describe('IA-20 Trip visibility', () => {
    afterEach(() => sinon.restore());
    it('employees see only their own trips, with the selected year', async () => {
        const filter = await Visibility.buildFilter({ sub: 'employee', role: 'Employee' }, { finYear: '2025-26' });
        expect(filter).to.deep.equal({ user_id: 'employee', fin_year: '2025-26' });
    });
    it('employers see only their own employees and Business trips', async () => {
        const find = sinon.stub(Users, 'find').returns({ select: async () => [{ _id: 'employee' }] });
        const filter = await Visibility.buildFilter({ sub: 'boss-id', username: 'boss', role: 'Employer' });
        expect(find.firstCall.args[0]).to.deep.equal({ role: 'Employee', employer_username: 'boss' });
        expect(filter).to.deep.equal({ user_id: { $in: ['employee'] }, purpose: 'Business' });
    });
    it('unknown roles match no trips', async () => {
        expect(await Visibility.buildFilter({ role: 'Unknown' })).to.deep.equal({ _id: { $in: [] } });
    });
});

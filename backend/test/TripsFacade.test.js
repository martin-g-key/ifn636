const { expect } = require('chai');
const sinon = require('sinon');
const Trips = require('../models/Trips');
const Users = require('../models/Users');
const FinancialYear = require('../services/FinancialYear');
const Facade = require('../services/TripsFacade');
const employee = { sub: 'employee', role: 'Employee' };
async function expectStatus(action, status) {
    let error;
    try { await action(); } catch (err) { error = err; }
    expect(error).to.be.instanceOf(Error); expect(error.status).to.equal(status);
}
describe('Trip Facade', () => {
    afterEach(() => sinon.restore());
    it('IA-21 rejects invalid years when listing', async () => {
        await expectStatus(() => Facade.listTrips(employee, { finYear: 'FY26' }), 400);
    });
    it('IA-21 combines ownership and year when listing', async () => {
        const find = sinon.stub(Trips, 'find').returns({ populate: () => ({ sort: async () => ['trip'] }) });
        expect(await Facade.listTrips(employee, { finYear: '2025-26' })).to.deep.equal(['trip']);
        expect(find.firstCall.args[0]).to.deep.equal({ user_id: 'employee', fin_year: '2025-26' });
    });
    it('includes the current year and sorts dropdown options', async () => {
        sinon.stub(Trips, 'distinct').resolves(['2025-26', null]);
        sinon.stub(FinancialYear, 'current').returns('2026-27');
        expect(await Facade.listFinYearOptions(employee)).to.deep.equal({ fin_years: ['2026-27', '2025-26'], current: '2026-27' });
    });
    it('rejects creation when the owner no longer exists', async () => {
        sinon.stub(Users, 'exists').resolves(null);
        await expectStatus(() => Facade.createTrip(employee, {}), 401);
    });
    it('creates trips with token ownership and ignores protected fields', async () => {
        sinon.stub(Users, 'exists').resolves({ _id: 'employee' });
        const created = { populate: sinon.stub().resolves() };
        const create = sinon.stub(Trips, 'create').resolves(created);
        await Facade.createTrip(employee, { trip_date: '2026-07-09', purpose: 'Business',
            start_odometer: 1, end_odometer: 2, user_id: 'outsider', distance_km: 999, fin_year: '1900-01' });
        expect(create.firstCall.args[0]).to.deep.equal({ trip_date: '2026-07-09', purpose: 'Business',
            start_odometer: 1, end_odometer: 2, user_id: 'employee' });
    });
});

const { expect } = require('chai');
const sinon = require('sinon');
const express = require('express');
const request = require('supertest');
const Trips = require('../models/Trips');
const router = require('../trips-routes');
function appForEmployee() {
    const app = express(); app.use(express.json());
    app.use((req, res, next) => { req.user = { sub: 'employee', role: 'Employee' }; next(); });
    app.use('/api/trips', router); return app;
}
describe('Trip API routes (database calls stubbed)', () => {
    afterEach(() => sinon.restore());
    it('IA-21 lists trips for the selected year', async () => {
        const find = sinon.stub(Trips, 'find').returns({ populate: () => ({ sort: async () => [] }) });
        const res = await request(appForEmployee()).get('/api/trips?fin_year=2025-26');
        expect(res.status).to.equal(200);
        expect(res.body).to.deep.equal([]);
        expect(find.firstCall.args[0]).to.deep.equal({ user_id: 'employee', fin_year: '2025-26' });
    });
    it('IA-21 returns 400 for malformed financial years', async () => {
        const res = await request(appForEmployee()).get('/api/trips?fin_year=FY26');
        expect(res.status).to.equal(400); expect(res.body.error).to.include('2025-26');
    });
    it('IA-21 provides financial-year dropdown options', async () => {
        sinon.stub(Trips, 'distinct').resolves(['2025-26']);
        const res = await request(appForEmployee()).get('/api/trips/fin-years');
        expect(res.status).to.equal(200);
        expect(res.body.fin_years).to.include('2025-26').and.include(res.body.current);
    });
    it('IA-22 downloads trips as CSV', async () => {
        const lean = sinon.stub().resolves([]);
        const sort = sinon.stub().returns({ lean });
        sinon.stub(Trips, 'find').returns({ sort });

        const res = await request(appForEmployee())
            .get('/api/trips/export?fin_year=2026-27');

        expect(res.status).to.equal(200);

        expect(res.headers['content-type'])
            .to.include('text/csv');

        expect(res.headers['content-disposition'])
            .to.match(/attachment; filename="trips_\d{8}_\d{2}-\d{2}\.csv"/);

        expect(res.text)
            .to.include('trip_id,user_id,trip_date');
    });
});

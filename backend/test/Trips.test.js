const { expect } = require('chai');
const mongoose = require('mongoose');
const Trip = require('../models/Trips');
function trip(fields = {}) {
    return new Trip({ user_id: new mongoose.Types.ObjectId(), trip_date: '2026-07-09',
        start_odometer: 1000, end_odometer: 1210, purpose: 'Business', ...fields });
}
describe('Trip model validation', () => {
    it('calculates distance and financial year', async () => {
        const item = trip(); await item.validate();
        expect(item.distance_km).to.equal(210); expect(item.fin_year).to.equal('2026-27');
        const earlier = trip({ trip_date: '2026-06-30' }); await earlier.validate();
        expect(earlier.fin_year).to.equal('2025-26');
    });
    it('rejects backwards, negative and fractional odometers and invalid purposes', async () => {
        for (const fields of [{ end_odometer: 900 }, { start_odometer: -1 },
            { start_odometer: 1.5 }, { end_odometer: 1210.5 }, { purpose: 'Work' }]) {
            let error;
            try { await trip(fields).validate(); } catch (err) { error = err; }
            expect(error, JSON.stringify(fields)).to.be.instanceOf(Error);
        }
    });
});
